const aws = require('aws-sdk');
const multerS3 = require('multer-s3');
const s3 = new aws.S3({ credentials: new aws.SharedIniFileCredentials({ profile: 'default' })});

module.exports = {
    postImg: multerS3({
        s3:s3,
        acl: 'public-read',
        bucket: 'bucketname',
        metadata: (req, file, cb) => cb(null, {fieldName: 'METADATA'}),
        key: (req, file, cb) => {
            cb(null, `imgs/path/${Date.now()} ${file.originalname}`);
        }
    })
}


//usage:
const S3PostImg = multer({storage: s3conf.postImg}).single('img');
(req, res) => { S3PostImg(req, res, async (err) => { }}