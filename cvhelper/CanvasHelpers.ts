import { reduceMatChannelsFromImgData } from '../OpenCV/CVHelper';
import { ImagecanvasComponent } from '../imagecanvas.component';
import { ElementRef } from '@angular/core';

export function setCanvasElementsAndRenderingContexts(parent: ImagecanvasComponent) {
  parent.imgEl = parent.imgcanvas.nativeElement;
  parent.imgCx = parent.imgEl.getContext('2d');
  parent.markerEl = parent.markercanvas.nativeElement;
  parent.markerCx = parent.markerEl.getContext('2d');
  parent.markeridEl = parent.markeridcanvas.nativeElement;
  parent.markeridCx = parent.markeridEl.getContext('2d');
  parent.watershedEl = parent.watershedcanvas.nativeElement;
  parent.watershedCx = parent.watershedEl.getContext('2d');
  parent.bbEl = parent.bbcanvas.nativeElement;
  parent.bbCx = parent.bbEl.getContext('2d');
}
export function setColorCanvasCxes(parent: ImagecanvasComponent) {
  parent.colorCanvases.forEach((element: ElementRef) => {
    element.nativeElement.opacity = 0
    parent.colorCanvasCxes.push(element.nativeElement.getContext('2d'));
  })
}

export async function setImg(parent: ImagecanvasComponent, canvasCtx: CanvasRenderingContext2D, img_fp: string, fn: string) {
    parent._uiService.setDisabled();
    const imgLoad = new Image();
    imgLoad.src = img_fp;
    await imgLoad.decode();

    const width = imgLoad.width;
    const height = imgLoad.height;
    //Requirement: Set canvas sizes before drawing image and before setting to round tip.
    setCanvasSizesToImgSize([
      parent.imgcanvas,
      parent.markercanvas,
      parent.markeridcanvas,
      parent.watershedcanvas,
      parent.bbcanvas,
      ...parent.colorCanvases.toArray()], width, height);    
    //draw img and cache image data
    canvasCtx.drawImage(imgLoad, 0, 0);
    parent.loadedImg = canvasCtx.getImageData(0, 0, imgLoad.width, imgLoad.height);
    
    
    reset_Cursor_Attributes(parent,
      [parent.markerCx,
      ...parent.colorCanvasCxes]);
    //load mask images or empty ones.
    parent.emptyImageData = new ImageData(createBlackImage(height, width), width, height)
    await loadMaskImages(parent, fn);

    //These are initially blank anyways.
    for (let layer of parent.colorCanvasCxes) {
      layer.putImageData(parent.emptyImageData, 0, 0);
    }
    parent.rgbImgMat = reduceMatChannelsFromImgData(parent, parent.loadedImg);
    //set template display values
    setDisplayValues(parent, parent.loadedImg.height, parent.loadedImg.width, parent._uiService.scaleFactorUI.value);
    //subscribe to cursor events after masks are loaded (watersheds)
    parent.cursorEvents.subscribeToCursorEvents();
    parent._uiService.setEnabled();
}


//cache image datas
//Why do I create ImageData everytime
async function loadMaskImages(parent: ImagecanvasComponent, fn: string) {
  const base_img_fn: string = parent._fileManager.sliceFileExt(fn);
  const marker_mask_fn = `${base_img_fn}_markerMask.png`;
  const marker_id_mask_fn = `${base_img_fn}_markerIdMask.png`;
  const color_mask_fn = `${base_img_fn}_colorMask.png`;

  if (parent._fileManager.markerMaskFiles.value.has(marker_mask_fn)) {
    const markerMaskImg = new Image();
    markerMaskImg.src = parent._fileManager.getMarkerMaskFp(marker_mask_fn);
    await markerMaskImg.decode();
    parent.markerCx.drawImage(markerMaskImg, 0, 0);
    parent.loadedMarkerMask = parent.markerCx.getImageData(0, 0, markerMaskImg.width, markerMaskImg.height);
  }
  else {
    parent.markerCx.putImageData(parent.emptyImageData, 0, 0)
    parent.loadedMarkerMask = parent.markerCx.getImageData(0,0,parent.emptyImageData.width, parent.emptyImageData.height)
  }
  if (parent._fileManager.markerIdMaskFiles.value.has(marker_id_mask_fn)) {
    //watershed it too
    const markerIdMaskImg = new Image();
    markerIdMaskImg.src = parent._fileManager.getMarkerIdMaskFp(marker_id_mask_fn);
    await markerIdMaskImg.decode()
    parent.markeridCx.drawImage(markerIdMaskImg, 0, 0);
    parent.loadedMarkerIdMask = parent.markeridCx.getImageData(0, 0, parent.loadedImg.width, parent.loadedImg.height);
    parent.loadedMarkerArray = parent.loadedMarkerIdMask.data;
  }
  else {
    parent.markeridCx.putImageData(parent.emptyImageData, 0, 0)
    parent.loadedMarkerIdMask = parent.markeridCx.getImageData(0,0,parent.emptyImageData.width, parent.emptyImageData.height)
    //Not transparant for sanity; //can be transparant then just make non zeros non transparant probably more sane.
    //TODO: Make Marker ID Sane.
    parent.loadedMarkerArray = createSolidBlackImage(parent.loadedImg.height, parent.loadedImg.width);
  }
  parent.markerArray = parent.loadedMarkerArray.map(x => x);
  if (parent._fileManager.colorMaskFiles.value.has(color_mask_fn)) {
    const colorMaskImg = new Image();
    colorMaskImg.src = parent._fileManager.getColorMaskFp(color_mask_fn);
    await colorMaskImg.decode();
    parent.watershedCx.drawImage(colorMaskImg, 0, 0);
    parent.loadedColorMask = parent.watershedCx.getImageData(0, 0, parent.loadedImg.width, parent.loadedImg.height);
    parent.watershedRGBAArray = parent.loadedColorMask.data;
  }
  else {
    parent.watershedCx.putImageData(parent.emptyImageData, 0, 0)
    parent.loadedColorMask = parent.watershedCx.getImageData(0,0,parent.emptyImageData.width, parent.emptyImageData.height)
    parent.watershedRGBAArray = parent.loadedColorMask.data;
    parent._uiService.setDrawingOpacity();
    // parent._uiService.setCurrentOpacity();
  }
}


