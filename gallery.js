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

exports = module.exports = createGallery;

// *****************************************************************************

function createGallery(initOptions){
  const galleryRoot = initOptions.galleryLocation || path.join(process.mainModule.paths[0].split('node_modules')[0].slice(0, -1), 'public', 'images', 'gallery'); // Thank you pddivine: Finds root of express app.
  const imageFileSelectField = initOptions.imageFileSelectField || 'images';

  function upload(options) { // TODO add options like using as middleware
    return function(req, res, next) {
      mUpload.array(imageFileSelectField)(req, res, function(){
        console.log(req.files);
        console.log(req.body);
        next();
      })
    }
  }

  return {
    upload
  }
}
