const fs = require('fs-extra');
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

const publicRootDir = path.join(process.mainModule.paths[0].split('node_modules')[0].slice(0, -1), 'public'); // Thank you pddivine: Finds root of express app.

exports = module.exports = createGallery;

  //************************************************************************//

function createGallery(initOptions){
  const galleryRoot = path.join(publicRootDir, (initOptions.galleryLocation || path.join('images', 'gallery')));
  const galleryPublicRoot = initOptions.galleryLocation || path.join('images', 'gallery');
  const category = initOptions.categoryField || 'category';
  const imageFileSelectField = initOptions.imageFileSelectField || 'images';
  const imageWidth = initOptions.imageWidth;
  const thumbNailWidth = initOptions.thumbNailWidth || 250;

  return {
    upload,
    getIndex,
    getImagesFromCategory,
    removeCategory,
    removeImage
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

  function getIndex(req, res, next) {
    getCategories(galleryRoot)
      .then(generateCategoryCards)
      .then((cards) => {
        console.log(cards);
        req.gallery = cards
        next();
      })
      .catch(next);
  }

  function getImagesFromCategory(req, res, next) { // TODO - allow passing of arguments for category
    generateImageCards(req.params.category)
      .then(imageCards => {
        req.gallery = imageCards;
        next();
      })
      .catch(() => next());
  }

   function removeCategory(req, res, next){ // TODO check for windows compatibility
      fs.remove(path.join(galleryRoot, req.params.category))
        .then(() => res.status(204).send(''))
        .catch(next);
  }

  function removeImage(req, res, next){
    const category = req.params.category;
    const image = req.params.image;

    fs.unlink(path.join(galleryRoot, category, image))
      .then(() => {
        fs.unlink(path.join(galleryRoot, category, 'thumbnails', `_${image}`))
      })
      .then(() => {
        res.status(202).send('');
      })
      .catch((err) => res.status(400).send(err));
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

  function getCategories(directory) { // TODO - do not show empty categories and/or remove them
    return new Promise((resolve, reject) => {
      fs.readdir(directory, (err, categories) => {
        if(err) reject(err);
        resolve(categories);
      })
    })
  }

  function generateCategoryCards(categories) {
    return Promise.all(categories.map(category => {
      return getCategoryThumbnails(category)
        .then(thumbnails => ({
          category,
          thumbnail: thumbnails[0]
        }))
        .catch(err => err);
    }));
  }

  function getCategoryThumbnails(category) {
    return new Promise((resolve, reject) => {
      fs.readdir(path.join(galleryRoot, category, 'thumbnails'), (err, contents) => {
        if(err) reject(err);
        resolve(contents.map(thumbnail => {
          return path.join(galleryPublicRoot, category, 'thumbnails', thumbnail);
        }));
      });
    });
  }

  function generateImageCards(category){
    return new Promise((resolve, reject) => {
    fs.readdir(path.join(galleryRoot, category), (err, contents) => {
      if (err) reject(err);
      if(contents == null) return reject();
      const images = contents.filter((file) => {return file !== 'thumbnails'});
      resolve(images.map((image) => {
        return {
          imageName: path.parse(image).name, // Thank you: Alex Chuev
          imageURL: `${galleryPublicRoot}/${category}/${image}`,
          thumbURL: `${galleryPublicRoot}/${category}/thumbnails/_${image}`
        };
      }));
    });
  });
  }
}
