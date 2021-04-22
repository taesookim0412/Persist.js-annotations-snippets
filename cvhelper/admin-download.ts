import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as moment from 'moment';
import { FilemanagerService } from '../annotation/filemanager/filemanager.service';
import { LimitsService } from '../limits/limits.service';
import { ScriptService } from '../script-service.service';
import { AdminService } from './admin.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit, AfterViewInit {

  // @ViewChild("testImg") testImg: ElementRef
  // @ViewChild("testCanvas") testCanvas: ElementRef
  @ViewChild("newImgsZip") newImgsZip:ElementRef;
  newImgsZipEl: HTMLInputElement;
  img = 0
  marker = 1
  markerid = 2
  colormask = 3

  warning = false;
  warning_msg = ""


  // testCanvasEl:HTMLCanvasElement;

  constructor(private adminService: AdminService, private scriptService: ScriptService,  public fileService: FilemanagerService, public limitsService: LimitsService) { }
  ngAfterViewInit(): void {
    // this.testCanvasEl = this.testCanvas.nativeElement;
    this.newImgsZipEl = this.newImgsZip.nativeElement;
  }

  ngOnInit(): void {
  }
  
  async downloadMarkerMasks() {
    await this.scriptService.loadJsZipAndFileSaver()
    const zip = this.scriptService.jsZip.value();
    this.adminService.downloadMarkerMasks().subscribe(data => {
      for (let i = 0; i < data['files'].length; i++){
        zip.file(data['fileNames'][i], data['files'][i], {base64: true});
      }
      zip.generateAsync({type:"blob"}).then((blob) => {
        this.scriptService.fileSaver.value.saveAs(blob, `markerMasks${JSON.stringify(moment.now())}.zip`)
      })
    });
  }
  async downloadMarkerIdMasks() {
    await this.scriptService.loadJsZipAndFileSaver()
    const zip = this.scriptService.jsZip.value();
    this.adminService.downloadMarkerIdMasks().subscribe(data => {
      for (let i = 0; i < data['files'].length; i++){
        zip.file(data['fileNames'][i], data['files'][i], {base64: true});
      }
      zip.generateAsync({type:"blob"}).then((blob) => {
        this.scriptService.fileSaver.value.saveAs(blob, `markerIdMasks${JSON.stringify(moment.now())}.zip`)
      })
    });
  }
  async downloadColorMasks() {
    await this.scriptService.loadJsZipAndFileSaver()
    const zip = this.scriptService.jsZip.value();
    this.adminService.downloadColorMasks().subscribe(data => {
      for (let i = 0; i < data['files'].length; i++){
        zip.file(data['fileNames'][i], data['files'][i], {base64: true});
      }
      zip.generateAsync({type:"blob"}).then((blob) => {
        this.scriptService.fileSaver.value.saveAs(blob, `colorMasks${JSON.stringify(moment.now())}.zip`)
      })
    });
  }
  async downloadBoundingBoxes() {
    await this.scriptService.loadJsZipAndFileSaver()
    const zip = this.scriptService.jsZip.value();
    this.adminService.downloadBoundingBoxes().subscribe(data => {
      for (let i = 0; i < data['files'].length; i++){
        zip.file(data['fileNames'][i], data['files'][i]);
      }
      zip.generateAsync({type:"blob"}).then((blob) => {
        this.scriptService.fileSaver.value.saveAs(blob, `boundingBoxes${JSON.stringify(moment.now())}.zip`)
      })
    });
  }
  async setImgFront(imgFront: number){
    await this.limitsService.setImgFront(imgFront);
  }
  async resetImgFront(){
    const data = await this.fileService.putImgFront().toPromise();
    this.fileService.imgFront = data['imgfront'];
  }
  async uploadImgsZip(){
    const file = this.newImgsZipEl.files[0];
    if (file.type != "application/x-zip-compressed") return;
    const formData = new FormData();    
    const blob = new Blob([file], {type: "application/x-zip-compressed"})
    formData.append('file', blob, `imgs_${JSON.stringify(moment.now())}.zip`)
    const data = await this.adminService.uploadImgsZip(formData).toPromise();
    
    
  }

}
