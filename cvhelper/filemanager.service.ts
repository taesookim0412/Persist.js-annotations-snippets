import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, Observer, Subject, timer } from 'rxjs';
import { delayWhen, map, retryWhen, tap } from 'rxjs/operators';
import { HttpService } from 'src/app/http.service';

@Injectable({
  providedIn: 'root'
})
export class FilemanagerService {

  uninitialized = 'Uninitialized'
  imgFiles: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([this.uninitialized])
  markerMaskFiles: BehaviorSubject<Set<string>> = new BehaviorSubject<Set<string>>(new Set(this.uninitialized))
  markerIdMaskFiles: BehaviorSubject<Set<string>> = new BehaviorSubject<Set<string>>(new Set(this.uninitialized))
  colorMaskFiles: BehaviorSubject<Set<string>> = new BehaviorSubject<Set<string>>(new Set(this.uninitialized))
  imgFront = 0;
  currentImgIndex: number = 0;
  nextImgIndex: number = 0;
  //0: Uninitialized
  //1: Initialized
  //2: Switching images
  //
  status: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  root_url = ""
  imgs_path = "imgs"
  marker_masks_path = "marker_masks"
  markerid_masks_path = "markerid_masks"
  color_masks_path = "color_masks"
  

  constructor(public _http: HttpService) {
    this.resetImgs();
  }
  resetImgs(){
    this.status.next(0);
    //These are synchronous so errors dont form.
    forkJoin({
      imgFiles: this._http.getImgs(),
      markerMaskFiles: this._http.getMarkerMasks(),
      markerIdMaskFiles: this._http.getMarkerIdMasks(),
      colorMaskFiles: this._http.getColorMasks(),
      imgFront: this._http.getImgFront()
      })
      .subscribe(({imgFiles, markerMaskFiles, markerIdMaskFiles, colorMaskFiles, imgFront})=> {
        this.imgFiles.next(imgFiles['files']);
        this.markerMaskFiles.next(new Set(markerMaskFiles['files']));
        this.markerIdMaskFiles.next(new Set(markerIdMaskFiles['files']));
        this.colorMaskFiles.next(new Set(colorMaskFiles['files']));
        this.imgFront = imgFront['imgfront'];
        this.currentImgIndex = this.imgFront;
        this.nextImgIndex = this.imgFront;
        this.status.next(1);
      })
  }

  public switchImage(addend: number){
    //add 1 or -1 to index or return if out of bounds.
    let nextIndex = this.currentImgIndex + addend
    if (addend == -1) nextIndex = Math.max(this.imgFront, nextIndex)
    if (nextIndex == this.imgFiles.value.length || nextIndex == -1)
      return;
    this.nextImgIndex = nextIndex;
    this.status.next(2);
  }
  //'viable' means the closest nearest next image that has no mask on file.
  public switchToViableImage(){
    //add 1 or -1 to index or return if out of bounds.
    const nextIndex = this.nextMasklessImage();
    if (nextIndex >= this.imgFiles.value.length || nextIndex < 0)
      return;
    this.nextImgIndex = nextIndex;
    this.status.next(2);
  }

  nextMasklessImage(){
    let imgIdx = this.currentImgIndex + 1;
    while (imgIdx < this.imgFiles.value.length){
      const base_name = this.sliceFileExt(this.imgFiles.value[imgIdx]);
      const colorMask_name = this.getColorMaskExtFromBaseName(base_name);
      if (!this.colorMaskFiles.value.has(colorMask_name)){
        return imgIdx;
      }
      imgIdx += 1;
    }
    return this.imgFiles.value.length - 1;
  }
  
  //helpers
  public sliceFileExt(s: string): string {
    return s.slice(0, s.length - 4);
  }
  public getCurrentImgFn(){
    return this.imgFiles.value[this.currentImgIndex];
  }
  public getCurrentImgBaseFn(){
    return this.sliceFileExt(this.getCurrentImgFn());
  }
  public getColorMaskExtFromBaseName(base_name: string){
    return `${base_name}_colorMask.png`
  }

  public getImgFp(fn: string){
    return `${this.root_url}/${this.imgs_path}/${fn}`;
  }
  public getMarkerMaskFp(fn: string){
    return `${this.root_url}/${this.marker_masks_path}/${fn}`;
  }
  public getMarkerIdMaskFp(fn: string){
    return `${this.root_url}/${this.markerid_masks_path}/${fn}`;
  }
  public getColorMaskFp(fn: string){
    return `${this.root_url}/${this.color_masks_path}/${fn}`;
  }
  public getImgFront(){
    return this._http.getImgFront();
  }
  public putImgFront(){
    return this._http.putImgFront();
  }
  
  postMarkerMask(blob){
    return this._http.postMarkerMask(blob);
  }
  postMarkerIdMask(blob){
    return this._http.postMarkerIdMask(blob);
  }
  postColorMask(blob){
    return this._http.postColorMask(blob);
  }
  postBbox(blob){
    return this._http.postBbox(blob);
  }

}
