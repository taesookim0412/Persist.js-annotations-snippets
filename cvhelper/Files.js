const unzipper = require('unzipper');
const path = require('path');
const { resolve } = require('path');

class Files {
    IMGS = 0
    MARKER_MASKS = 1
    MARKERID_MASKS = 2
    COLOR_MASKS = 3
    BBOX = 4
    UNINITIALIZED = 'Uninitialized'
    INITIALIZED = 'Initialized'
    uninitSet = new Set(this.UNINITIALIZED);
    entire_fileNames = [[this.UNINITIALIZED],
    [this.UNINITIALIZED],
    [this.UNINITIALIZED],
    [this.UNINITIALIZED],
    [this.UNINITIALIZED]];
    entire_fileNamesSets = [this.uninitSet,
    this.uninitSet,
    this.uninitSet,
    this.uninitSet,
    this.uninitSet];
    entire_dirs = ['',
        '',
        '',
        '',
        ''];
    imgFront = 0;

    assets_Dir = "";

    constructor(path, fs) {
        this.fs = fs;
        this.assets_Dir = path.join(
            path.dirname(path.dirname(path.dirname(__dirname))),
            'app',
            'src',
            'assets2'
        )
        this.entire_dirs[this.IMGS] = path.join(this.assets_Dir, 'imgs');
        this.entire_dirs[this.MARKER_MASKS] = path.join(this.assets_Dir, 'marker_masks');
        this.entire_dirs[this.MARKERID_MASKS] = path.join(this.assets_Dir, 'markerid_masks');
        this.entire_dirs[this.COLOR_MASKS] = path.join(this.assets_Dir, 'color_masks');
        this.entire_dirs[this.BBOX] = path.join(this.assets_Dir, 'bboxes');
        this.createFoldersSync().then(() => {
            this.fetchAllFilesAndResetImgFront();
        })
        const zipPath = path.join(this.assets_Dir, 'imgszips')
        this.fs.mkdirSync(zipPath, {recursive:true})


    }
    getImgFilesSet() { return this.getFilesSet(this.IMGS) }
    getMarkerMaskFilesSet() { return this.getFilesSet(this.MARKER_MASKS) }
    getMarkerIdMaskFilesSet() { return this.getFilesSet(this.MARKERID_MASKS) }
    getColorMaskFilesSet() { return this.getFilesSet(this.COLOR_MASKS) }
    getFilesSet(img_constant) {
        if (this.entire_fileNames[img_constant].size == 1 && this.entire_fileNames[img_constant].has(this.UNINITIALIZED)) {
            this.fetchFilesFromFp(img_constant);
        }
        return this.entire_fileNamesSets[img_constant];
    }
    getImgFiles() { return this.getFiles(this.IMGS) }
    getMarkerMaskFiles() { return this.getFiles(this.MARKER_MASKS) }
    getMarkerIdMaskFiles() { return this.getFiles(this.MARKERID_MASKS) }
    getColorMaskFiles() { return this.getFiles(this.COLOR_MASKS) }
    getFiles(img_constant) {
        if (this.entire_fileNames[img_constant].size == 1 && this.entire_fileNames[img_constant].has(this.UNINITIALIZED)) {
            this.fetchFilesFromFp(img_constant);
        }
        return this.entire_fileNames[img_constant];
    }
    async fetchFilesFromFp(img_constant) {
        return new Promise((resolve, reject) => {
            const fp = this.entire_dirs[img_constant];
            this.fs.readdir(fp, (err, files) => {
                if (err) {
                    console.log(err);
                }
                else {
                    this.entire_fileNames[img_constant] = files;
                    this.entire_fileNamesSets[img_constant] = new Set(files);
                }
                resolve();
            })
        })
    }
    async fetchAllFilesAndResetImgFront(){
        return Promise.all(this.entire_dirs.map(async (fp, i) => {
            await this.fetchFilesFromFp(i);
        })).then(() => {
            this.readImgFront();
        })
    }
    postImg(img_constant, fn) {
        if (!(this.entire_fileNamesSets[img_constant].has(fn))) {
            this.entire_fileNamesSets[img_constant].add(fn);
            this.entire_fileNames[img_constant].push(fn);
        }
    }
    readImgs(img_constant, encoding) {
        const res = [];
        for (let img of this.entire_fileNames[img_constant]) {
            const data = this.fs.readFileSync(`${this.entire_dirs[img_constant]}\\${img}`, { encoding: encoding })
            res.push(data)
        };
        return { files: res, fileNames: this.entire_fileNames[img_constant] };
    }
    readMarkerMasks() {
        return this.readImgs(this.MARKER_MASKS, 'base64');
    }
    readMarkerIdMasks() {
        return this.readImgs(this.MARKERID_MASKS, 'base64');
    }
    readColorMasks() {
        return this.readImgs(this.COLOR_MASKS, 'base64');
    }
    readBboxes() {
        return this.readImgs(this.BBOX, 'utf8');
    }
    sliceFileExt(s) {
        return s.slice(0, s.length - 4);
    }
    readImgFront() {
        let fns = new Array(4);
        for (let i = 0; i < this.entire_fileNames[0].length; i++) {
            const imgFileBaseName = this.sliceFileExt(this.entire_fileNames[0][i])
            const marker_mask_fn = `${imgFileBaseName}_markerMask.png`
            const marker_id_mask_fn = `${imgFileBaseName}_markerIdMask.png`
            const color_mask_fn = `${imgFileBaseName}_colorMask.png`;
            const bb_fn = `${imgFileBaseName}_bbox.txt`;
            fns[0] = marker_mask_fn
            fns[1] = marker_id_mask_fn
            fns[2] = color_mask_fn
            fns[3] = bb_fn
            for (let j = 1; j < this.entire_fileNames.length; j++) {
                if (this.entire_fileNames[j].length <= i) {
                    this.imgFront = i;
                    return;
                }
                if (!(this.entire_fileNamesSets[j].has(fns[j - 1]))) {
                    this.imgFront = i;
                    return;
                }
            }
        }
        this.imgFront = this.entire_fileNames[0].length - 1;
    }
    setImgFront(imgFront) {
        this.imgFront = imgFront;
    }
    async processImgs(file) {
        const fn = file.originalname;
        //delete all imgs, marker masks, marker id masks, col   or masks, bbs
        await this.removeFoldersSync()
        await this.createFoldersSync()

        const zipPath = path.join(this.assets_Dir, 'imgszips')
        this.fs.mkdirSync(zipPath, {recursive:true})
        await this.fs.createReadStream(path.join(zipPath, fn)).pipe(unzipper.Extract({ path: this.assets_Dir }))
        this.fetchAllFilesAndResetImgFront();
    }

    async removeFoldersSync() {
        return Promise.all(this.entire_dirs.map(async (path) => {
            this.fs.rmdirSync(path, { recursive: true })
        }))
    }

    async createFoldersSync() {
        return Promise.all(this.entire_dirs.map(async (path) => {
            this.fs.mkdirSync(path, { recursive: true })
        })
        )
    }
}

// module.exports = Files   
module.exports = Files;