export function clearAllLoadedMasks(parent: ImagecanvasComponent){
  parent.loadedMarkerMask = parent.emptyImageData;
  parent.loadedMarkerIdMask = parent.emptyImageData;
  parent.loadedMarkerArray = createSolidBlackImage(parent.loadedImg.height, parent.loadedImg.width);
  parent.loadedColorMask = parent.emptyImageData;
  parent.watershedRGBAArray = parent.loadedColorMask.data;
  setCachedImages(parent);
}


// (One of) first calls in undo stack that does not get called without undo stack.
export function setCachedImages(parent: ImagecanvasComponent) {
  parent.markerCx.putImageData(parent.loadedMarkerMask, 0, 0);
  parent.markeridCx.putImageData(parent.loadedMarkerIdMask, 0, 0);
  parent.watershedCx.putImageData(parent.loadedColorMask, 0, 0);
  parent.markerArray = parent.loadedMarkerArray.map(x => x);
  for (let colorCx of parent.colorCanvasCxes){
    colorCx.putImageData(parent.emptyImageData, 0, 0);
  }
}

// export function setCanvasContextImageData(canvasCx, imageData: ImageData, width: number, height: number) {
//   canvasCx.putImageData(imageData, 0, 0);
// }

export function reset_Cursor_Attributes(parent: ImagecanvasComponent, canvasesCtxes: CanvasRenderingContext2D[]) {
  for (let canvasCx of canvasesCtxes) {
    canvasCx.lineCap = 'round';
  }
  // parent.cursorEvents.setCursorSize(parent._uiService.cursorSize.value);
}

//PutImageData defaults the alpha layer to 0 (Transparent);
export function createBlackImage(height: number, width: number) {
  const res = new Uint8ClampedArray(width * height * 4);
  return res;
}
export function createSolidBlackImage(height: number, width: number) {
  const res = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    res[i * 4 + 3] = 255;
  }
  return res;
}

export function convertCanvasMarkerMatToValidPixels(markerRMat: any, srcPsuedoNonePixel: number): any {

  const rows = markerRMat.rows;
  const cols = markerRMat.cols;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let ptr = markerRMat.ucharPtr(i, j);
      if (ptr[0] == srcPsuedoNonePixel) {
        ptr[0] = 0;
      }
    }
  }
  return markerRMat;
}


export function interpolateMarkerWatershedMask_fromIdToRGB(markerRMat: any, labelIdToRgbArrayMap: Map<number, number[]>): Uint8ClampedArray {
  const rows = markerRMat.rows;
  const cols = markerRMat.cols;
  const res = new Uint8ClampedArray(rows * cols * 4);
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const markerPixPtr = markerRMat.ucharPtr(i, j)[0]
      const rgbArray: number[] = labelIdToRgbArrayMap.get(markerPixPtr)
      //console.log(markerRMat.ucharPtr(i, j)[0]);
      const rgbaPos = (i * cols + j) * 4;
      if (rgbArray) {
        res[rgbaPos] = rgbArray[0];
        res[rgbaPos + 1] = rgbArray[1];
        res[rgbaPos + 2] = rgbArray[2];
      }
      res[rgbaPos + 3] = 255;
    }
  }
  return res;
}


export function setCanvasSizesToImgSize(canvasEls: ElementRef[], width, height) {
  for (let canvasEl of canvasEls) {
    canvasEl.nativeElement.width = width;
    canvasEl.nativeElement.height = height;
  }
}

//Asynchronous --> Disable rescale buttons while loading images.
export function subscribeToRescaleFactor(parent: ImagecanvasComponent) { parent._uiService.scaleFactor.subscribe(scaleFactor => setDisplayValues(parent, parent.displayHeight.value, parent.displayWidth.value, scaleFactor)) }


function setDisplayValues(parent: ImagecanvasComponent, height: number, width: number, rescaleFactor: number) {
  if (!height && !width) return;

  parent.displayHeight.next(height * rescaleFactor);
  parent.displayWidth.next(width * rescaleFactor);

}
