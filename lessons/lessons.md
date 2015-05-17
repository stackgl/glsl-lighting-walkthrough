## preface: the render loop

First, we need to handle some application boilerplate for WebGL context, requestAnimationFrame, retina canvas scaling, window resizing, and delta timing.

For this, we'll use [webgl-context](https://www.npmjs.com/package/webgl-context) and [canvas-loop](https://www.npmjs.com/package/canvas-loop):

```js
var context = require('webgl-context')
var loop = require('canvas-loop')

// create a WebGL canvas context
var gl = context()
var canvas = gl.canvas

// setup our rener loop and canvas scaling
var app = loop(canvas, {
  scale: window.devicePixelRatio
})

document.body.appendChild(canvas)

var time = 0

//start rendering
app.on('tick', render)
app.start()

function render (dt) {
  time += dt / 1000

  // our screen-space viewport
  var width = app.shape[0]
  var height = app.shape[1]

  // ...
}
```

There are a variety of modules that could be used to achieve something similar to the above:

- [raf-loop](https://www.npmjs.com/package/raf-loop)
- [canvas-fit](https://www.npmjs.com/package/canvas-fit)
- [gl-context](https://www.npmjs.com/package/gl-context)
- [gl-toy](https://www.npmjs.com/package/gl-toy)
- [gl-clear](https://www.npmjs.com/package/gl-clear)


## camera

In order to draw a 3D shape on screen, we need to transform its vertices from *model space* into *window coordinates.* 

A common means of doing this is to use three 4x4 matrices commonly referred. Here's a brief generalization of the three matrices:

- `projection` is often a perspective (i.e. 3D) or orthographic (i.e. 2D) matrix
- `view` is typically related to the position and orientation of your camera
- `model` is a transformation applied to your individual mesh (e.g. translating a sphere) 

The "MVP" approach is fairly common in graphics, and there are many articles on the subject:

- [opengl-tutorial - matrices](http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/)
- [open.gl - transformations](https://open.gl/transformations)
- [joe's blog - 3D transformations](http://duriansoftware.com/joe/An-intro-to-modern-OpenGL.-Chapter-3:-3D-transformation-and-projection.html)

For this walkthrough, we will use the [perspective-camera](https://www.npmjs.com/package/perspective-camera) module since it helps us get things going without worrying too much about the math.

We can set up our 3D camera with some basic settings for `fov` (field of view) and the `near .. far` depth range. 

```js
var createCamera = require('perspective-camera')

// create a 3D perspective camera
var camera = createCamera({
  fov: Math.PI / 4,
  near: 0.01,
  far: 100
})
```

On tick, we can orbit its position and orientation around a center point like so:

```js
function render(dt) {
  ...

  var width = app.shape[0]
  var height = app.shape[1]

  // rotate the camera around origin
  var rotation = Math.PI / 4 + time * 0.2
  var radius = 4
  var x = Math.cos(rotation) * radius
  var z = Math.sin(rotation) * radius
  camera.identity()
  camera.translate([ x, 0, z ])
  camera.lookAt([ 0, 0, 0 ])
  camera.viewport = [ 0, 0, width, height ]
  camera.update()

  ...
}
```

After calling `camera.update()` we can access `camera.projection` and `camera.view` for use in our shaders.

