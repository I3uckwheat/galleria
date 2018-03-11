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

const rootDir = path.join(process.mainModule.paths[0].split('node_modules')[0].slice(0, -1), 'public'); // Thank you pddivine: Finds root of express app.

exports = module.exports = createGallery;

  //************************************************************************//

function createGallery(initOptions){
  const galleryRoot = path.join(rootDir, (initOptions.galleryLocation || path.join('images', 'gallery')));
  const category = initOptions.categoryField || 'category';
  const imageFileSelectField = initOptions.imageFileSelectField || 'images';
  const imageWidth = initOptions.imageWidth;
  const thumbNailWidth = initOptions.thumbNailWidth || 250;

  return {
    upload,
  }

  //************************************************************************//

  function upload(options) { // TODO add options like using as middleware
    return function(req, res, next) {
      mUpload.array(imageFileSelectField)(req, res, function(){
        Promise.all(req.files.map((image) => {
          return Promise.all([
            saveImage(image, req.body[category]), // TODO set category
            saveThumbnail(image, req.body[category])
          ])
        }))
        .then(() => {res.status(200).end("")})
        .catch(console.error);
      });
    }
  }

  function saveImage(file, category) { // TODO allow renaming from form field
    return jimp.read(file.buffer)
      .then((image) => {
        if(imageWidth) {image.resize(imageWidth, jimp.AUTO)};
        image.write(path.join(galleryRoot, category, file.originalname));
      })
      .catch(console.error)
  }

  function saveThumbnail(file, category) { // TODO allow renaming from form field
    return jimp.read(file.buffer)
    .then((image) => {
      image.resize(thumbNailWidth, jimp.AUTO);
      image.write(path.join(galleryRoot, category, 'thumbnails', `_${file.originalname}`));
      console.log(path.join(galleryRoot, category, 'thumbnails', `_${file.originalname}`));
    })
    .catch(console.error)
  }
}
