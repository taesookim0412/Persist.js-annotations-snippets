import { identity } from 'rxjs';
import { Defaults } from 'src/app/annotation/Constants/Defaults';
import { Label } from 'src/app/annotation/labelsutil/LabelMap';
import { ImagecanvasComponent } from '../imagecanvas.component';
import { expandRToRGB, reduceMatChannelsFromImgData } from '../OpenCV/CVHelper';
import { convertCanvasMarkerMatToValidPixels } from './CanvasHelpers';

export class CursorEvents {
  cursorDiameter: number = Defaults.cursorSize * 2
  cursorRadius: number = Defaults.cursorSize;
  cursorTop: number = 0;
  cursorLeft: number = 0;
  offsetLeft: number = 0;
  offsetTop: number = 0;

  constructor(private parent: ImagecanvasComponent) { }
  //Concerning: Action index does not change with non keypoint pushes.
  subscribeToCursorSize = () => this.parent._uiService.cursorSize.subscribe(val => this.parent.undoHelper.callAndPushToStackAndValidate(() => {
    this.parent.undoHelper.addActionIndex();
    this.setCursorSize(val)}, 'cursorSize'));
  subscribeToCursorLabel = () => this.parent._uiService.cursorLabel.subscribe(label => {
    const initial_state_disabled = this.parent._uiService.ST_DISABLED;
    
    if (initial_state_disabled == false)
    this.parent._uiService.setDisabled();
    this.parent.undoHelper.saveStateHelper.invalidateSaveState();
    this.parent.undoHelper.callAndPushToStackAndValidate(() => {
      this.parent.undoHelper.addActionIndex();
      this.onChangeCursorLabel(label);}, 'cursorLabel');
    if (initial_state_disabled == false) 
      this.parent._uiService.setEnabled();
  });
    
  subscribeToScaleFactor = () => this.parent._uiService.scaleFactorUI.subscribe(() => this.resizeCursorRadius(this.parent._uiService.cursorSize.value))
  subscribeToCursorEvents() {
    this.subscribeToCursorSize();
    this.subscribeToCursorLabel();
    this.subscribeToScaleFactor();
  }
  onMousemove($event) { 
    this.cursorTop = $event.pageY - this.cursorRadius - this.parent.thisElement.offsetTop;
    this.cursorLeft = $event.pageX - this.cursorRadius - this.parent.thisElement.offsetLeft;
  }
  //resizes the display cursor -- then width for cursor still stays the same... SINCE
  //After a rescale the cursor must get bigger + that is all.. the drawing stays the same. (scales down in draw)
  resizeCursorRadius(val: number){
    this.cursorRadius = val * this.parent._uiService.scaleFactorUI.value;
    this.cursorDiameter = this.cursorRadius * 2;
  }
  setCursorSize(val: number) {
    this.resizeCursorRadius(val);
    const drawingDiameter = val * 2;
    this.parent.markerCx.lineWidth = drawingDiameter;
    for (let layer of this.parent.colorCanvasCxes){
      layer.lineWidth = drawingDiameter;
    }
  }
  onChangeCursorLabel(label: Label) {
    this.setCursorLabel(label);
    if (this.parent._uiService.prevCursorLabel != undefined)
      this.removeOROIDisplay();
    this.parent._uiService.prevCursorLabel = label;
  }
  removeOROIDisplay() {
    const markerImg:Uint8ClampedArray = this.parent.markerCx.getImageData(0, 0, this.parent.loadedImg.height,this.parent.loadedImg.width).data;
    const rows = this.parent.loadedImg.height;
    const cols = this.parent.loadedImg.width;
    for (let i = 0; i < rows; i++){
      for (let j = 0; j < cols; j++){
        const rgbaIdx = (i*cols + j) * 4;
        if (this.parent.markerArray[rgbaIdx] == 1){  
          markerImg[rgbaIdx] = 0
          markerImg[rgbaIdx + 1] = 0
          markerImg[rgbaIdx + 2] = 0
          markerImg[rgbaIdx + 3] = 0
        } 
      }
    }
    this.parent.markerCx.putImageData(new ImageData(markerImg, cols, rows), 0, 0);
  }
  setCursorLabel(label: Label) {
    //Set color layers to their own values
    for (const [i, layerCx] of this.parent.colorCanvasCxes.entries()){
      if (label.id != i){
        layerCx.strokeStyle = "rgb(0,0,0)";
      }
      else{
        //set to 1,0,0 for exact pixels
        layerCx.strokeStyle = "rgb(255,0,0)"
      }
    }

    //Set the marker mat array then reset color layer
    //TODO: CLICKING TOO QUICKLY CAN CAUSE PROBLEMS. Just add a state variable here later.
    if(this.parent._uiService.prevCursorLabel && this.parent._uiService.prevCursorLabel.id != label.id){
      this.setMarkerIdMatToPreparedPixels(this.parent._uiService.prevCursorLabel, true);
    }

    //Switch marker color to new label color
    this.parent.markerCx.strokeStyle = label.rgbColor;
    //Set previous label to current label
  }
  setMarkerIdMatToPreparedPixels(label: Label, andReset = false){
    const layerCx = this.parent.colorCanvasCxes[label.id];
    let layerCtx_img:ImageData = layerCx.getImageData(0, 0, this.parent.markerEl.width,this.parent.markerEl.height );
    let imgArray:Uint8ClampedArray = layerCtx_img.data;
    for (let i = 0; i < layerCtx_img.height; i++){
      for (let j = 0; j < layerCtx_img.width; j++){
        const rgbaPos = (i*layerCtx_img.width + j) * 4;
        if (imgArray[rgbaPos] == 255)
        {
          this.parent.markerArray[rgbaPos] = label.rgbIdPx;
        }
        if (andReset){
          imgArray[rgbaPos] = 0;
        }
      } 
    }
    if (andReset){
      const newImgData = new ImageData(imgArray, this.parent.loadedImg.width, this.parent.loadedImg.height)
      layerCx.putImageData(newImgData, 0, 0)
    }
  }
  
}