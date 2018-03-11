const fs = require('fs');
const path = require('path');
const jimp = require('jimp');
const multer = require('multer')

const upload = multer({
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

exports = module.exports = createGallery;

// *****************************************************************************

function createGallery (options) {
  function upload(req, res, next) {

    return next();
  }

  return {
    upload
  }
}
