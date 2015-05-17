/*
  Brings together the textures, mesh, and lights into a unified scene.  
 */

var createTorus = require('./create-torus')
var createSphere = require('./create-sphere')
var createTexture = require('gl-texture2d')
var hex = require('hex-rgb')

var hex2rgb = (str) => {
  return hex(str).map(x => x/255)
}

module.exports = function(gl, images) {
  //the 3D objects for our scene
  var mesh = createTorus(gl)
  var sphere = createSphere(gl)


  //upload our textures with mipmapping and repeat wrapping
  var textures = images.map(image => {
    var tex = createTexture(gl, image)
    tex.minFilter = gl.LINEAR_MIPMAP_LINEAR
    tex.magFilter = gl.LINEAR
    tex.generateMipmap()
    tex.wrap = gl.REPEAT
    
    var ext = gl.getExtension('EXT_texture_filter_anisotropic')
    if (ext) {
      var maxAnistrophy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
      tex.bind()
      gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, maxAnistrophy))
    }

    return tex
  })

  var [ diffuse, normal, specular ] = textures

  var light = {
    falloff: 0.15,
    radius: 5,
    position: [0, 0, 0],
    color: hex2rgb('#ffc868'),
    ambient: hex2rgb('#0a040b')
  }

  return function draw(time, camera) {
    // move our light around
    light.position[0] = -Math.sin(time/2)*0.9
    light.position[1] = Math.sin(time/2)*0.3
    light.position[2] = 0.5+Math.sin(time/2)*2
    
    // bind our textures to the correct slots
    diffuse.bind(0)
    normal.bind(1)
    specular.bind(2)

    // draw our phong mesh
    mesh.light = light
    mesh.draw(camera)

    // draw our light indicator
    sphere.position = light.position
    sphere.color = light.color
    sphere.draw(camera)
  }
}