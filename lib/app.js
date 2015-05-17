var context = require('webgl-context')
var loop = require('canvas-loop')
var assign = require('object-assign')
var createCamera = require('perspective-camera')
var createScene = require('./scene')

module.exports = function (images) {
  // get a retina-scaled WebGL canvas
  var gl = context()
  var canvas = gl.canvas
  var app = loop(canvas, {
    scale: window.devicePixelRatio
  }).on('tick', render)

  // create a simple perspective camera
  // contains our projection & view matrices
  var camera = createCamera({
    fov: Math.PI / 4,
    near: 0.01,
    far: 100
  })

  // create our custom scene
  var drawScene = createScene(gl, images)

  var time = 0
  app.start()

  return assign(app, {
    canvas,
    gl
  })

  function render (dt) {
    // our screen-space viewport
    var [ width, height ] = app.shape

    time += dt / 1000

    // set WebGL viewport to device size
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)

    gl.clearColor(0.04, 0.04, 0.04, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

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

    // draw our scene
    drawScene(time, camera)
  }
}
