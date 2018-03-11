const fs = require('fs');
const path = require('path');
const jimp = require('jimp');
const multer = require('multer')

const mUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, next){
    const isPhoto = file.mimetype.startsWith('image/');
    if(isPhoto){
      next(null, true);
    } else {
      next({message: "That filetype isn't allowed!"}, false)
    }
  }
})

// exports = module.exports = createGallery;

// *****************************************************************************

exports.upload = function(req, res, next) {
  mUpload.single('photos')(req, res, function(){
    console.log(req.file);
    res.end("finish")
  })
}
