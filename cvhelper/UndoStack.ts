import { Defaults } from '../../annotation/Constants/Defaults';
import { Label } from '../../annotation/labelsutil/LabelMap';
import { SaveState } from './SaveState/SaveState';

export class UndoStack {
    save_requirement = 'watershed'
    prevActionIndex = 0;
    actionIndex = 0;
    undoStack = [];
    keypointsUndoStack = [0];
    redoStack = [];
    keypointsRedoStack = [];
    priorityUndoStack = [];
    priorityRedoStack = [];
    saveStateHelper = new SaveState();

    // keypointTimer = undefined;
    // keypointAuth = true;
    currentLabel: Label = Defaults.label;

    constructor() { }
    reset() {
        this.prevActionIndex = 0;
        this.actionIndex = 0;
        this.undoStack = [];
        this.keypointsUndoStack = [0];
        this.redoStack = [];
        this.keypointsRedoStack = [];
        this.priorityUndoStack = [];
        this.priorityRedoStack = [];
        //todo: add takeUntil;
    }
    //pushes draw, change cursor size, label.
    callAndPushToStack(f, description){
        this.undoStack.push({ 'type': description, 'function': () => f() });
        f();
    }
    callAndPushToStackAndValidate(f, description){
        this.undoStack.push({ 'type': description, 'function': () => f() });
        this.validateStacks();
        f();
    }
    validateStacks(){
        if (this.redoStack.length > 0)
            this.redoStack = [];
        if (this.keypointsRedoStack.length > 0)
            this.keypointsRedoStack = [];
        this.saveStateHelper.popOverwrittenSaveStates(this.actionIndex);
    }

    //pushes image load
    pushToStack(f, description) {
        this.undoStack.push({ 'type': description, 'function': () => f() });
    }
    showUndo() {
        console.log(this.undoStack);
    }
    showRedo() {
        console.log(this.redoStack);
    }
    showKeypointsUndo(){
        console.log(this.keypointsUndoStack);
        
    }
    showKeypointsRedo(){
        console.log(this.keypointsRedoStack);
    }
    showPriorityKeypointsUndo(){
        console.log(this.priorityUndoStack);
    }
    showPriorityKeypointsRedo(){
        console.log(this.priorityRedoStack);
    }



    //Replicate the exact actions of a manual operation
    //The format for each operation should be:
    //CallAndAdd{
    //  addActionIndex()
    //  function()
    //}
    //PushUndoKeypoint
    isLastPriorityUndoKeypointEntryNotLast(targetIndex: number){
        let offset = 0;
        if (this.priorityUndoStack.length > 1 && targetIndex + 1 == this.priorityUndoStack[this.priorityUndoStack.length - 1]){
            offset = 1;
        }
        if (this.priorityUndoStack.length > 0 && this.priorityUndoStack[this.priorityUndoStack.length - 1 - offset] == this.actionIndex + 1){
            return true;
        }
        else{
            return false;
        }
    }
    isLastPriorityUndoKeypoint(){
        if (this.priorityUndoStack.length > 0 && this.priorityUndoStack[this.priorityUndoStack.length - 1] == this.actionIndex + 1){
            return true;
        }
        else{
            return false;
        }
    }
    isLastPriorityRedoKeypoint(){
        if (this.priorityRedoStack.length > 0 && this.priorityRedoStack[this.priorityRedoStack.length - 1] == this.actionIndex + 1){
            return true;
        }
        else{
            return false;
        }
    }

    undo() {
        let targetIndex = this.keypointsUndoStack[this.keypointsUndoStack.length - 1]
        if (targetIndex != 0) {
            this.keypointsUndoStack.pop();
            this.keypointsRedoStack.push(targetIndex);
            targetIndex = this.keypointsUndoStack[this.keypointsUndoStack.length - 1];
        }
        this.saveStateHelper.compareSaveStatus(targetIndex);



        this.actionIndex = 0;

        let i = 0;
        let end = this.undoStack.length;
        //Note that the action index always drags behind by one which is why >= targetIndex works. (Want everything After the keypoint is made).
        //(So after 1 gets passed, Everything after 1 must be pushed. 1 >= 1. Then pop off the remaining actions.)
        //A comparison with a priority item must account for action index + 1 == priority keypoint to see if our item is right.
        while (i < end) {
            if (this.actionIndex >= targetIndex && i > 2) {
                this.redoStack.push(this.undoStack.pop());
                if (this.isLastPriorityUndoKeypoint()){
                    this.priorityRedoStack.push(this.priorityUndoStack.pop());
                }
                end -= 1;
                continue;
            }
            const fEntry = this.undoStack[i];
            const f = this.undoStack[i]['function']
            //found a save requirement early on
            if (fEntry['type'] == this.save_requirement){
                //needs to run last priority item. However, the last item in the stack can actually be one to pop off. Thus if it is not the last one to pop off, 
                //then we run it.
                //case 1: we are popping off a priority item. In this case our entry here is not the last item on the stack. 
                //So let's keep things organized but less efficient, just scan each time if the target action is our last keypoint then increase offset for index by one.
                if (this.isLastPriorityUndoKeypointEntryNotLast(targetIndex)){
                    f();
                }
                else{
                    this.actionIndex += 1;
                }
            }
            else{
                this.parseF(f);
            }
            i += 1;
        }
    }
    redo() {
        if (this.keypointsRedoStack.length == 0)
            return;
        const targetIndex = this.keypointsRedoStack.pop();
        this.saveStateHelper.compareSaveStatus(targetIndex);
        this.keypointsUndoStack.push(targetIndex);
        while (this.actionIndex < targetIndex) {
            if (this.isLastPriorityRedoKeypoint()){
                this.priorityUndoStack.push(this.priorityRedoStack.pop());
            }
            const stackEntry = this.redoStack.pop();
            const f = stackEntry['function'];
            this.parseF(f);
            this.undoStack.push(stackEntry);
        }
    }

    private parseF(f: any) {
        switch (typeof f) {
            case 'function':
                f();
                break;
            case 'object':
                switch (f['entry']['type']) {
                    case 'labelEntry':
                        // this.setCurrentLabel(f['entry']['type'][''])
                        break;
                }

        }
    }

    pushUndoKeypoint() {
        this.keypointsUndoStack.push(this.actionIndex);
    }
    pushPriorityKeypoint() {
        this.priorityUndoStack.push(this.actionIndex);
    }

    setCurrentLabel(label) {
        this.currentLabel = label;
    }
    addActionIndex() {
        this.actionIndex += 1;
    }
    createMarkerDrawEntry(prevPos, currentPos) {
        const posEntry = {}
        posEntry['entry'] = { type: 'draw', prevPos: prevPos, currentPos: currentPos, index: this.actionIndex };
        this.undoStack.push(posEntry);
    }

}