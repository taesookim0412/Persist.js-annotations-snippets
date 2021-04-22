import { BehaviorSubject } from 'rxjs';

export class SaveState {
    saveStates = new BehaviorSubject<number[]>([0])
    //True: save state is good
    //False: save state is bad
    //Triggers:
    //OnLoad - Initialized to True;
    //OnCall(AndPush) -- Set to false;
    //OnSave -- Set to true
    //OnUndo and OnRedo -- determine if latest savestate is 
    currentSaveState = new BehaviorSubject<boolean>(true);
    constructor(){}
    //on load
    reset(){
        this.saveStates.next([0]);
        this.currentSaveState.next(true);
    }    
    //on call
    popOverwrittenSaveStates(actionIndex: number){
        while (this.saveStates.value.length > 0 && this.saveStates.value[this.saveStates.value.length - 1] > actionIndex) {
            this.saveStates.value.pop();
            this.saveStates.next(this.saveStates.value);
        }
    }
    //on call
    invalidateSaveState(){
        this.currentSaveState.next(false);
    }
    //on save
    addSavePoint(actionIndex) {
        this.saveStates.value.push(actionIndex);
        this.saveStates.next(this.saveStates.value)
        this.currentSaveState.next(true);
    }
    //on undo / redo
    compareSaveStatus(targetIndex: number){
        if (targetIndex == this.saveStates.value[this.saveStates.value.length - 1])
            this.currentSaveState.next(true);
        else
            this.currentSaveState.next(false);
    }

    
}