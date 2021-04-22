export class LabelMap{
    //This mapping can go to a service but it may not be necessary until customization is required.
    //Image is initialized to zero; this is not the same as out of roi.
    //0 : Unlabeled (Initialize Empty Watershed);
    //Colors must draw correctly thus their input rgb must be good...
    // Use colors defined within Mozilla's css colors. ... Their output
    //will probably also have to be exact.

    labels = [
        // new Label("out of roi", 192, "rgb(192,192,192)", [192,192,192]),
        new Label("out of roi", 0, "rgb(0,0,0)", [0,0,0]),
        new Label("face", 1, "rgb(255,0,0)", [255,0,0]),
        new Label("neck", 2, "rgb(128,128,128)", [128,128,128])
    ]
    constructor(){
    }
        
        
    
}
//Name, Id, rgbColor: MarkerColor, rgbArray: MarkerColor, rgbIdColor: MarkerIDColor;
//Ex: Draw Id * 10 + 4, Retrieve Key based on ID.
export class Label{
    public rgbIdPx: number;
    constructor(public name:string, public id:number, public rgbColor:string, public rgbArray: number[]){
        //Debugging only!!!! DELETE:
        //this.rgbIdColor = rgbColor;
        //Irrelavant: The bg will bleed to a pixel below.
        //Thus seperate rgbIdColor by whatever you want, it will be impossible to view anyways.
        this.rgbIdPx = id + 1;
    }
}