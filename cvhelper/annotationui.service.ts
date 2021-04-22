import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Defaults } from './annotation/Constants/Defaults';
import { Label, LabelMap } from './annotation/labelsutil/LabelMap';
import { ImagecanvasComponent } from './imagecanvas/imagecanvas.component';

@Injectable({
  providedIn: 'root'
})
export class AnnotationuiService {
  labelMapObj = new LabelMap();
  labelArray = this.labelMapObj.labels;
  prevCursorLabel: Label = undefined;
  cursorLabel: BehaviorSubject<Label> = new BehaviorSubject<Label>(this.labelArray[0]);
  cursorSize: BehaviorSubject<number> = new BehaviorSubject<number>(Defaults.cursorSize);
  canvas_imgOpacity: BehaviorSubject<number> = new BehaviorSubject<number>(1);
  canvas_markerOpacity: BehaviorSubject<number> = new BehaviorSubject<number>(0.5);
  canvas_markerIdOpacity: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  canvas_watershedOpacity: BehaviorSubject<number> = new BehaviorSubject<number>(0.35);
  canvas_colorOneShow: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  canvas_colorTwoShow: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  canvas_colorThreeShow: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  canvas_colorShow = [this.canvas_colorOneShow, this.canvas_colorTwoShow, this.canvas_colorThreeShow]

  fadingError = false;
  fadingTemplate_boundingBox = false;
  //TODO: WTf this cast lols
  boundingBoxLens: number[] = [];
  // fadingMessage = "";

  opacityState = 0;
  saveFailed: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  scaleFactor: BehaviorSubject<number> = new BehaviorSubject<number>(Defaults.scaleFactor);
  scaleFactorUI: BehaviorSubject<number> = new BehaviorSubject<number>(1);
  //Multiplier for reducing index values for the matrix after an increased scale factor. 
  //(So this is not an actual multiplier this is a divisor. But it's a multiplier for reduction.)
  scaleFactorUIMultiplier: BehaviorSubject<number> = new BehaviorSubject<number>(1);
  scaleOffset = 0;

  ST_DISABLED = true;

  constructor() { }
  addCursorSize(add: boolean) {
    if (add) {
      this.cursorSize.next(this.cursorSize.value + 1);
    }
    else {
      this.cursorSize.next(Math.max(1, this.cursorSize.value - 1));
    }
  }
  addScaleFactorUI(add: boolean) {
    if (this.scaleFactorUI.value <= 0.25 && add == false)
      return;
    let addend = 0.25;
    if (add == false) {
      addend = -0.25;
    }
    const newScaleFactorUI = this.scaleFactorUI.value + addend;
    this.scaleFactorUI.next(newScaleFactorUI);
    this.scaleFactorUIMultiplier.next(1 / newScaleFactorUI);
    const scaleValFromPrev = this.scaleFactorUI.value / (this.scaleFactorUI.value - addend);
    this.scaleFactor.next(scaleValFromPrev);
    //ImageLoaderService
    // this.scaleYOffset += ?parent.loadedImg.height * scaleValFromPrev;
  }
  setCursorLabel(cursorLabel: Label) {
    if (this.ST_DISABLED)
      return;
    this.cursorLabel.next(cursorLabel);
  }
  setCanvasShow(canvas: BehaviorSubject<number>, state: number) {
    canvas.next(state);
  }
  setDisabled() {
    this.ST_DISABLED = true;
  }
  setEnabled() {
    this.ST_DISABLED = false;
  }
  setOnlyImageOpacity() {
    this.setCanvasShow(this.canvas_imgOpacity, 1);
    this.setCanvasShow(this.canvas_markerOpacity, 0);
    this.setCanvasShow(this.canvas_watershedOpacity, 0)
    this.opacityState = 0;
  }
  setDrawingOpacity() {
    this.setCanvasShow(this.canvas_imgOpacity, 1);
    this.setCanvasShow(this.canvas_markerOpacity, 0.5);
    this.setCanvasShow(this.canvas_watershedOpacity, 0.35)
    this.opacityState = 1;
  }
  setNoMarkerOpacity() {
    this.setCanvasShow(this.canvas_imgOpacity, 1);
    this.setCanvasShow(this.canvas_markerOpacity, 0);
    this.setCanvasShow(this.canvas_watershedOpacity, 0.5)
    this.opacityState = 2;
  }
  setWatershedOpacity() {
    this.setCanvasShow(this.canvas_watershedOpacity, 1)
    this.opacityState = 3;
  }

  safeCall(fnCall: (parentComp: ImagecanvasComponent) => void, parentComp: ImagecanvasComponent) {
    if (this.ST_DISABLED) return;
    this.setDisabled();
    fnCall(parentComp);
    this.setEnabled();
  }

  safeOperator(parent: ImagecanvasComponent, request: string) {
    if (this.ST_DISABLED) return;
    this.setDisabled();
    if (request == 'undo')
      parent.undoHelper.undo();
    else if (request == 'redo')
      parent.undoHelper.redo();
    this.setEnabled();
  }
  enableFadingMessage_bb(bbLens: number[]) {
    this.boundingBoxLens = bbLens;
    this.fadingError = true;
    this.fadingTemplate_boundingBox = true;
    setTimeout(() => {
      this.disableFadingMessage_bb();
    }, 2500)
  }
  disableFadingMessage_bb(){
    this.fadingError = false;
    this.fadingTemplate_boundingBox = false;
  }
}
