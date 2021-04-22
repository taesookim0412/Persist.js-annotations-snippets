import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
declare var cv;
declare var JSZip;
declare var saveAs;

@Injectable({
  providedIn: 'root'
})
export class ScriptService {
  renderer: Renderer2;

  cv: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  jsZip: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  fileSaver: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  private script: HTMLScriptElement;

  private script_jszip: HTMLScriptElement;
  private script_filesaver: HTMLScriptElement;
  zipFsLoaded = false;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.script = this.renderer.createElement('script');
    this.renderer.appendChild(document.head, this.script);
    this.script.src = "/static/opencv.js";
    this.script.onload = () => {
      this.cv.next(cv);
    }
    // this.loadJsZipAndFileSaver();
  }

  async loadJsZipAndFileSaver() : Promise<void>{
    if (this.zipFsLoaded) return;
    return new Promise(resolve => {
      this.script_jszip = this.renderer.createElement('script');
      this.script_filesaver = this.renderer.createElement('script');
      this.renderer.appendChild(document.head, this.script_jszip);
      this.renderer.appendChild(document.head, this.script_filesaver);
      this.script_jszip.src = "/static/jszip.min.js";
      this.script_filesaver.src = "/static/FileSaver.min.js"
      let loadCt = 0;
      this.script_jszip.onload = () => {
        this.jsZip.next(JSZip)
        loadCt += 1;
        if (loadCt == 2){
          this.zipFsLoaded = true;
          resolve();

        }
      }
      this.script_filesaver.onload = () => {
        this.fileSaver.next({saveAs: saveAs})
        // console.log(this.script_filesaver. );
        // var blob = new Blob(["Hello, world!"], {type: "text/plain;charset=utf-8"});
        // this.fileSaver.value.saveAs(blob, "hello world.txt");
        loadCt += 1;
        if (loadCt == 2){
          this.zipFsLoaded = true;
          resolve();

        }

      }
    })
  }

}

