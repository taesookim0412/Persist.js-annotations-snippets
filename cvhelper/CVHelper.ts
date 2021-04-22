import { ImagecanvasComponent } from '../imagecanvas.component';
import { Mat } from './Mat';

export function reduceMatChannelsFromImgData(parent: ImagecanvasComponent, canvasCtx_imgData: ImageData, targetChannels = 3): any  {
    const canvasCtx_imgData_Mat = parent.cv.matFromImageData(canvasCtx_imgData);
    let resMat = new parent.cv.Mat();
    let resImgVect = new parent.cv.MatVector();
    let rgbaPlanes = new parent.cv.MatVector();
    parent.cv.split(canvasCtx_imgData_Mat, rgbaPlanes);
    for (let i = 0; i < targetChannels; i++){
      resImgVect.push_back(rgbaPlanes.get(i));
    }
    parent.cv.merge(resImgVect, resMat);
    Mat.deleteMats([canvasCtx_imgData_Mat, resImgVect, rgbaPlanes]);
    return resMat;
}
export function reduceMatChannels(parent: ImagecanvasComponent, matData: any, targetChannels = 3): any  {
  let resMat = new parent.cv.Mat();
  let resImgVect = new parent.cv.MatVector();
  let rgbaPlanes = new parent.cv.MatVector();
  parent.cv.split(matData, rgbaPlanes);
  for (let i = 0; i < targetChannels; i++){
    resImgVect.push_back(rgbaPlanes.get(i));
  }
  parent.cv.merge(resImgVect, resMat);
  Mat.deleteMats([resImgVect, rgbaPlanes]);
  return resMat;
}

//Need to delete mats here;
export function expandRToRGB(parent: ImagecanvasComponent, height: number, width: number, markerRMat: any) {
  const zeros: any = parent.cv.Mat.zeros(height, width, parent.cv.CV_8UC1);
  let markerDst = new parent.cv.Mat(height, width, parent.cv.CV_8UC3);
  const marker3C_Vect = new parent.cv.MatVector();
  marker3C_Vect.push_back(markerRMat);
  marker3C_Vect.push_back(zeros);
  marker3C_Vect.push_back(zeros);
  parent.cv.merge(marker3C_Vect, markerDst);
  Mat.deleteMats([zeros, marker3C_Vect])
  return markerDst;
}