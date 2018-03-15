const fs = require('fs-extra');
const path = require('path');
const jimp = require('jimp');
const multer = require('multer');

const mUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: "That filetype isn't allowed!" }, false);
    }
  },
});

const publicRootDir = path.join(process.mainModule.paths[0].split('node_modules')[0].slice(0, -1), 'public'); // Thank you pddivine: Finds root of express app.

exports = module.exports = createGallery;

//* ***********************************************************************//

function createGallery(options = {}) {
  const defaultOptions = {
    galleryRoot: path.join(publicRootDir, 'images', 'gallery'),
    galleryPublicRoot: path.join('images', 'gallery'),
    category: 'category',
    imageFileSelectField: 'images',
    imageWidth: null,
    thumbNailWidth: 250,
  };

  for (const opt in defaultOptions) {
    if (defaultOptions.hasOwnProperty(opt) && !options.hasOwnProperty(opt)) {
      options[opt] = defaultOptions[opt];
    }
  }


  return {
    upload,
    getIndex,
    getImagesFromCategory,
    removeCategory,
    removeImage,
  };

  //* ***********************************************************************//

  function upload() { // TODO add options like using as middleware
    return function uploadImages(req, res, next) {
      mUpload.array(options.imageFileSelectField)(req, res, () => {
        Promise.all(req.files.map(image => Promise.all([
          saveImage(image, req.body[options.category]), // TODO set category
          saveThumbnail(image, req.body[options.category]),
        ])))
          .then(() => { res.status(200).send('Successful Upload'); })
          .catch((err) => { res.status(500).send(err); });
      });
    };
  }

  function getIndex(funcOptions = {}) {
    return function getGalleryIndex(req, res, next) {
      getCategories(options.galleryRoot)
        .then(generateCategoryCards)
        .then((cards) => {
          req.gallery = cards;
          if (funcOptions.json) return res.status(200).send(cards);
          return next();
        })
        .catch((err) => {
          if (!funcOptions.json) return res.status(500).send(err);
          return next(err);
        });
    };
  }

  function getImagesFromCategory(funcOptions = {}) {
    return function getImages(req, res, next) { // TODO - allow passing of arguments for category
      generateImageCards(req.params.category)
        .then((imageCards) => {
          if (funcOptions.json) { return res.status(200).json(imageCards); }
          req.gallery = imageCards;
          return next();
        })
        .catch((err) => {
          if (funcOptions.json) return res.status(404).send('Category Not Found');
          return next(err);
        });
    };
  }

  function removeCategory(req, res, next) { // TODO check for windows compatibility
    fs.remove(path.join(options.galleryRoot, req.params.category))
      .then(() => res.status(204).send(''))
      .catch(next);
  }

  function removeImage(req, res, next) {
    const category = req.params.category;
    const image = req.params.image;

    fs.unlink(path.join(options.galleryRoot, category, image))
      .then(() => {
        fs.unlink(path.join(options.galleryRoot, category, 'thumbnails', `_${image}`));
      })
      .then(() => {
        res.status(202).send('');
      })
      .catch(err => res.status(400).send(err));
  }

  function saveImage(file, category) { // TODO allow renaming from form field
    return jimp.read(file.buffer)
      .then((image) => {
        if (options.imageWidth) { image.resize(options.imageWidth, jimp.AUTO); }
        image.write(path.join(options.galleryRoot, category, file.originalname));
      })
      .catch(console.error);
  }

  function saveThumbnail(file, category) { // TODO allow renaming from form field
    return jimp.read(file.buffer)
      .then((image) => {
        image.resize(options.thumbNailWidth, jimp.AUTO);
        image.write(path.join(options.galleryRoot, category, 'thumbnails', `_${file.originalname}`));
        console.log(path.join(options.galleryRoot, category, 'thumbnails', `_${file.originalname}`));
      })
      .catch(console.error);
  }

  function getCategories(directory) { // TODO - do not show empty categories and/or remove them
    return new Promise((resolve, reject) => {
      fs.readdir(directory, (err, categories) => {
        if (err) reject(err);
        resolve(categories);
      });
    });
  }

  function generateCategoryCards(categories) {
    return Promise.all(categories.map(category => getCategoryThumbnails(category)
      .then(thumbnails => ({
        category,
        thumbnail: thumbnails[0],
      }))
      .catch(err => err)));
  }

  function getCategoryThumbnails(category) { // TODO IF no thumbnail directory, use puctures
    return new Promise((resolve, reject) => {
      fs.readdir(path.join(options.galleryRoot, category, 'thumbnails'), (err, contents) => {
        if (err) reject(err);
        if (contents == null) { return reject('noThumb'); }
        resolve(contents.map(thumbnail => path.join(options.galleryPublicRoot, category, 'thumbnails', thumbnail)));
      });
    });
  }

  function generateImageCards(category) {
    return new Promise((resolve, reject) => {
      fs.readdir(path.join(options.galleryRoot, category), (err, contents) => {
        if (err) reject(err);
        if (contents == null) return reject();
        const images = contents.filter(file => file !== 'thumbnails');
        resolve(images.map(image => ({
          imageName: path.parse(image).name, // Thank you: Alex Chuev
          imageURL: `/${options.galleryPublicRoot}/${category}/${image}`,
          thumbURL: `/${options.galleryPublicRoot}/${category}/thumbnails/_${image}`,
        })));
      });
    });
  }
}
