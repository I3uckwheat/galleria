# galleria

An easy to use middleware to create photo galleries on the local ( to the server ) disk. This can be used with ajax techniques and without.

## Installation

Install with `npm install express-galleria --save`

## Usage

Initialize inside of a routes file:

~~~javascript
const galleria = require('express-galleria');
const gallery = galleria(); // To initialize
~~~

galleria takes an optional options object with the following:

### galleryRoot

This is the absolute path to the root of the gallery. This should only be changed if the node application is launched from some place other than the root of the application.

### galleryPublicRoot

This is the relative path to the public files. This should match the `express.static()` directory listed below.

~~~javascript
// Main app.js
app.use(express.static(path.join(__dirname, 'public')));
~~~

### imageFileSelectField

This is the form field that is sent via POST request that contains the images, it can accept multiple images at a time.

### imageWidth

The width of the full-size images, the height will scale to maintain aspect ratio.

### thumbNailWidth

The width of the thumbnail image, the height will scale to maintain aspect ratio.

---

After initializing the gallery object, you will need to set the proper routes up:

All methods here should be called with `{ajax: true}` if not used as middleware. Only when `{ajax: true}` is passed, `next()` will be called.

### upload()

Handles the upload, to be used with `req.params.category`

usage:

~~~javascript
router.post('/:category', gallery.upload({ ajax: true }));
~~~

### getIndex()

This will get a list of all categories.

usage:

~~~javascript
router.get('/', gallery.getIndex(), galleryController.index);
~~~

### getImagesFromCategory()

This route will get all the images from the specified category, to be used with `req.params.category`

usage:

~~~javascript
router.get('/:category', gallery.getImagesFromCategory({ ajax: true }));
~~~

### removeCategory()

Removes a category from the disk, including all images in that category, to be used with `req.params.category`

usage:

~~~javascript
router.post('/:category/delete', gallery.removeCategory({ ajax: true }));
~~~

### removeImage()

Removes an image from a specified category, to be used with `req.params.category`, and `req.params.image` where `image` is the ID of the image.

usage:

~~~javascript
router.post('/:category/:image/delete', gallery.removeImage({ ajax: true }));
~~~