import { clearAllLoadedMasks, setCachedImages, setImg } from "src/app/imagecanvas/canvasutil/CanvasHelpers";
import { ImagecanvasComponent } from "src/app/imagecanvas/imagecanvas.component";

export function observeFileManager(parent: ImagecanvasComponent) {
  //on image load
  const LOAD_IMG = 1;
  //Either bring up an alert for saving or switch images.
  const ALERT_CHANGES = 2;
  //?? Saving and switching
  const SAVE_SWITCHING = 3;
  //Reverts next image and does nothing
  const DO_NOTHING = 4;
  //Discard all changes and switches image
  const DISCARD_CHANGES = 5;
  //Reload image UI button
  const RELOAD_IMG = 6;
  //Brings up alert for clear all button
  const CLEAR_ALL_ALERT = 7;
  //Bricks image
  const BRICK_IMG = 8;
  //Alerts bounding box viability
  const ALERT_BB = 9;

  const ALERT_BB_FAILED = 10;
  const ALERT_BB_SUCCESS = 11;
  parent._fileManager.status.subscribe(async statusCode => {
    if (statusCode != ALERT_CHANGES) {
      parent._uiService.setWatershedOpacity();
    }
    //Initialized / Change To Index Image.
    if (statusCode == LOAD_IMG) {

      parent.undoHelper.reset();
      const currentImage = parent._fileManager.imgFiles.value[parent._fileManager.currentImgIndex]
      await setImg(parent, parent.imgCx, parent._fileManager.getImgFp(currentImage), currentImage);
      parent.undoHelper.pushToStack(() => {
        //push load to stack but dont call..
        setCachedImages(parent);
      }, 'load_img')
      parent.undoHelper.saveStateHelper.reset();

    }
    //2: Determine whether changes were made.
    //If changes were made then prompt to save changes(change to 3 also add to idx via onclick)
    else if (statusCode == ALERT_CHANGES) {
      if (parent.undoHelper.saveStateHelper.currentSaveState.value)
        parent._fileManager.status.next(DISCARD_CHANGES)
      //save image
      parent._uiService.setDisabled();
      //Nothing required here
    }
    //Attempt to save image
    else if (statusCode == SAVE_SWITCHING) {
      saveImage(parent);
      if (parent._uiService.saveFailed.value) {
        parent._fileManager.status.next(DO_NOTHING);
      }
    }
    //Do Nothing
    else if (statusCode == DO_NOTHING) {
      //do nothing
      parent._fileManager.nextImgIndex = parent._fileManager.currentImgIndex;
      parent._uiService.setEnabled()
    }
    //(go next image)
    else if (statusCode == DISCARD_CHANGES) {
      parent._fileManager.currentImgIndex = parent._fileManager.nextImgIndex;
      parent._fileManager.status.next(1);
    }
    else if (statusCode == BRICK_IMG) {
      if (parent.limitsService.clearAllLimit > 0) {
        parent.limitsService.subtractClearAll();
        clearAllLoadedMasks(parent)
      }
    }
    else if (statusCode == ALERT_BB_FAILED) {
    }
    else if (statusCode == ALERT_BB_SUCCESS) {
    }

  })
}
export function onPostImg(parent: ImagecanvasComponent, postCt) {
  //On successful save push files then set to next index and re-enable UI.
  if (postCt == 4) {
    const isOnSwitch = parent._fileManager.currentImgIndex != parent._fileManager.nextImgIndex;
    const currentImgBaseFn = parent._fileManager.getCurrentImgBaseFn()
    //push 
    parent._fileManager.markerMaskFiles.value.add(`${currentImgBaseFn}_markerMask.png`)
    parent._fileManager.markerIdMaskFiles.value.add(`${currentImgBaseFn}_markerIdMask.png`)
    parent._fileManager.colorMaskFiles.value.add(`${currentImgBaseFn}_colorMask.png`)
    parent._fileManager.currentImgIndex = parent._fileManager.nextImgIndex;
    //reset after save?
    if (isOnSwitch)
      parent._fileManager.status.next(1);
    else
      parent._fileManager.status.next(4);
    parent._uiService.setEnabled();
  }
}
export function saveStandalone(parent: ImagecanvasComponent) {
  parent._fileManager.nextImgIndex = parent._fileManager.currentImgIndex;
  saveImage(parent);
}


//add a safe call to buttons..
//TODO: Move into one post request
export function saveImage(parent: ImagecanvasComponent) {
  //if at a watershed keypoint
  if (parent.undoHelper.priorityUndoStack.length > 0 && parent.undoHelper.priorityUndoStack[parent.undoHelper.priorityUndoStack.length - 1] == parent.undoHelper.actionIndex) {
    //if bounding box ct matches limit
    const bbData = parent.boundingBox.attemptSaveBoundingBox()
    if (bbData[0]) {
      //Check bbox
      parent.undoHelper.saveStateHelper.addSavePoint(parent.undoHelper.actionIndex);
      // If last idx of colormask <= currentIdx (0 <= 0 at img idx 0) -> 1 <= 1 at img idx 1 
      parent.markeridCx.putImageData(new ImageData(parent.markerArray, parent.loadedImg.width, parent.loadedImg.height), 0, 0);
      let postedCt = 0;
      parent.markerEl.toBlob(blob => {
        const formData = new FormData();
        formData.append("file", blob, `${parent._fileManager.getCurrentImgBaseFn()}_markerMask.png`)
        parent._fileManager.postMarkerMask(formData).subscribe(res => {
          postedCt += 1;
          onPostImg(parent, postedCt);
        })
      })
      parent.markeridEl.toBlob(blob => {
        const formData = new FormData();
        formData.append("file", blob, `${parent._fileManager.getCurrentImgBaseFn()}_markerIdMask.png`)
        parent._fileManager.postMarkerIdMask(formData).subscribe(res => {
          postedCt += 1;
          onPostImg(parent, postedCt);
        })
      })
      parent.watershedEl.toBlob(blob => {
        const formData = new FormData();
        formData.append("file", blob, `${parent._fileManager.getCurrentImgBaseFn()}_colorMask.png`)
        parent._fileManager.postColorMask(formData).subscribe(res => {
          postedCt += 1;
          onPostImg(parent, postedCt);
        })
      })
      const jsonData = createJsonBb(parent, bbData[1] as Array<Array<number>>)
      const formData = new FormData();
      const bboxBlob = new Blob([JSON.stringify(jsonData, null, 2)], {type: 'text/plain'})
      formData.append("file", bboxBlob, `${parent._fileManager.getCurrentImgBaseFn()}_bbox.txt`)
        parent._fileManager.postBbox(formData).subscribe(res => {
          postedCt += 1;
          onPostImg(parent, postedCt);
        })

    }
    else{
      const data = bbData[1] as Array<Array<number>>;
      const bbLens = new Array(data.length)
      for (let i = 0; i < data.length; i++){
        bbLens[i] = data[i].length;
      }
      parent._uiService.enableFadingMessage_bb(bbLens);
    }
  }
  else {
    //set the red warning text to watershed before saving
    parent._uiService.saveFailed.next(true);
    setTimeout(() => parent._uiService.saveFailed.next(false), 2500);

  }
}

export function createJsonBb(parent: ImagecanvasComponent, data: Array<Array<number>>){
  const res = {};
  for (let i = 0; i < data.length; i++){
    const pix = parent._uiService.labelArray[i+1].rgbArray[0];
    res[pix] = data[i];
  }
  return res;


}
