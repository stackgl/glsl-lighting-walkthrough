var createGeometry = require('gl-geometry')
var createShader = require('gl-shader')
var mat4 = require('gl-mat4')
var icosphere = require('icosphere')

var glslify = require('glslify')
var vert = glslify('./shaders/basic.vert')
var frag = glslify('./shaders/basic.frag')

module.exports = function(gl) {
  //create our shader
  var shader = createShader(gl, vert, frag)

  //set up a sphere geometry
  var mesh = icosphere(2)
  var geom = createGeometry(gl)
    .attr('position', mesh.positions)
    .faces(mesh.cells)
    
  //the model-space transform for our sphere
  var model = mat4.create()
  var s = 0.05
  var scale = [s, s, s]

  var sphere = {
    position: [0, 0, 0],
    color: [1, 0, 0],
    draw: draw
  }

  return sphere

  function draw(camera) {
    //set up our model matrix
    mat4.identity(model)
    mat4.translate(model, model, sphere.position)
    mat4.scale(model, model, scale)

    //set our uniforms for the shader
    shader.bind()
    shader.uniforms.projection = camera.projection
    shader.uniforms.view = camera.view
    shader.uniforms.model = model
    shader.uniforms.color = sphere.color

    //draw the mesh
    geom.bind(shader)
    geom.draw(gl.TRIANGLES)
    geom.unbind()
  }
}