import { BehaviorSubject, concat, fromEvent, Observable, pipe } from 'rxjs';
import { concatAll, map, mergeMap, pairwise, switchMap, switchMapTo, takeUntil } from 'rxjs/operators';
import { ImagecanvasComponent } from '../imagecanvas.component';

//Todo: Unsubscribe then set the correct canvas instead of drawing on all of them.


export function captureEvents(holderEl: HTMLCanvasElement, cxes: CanvasRenderingContext2D[], scaleFactorUISubject: BehaviorSubject<number>, parent: ImagecanvasComponent) {

  const afterMouseUp = new Observable(subscriber => {
    parent.undoHelper.pushUndoKeypoint();
  });

  fromEvent(holderEl, 'mousedown')
    .pipe(
      switchMap((e) => {
        parent.undoHelper.saveStateHelper.invalidateSaveState();
        parent.undoHelper.validateStacks();
        return concat(fromEvent(holderEl, 'mousemove').pipe(
          takeUntil(fromEvent(holderEl, 'mouseup')),
          takeUntil(fromEvent(holderEl, 'mouseleave')),
          pairwise()
        ),
          afterMouseUp);
      }))
    .subscribe((res: [MouseEvent, MouseEvent]) => {
      parent.undoHelper.callAndPushToStack(() => {
        parent.undoHelper.addActionIndex();
        const prevPos = {
          x: res[0].offsetX * scaleFactorUISubject.value,
          y: res[0].offsetY * scaleFactorUISubject.value
        };

        const currentPos = {
          x: res[1].offsetX * scaleFactorUISubject.value,
          y: res[1].offsetY * scaleFactorUISubject.value
        };

        for (const cx of cxes) {
          drawOnCanvas(prevPos, currentPos, cx);
        }
        // parent.undoHelper.createMarkerDrawEntry(prevPos, currentPos);
      }, 'draw')

    });
}

export function drawOnCanvas(
  prevPos: { x: number, y: number },
  currentPos: { x: number, y: number },
  cx: CanvasRenderingContext2D
) {
  // incase the context is not set
  if (!cx) { return; }

  // start our drawing path
  cx.beginPath();

  // we're drawing lines so we need a previous position
  if (prevPos) {
    // sets the start point
    cx.moveTo(prevPos.x, prevPos.y); // from

    // draws a line from the start pos until the current position
    cx.lineTo(currentPos.x, currentPos.y);

    // strokes the current path with the styles we set earlier
    cx.stroke();
  }
}