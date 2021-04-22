import { ImagecanvasComponent } from '../imagecanvas.component';
import { Mat } from '../OpenCV/Mat';
import { reduceMatChannelsFromImgData } from './../OpenCV/CVHelper';


export function callWatershed(parent: ImagecanvasComponent) {
  parent.undoHelper.callAndPushToStackAndValidate(() => {
    parent.undoHelper.addActionIndex();
    watershed(parent)
  }, 'watershed');
  parent.undoHelper.pushUndoKeypoint();
  parent.undoHelper.pushPriorityKeypoint();
}

export function watershed(parent: ImagecanvasComponent) {
  const width = parent.loadedImg.width;
  const height = parent.loadedImg.height;
  parent.cursorEvents.setMarkerIdMatToPreparedPixels(parent._uiService.prevCursorLabel);
  const markerRGBIdImageData = new ImageData(parent.markerArray, width, height);
  const markerRIdMat = reduceMatChannelsFromImgData(parent, markerRGBIdImageData, 1);

  markerRIdMat.convertTo(markerRIdMat, parent.cv.CV_32SC1)
  parent.cv.watershed(parent.rgbImgMat, markerRIdMat);
  markerRIdMat.convertTo(markerRIdMat, parent.cv.CV_8UC1)

  parent.watershedRGBAArray = convertEncodedWatershedMat(parent, markerRIdMat, width, height);
  const rgbaWatershedImageData = new ImageData(parent.watershedRGBAArray, width, height);
  parent.watershedCx.putImageData(rgbaWatershedImageData, 0, 0);

  parent.cursorEvents.removeOROIDisplay();
  Mat.deleteMat(markerRIdMat)
}

export function convertEncodedWatershedMat(parent: ImagecanvasComponent, markerRIdMat: any, width: number, height: number) {
  const rgbaWatershedArray = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < height; i++) {
    for (let j = 0; j < width; j++) {
      const matPtr = markerRIdMat.ucharPtr(i, j);
      const rgbaPos = (i * width + j) * 4;
      if (matPtr[0] != 0 && matPtr[0] <= parent._uiService.labelArray.length) {
        const rgbArray = parent._uiService.labelArray[matPtr[0] - 1].rgbArray;
        rgbaWatershedArray[rgbaPos] = rgbArray[0];
        rgbaWatershedArray[rgbaPos + 1] = rgbArray[1];
        rgbaWatershedArray[rgbaPos + 2] = rgbArray[2];
        if (matPtr[0] != 1) {
          rgbaWatershedArray[rgbaPos + 3] = 255;
        }
        else {
          rgbaWatershedArray[rgbaPos + 3] = 0;
        }

      }
    }
  }
  return rgbaWatershedArray;
}


  //rgb + rgba
  // convertEncodedWatershedMat(markerRIdMat: any, width: number, height: number) {
  //   const rgbWatershedArray = new Uint8ClampedArray(width * height * 3);
  //   const rgbaWatershedArray = new Uint8ClampedArray(width * height * 4);
  //   for (let i = 0; i < height; i++) {
  //     for (let j = 0; j < width; j++) {
  //       const matPtr = markerRIdMat.ucharPtr(i, j);
  //       const rgbaPos = (i * width + j) * 4;
  //       if (matPtr[0] != 0 && matPtr[0] <= this._uiService.labelMap.length) {
  //         const rgbArray = this._uiService.labelMap[matPtr[0] - 1].rgbArray;
  //         const rgbPos = (i * width + j) * 3;
  //         rgbWatershedArray[rgbPos] = rgbArray[0];
  //         rgbWatershedArray[rgbPos + 1] = rgbArray[1];
  //         rgbWatershedArray[rgbPos + 2] = rgbArray[2];
  //         rgbaWatershedArray[rgbaPos] = rgbArray[0];
  //         rgbaWatershedArray[rgbaPos + 1] = rgbArray[1];
  //         rgbaWatershedArray[rgbaPos + 2] = rgbArray[2];
  //         if (matPtr[0] != 1) {
  //           rgbaWatershedArray[rgbaPos + 3] = 255;
  //         }
  //         else {
  //           rgbaWatershedArray[rgbaPos + 3] = 0;
  //         }

  //       }
  //     }
  //   }
  //   return [rgbWatershedArray, rgbaWatershedArray];
  // }