/*
  Creates a new 3D torus with its own shader and vertex buffers.
 */

var createGeometry = require('gl-geometry')
var createShader = require('gl-shader')
var createTorus = require('torus-mesh')
var mat4 = require('gl-mat4')

//our phong shader for the brick torus
var glslify = require('glslify')
var vert = glslify('./shaders/phong.vert')
var frag = glslify('./shaders/phong.frag')

module.exports = function(gl) {
  var complex = createTorus({
    majorSegments: 64,
    minorSegments: 64
  })

  //enable derivatives for face normals
  var ext = gl.getExtension('OES_standard_derivatives')
  if (!ext)
    throw new Error('derivatives not supported')

  //create our shader
  var shader = createShader(gl, vert, frag)

  //create a geometry with some vertex attributes
  var geom = createGeometry(gl)
    .attr('position', complex.positions)
    .attr('normal', complex.normals)
    .attr('uv', complex.uvs, { size: 2 })
    .faces(complex.cells)
  
  //our model-space transformations
  var model = mat4.create()

  var mesh = {
    draw: draw,
    light: null,
    flatShading: false,
  }

  return mesh

  function draw(camera) {
    //set our uniforms for the shader
    shader.bind()
    shader.uniforms.projection = camera.projection
    shader.uniforms.view = camera.view
    shader.uniforms.model = model
    shader.uniforms.flatShading = mesh.flatShading ? 1 : 0
    shader.uniforms.light = mesh.light
    shader.uniforms.texDiffuse = 0
    shader.uniforms.texNormal = 1
    shader.uniforms.texSpecular = 2

    //draw the mesh
    geom.bind(shader)
    geom.draw(gl.TRIANGLES)
    geom.unbind()
  }
}