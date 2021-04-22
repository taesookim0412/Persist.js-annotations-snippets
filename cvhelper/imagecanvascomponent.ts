import { AfterViewInit, Component, ElementRef, EventEmitter, Host, HostListener, Input, OnInit, Output, QueryList, Self, ViewChild, ViewChildren } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { captureEvents } from './canvasutil/CanvasDraw'
import { CursorEvents } from './canvasutil/CursorEvents'
import { clearAllLoadedMasks, setCachedImages, setCanvasElementsAndRenderingContexts, setColorCanvasCxes, setImg, subscribeToRescaleFactor } from './canvasutil/CanvasHelpers'
import { reduceMatChannelsFromImgData } from './OpenCV/CVHelper';
import { ScriptService } from '../script-service.service';
import { Mat } from './OpenCV/Mat';
import { AnnotationuiService } from '../annotationui.service';
import { FilemanagerService } from '../annotation/filemanager/filemanager.service';
import { UndoStack } from './UndoStack/UndoStack';
import { LimitsService } from '../limits/limits.service';
import { watershed } from './Watershed/Watershed';
import { observeFileManager } from '../annotation/filemanager/FileManagerHelper';
import { BoundingBox } from './BoundingBox/BoundingBox';
import { AnnotationComponent } from '../annotation/annotation.component';


@Component({
  selector: 'app-imagecanvas',
  templateUrl: './imagecanvas.component.html',
  styleUrls: ['./imagecanvas.component.scss']
})
export class ImagecanvasComponent implements AfterViewInit {
  cv: any;
  emptyImageData: ImageData;
  cursorEvents: CursorEvents = new CursorEvents(this);
  boundingBox: BoundingBox = new BoundingBox(this);
  thisElement: HTMLElement
  undoHelper = new UndoStack();
  //Used for undo stack;
  loadedImg: ImageData;
  loadedMarkerMask: ImageData;
  loadedMarkerIdMask: ImageData;
  loadedMarkerArray: Uint8ClampedArray;
  loadedColorMask: ImageData;
  @ViewChild('imgcanvasparent') public imgcanvasparent: ElementRef;
  @ViewChild('imgcanvas') public imgcanvas: ElementRef;
  @ViewChild('markercanvas') public markercanvas: ElementRef;
  @ViewChild('markeridcanvas') public markeridcanvas: ElementRef;
  @ViewChild('watershedcanvas') public watershedcanvas: ElementRef;
  @ViewChild('bbcanvas') public bbcanvas: ElementRef;
  @ViewChildren('colorcanvases') public colorCanvases: QueryList<ElementRef>;
  colorCanvasCxes: CanvasRenderingContext2D[] = [];
  markerArray: Uint8ClampedArray;
  watershedRGBAArray: Uint8ClampedArray;
  imgEl: HTMLCanvasElement;
  imgCx: CanvasRenderingContext2D;
  markerEl: HTMLCanvasElement;
  markerCx: CanvasRenderingContext2D;
  markeridEl: HTMLCanvasElement;
  markeridCx: CanvasRenderingContext2D;
  watershedEl: HTMLCanvasElement;
  watershedCx: CanvasRenderingContext2D;
  bbEl: HTMLCanvasElement;
  bbCx: CanvasRenderingContext2D;
  rgbImgMat: any;
  displayHeight = new BehaviorSubject<number>(0);
  displayWidth = new BehaviorSubject<number>(0);


  constructor(@Self() public thisElementRef: ElementRef, private _scriptService: ScriptService, public _uiService: AnnotationuiService, public _fileManager: FilemanagerService, public limitsService: LimitsService) {
    this.thisElement = thisElementRef.nativeElement;
    this._scriptService.cv.subscribe(obj => {
      if (obj != null) this.cv = obj;
    })

  }
  @HostListener('mousemove', ['$event'])
  onMousemove($event) { this.cursorEvents.onMousemove($event); }

  ngAfterViewInit(): void {
    this.reset();
    observeFileManager(this);
    // setTimeout(() => this.parentElement.watershedRadioInputEl.checked = true, 3000)


  }


  private reset() {
    setCanvasElementsAndRenderingContexts(this);
    setColorCanvasCxes(this);
    // setImg(this, this.imgCx, "../../assets/ex1_img.jpg")
    //Alternative: Capture from the div containing the canvases
    captureEvents(this.markerEl, [this.markerCx, this.markeridCx, ...this.colorCanvasCxes], this._uiService.scaleFactorUIMultiplier, this);
    subscribeToRescaleFactor(this);
  }






}