import createTorus from './torus'
import createSphere from './sphere'
import createTexture from 'gl-texture2d'
import hex2rgb from './hex-to-rgb'

export default function(gl, images) {
  const mesh = createTorus(gl)
  const sphere = createSphere(gl)

  const textures = images.map(image => {
    const tex = createTexture(gl, image)
    tex.minFilter = gl.LINEAR_MIPMAP_LINEAR
    tex.magFilter = gl.LINEAR
    tex.generateMipmap()
    tex.wrap = gl.REPEAT
    return tex
  })

  const [ diffuse, normal, specular ] = textures

  const light = {
    falloff: 0.6,
    radius: 5,
    position: [0, 0, 0],
    color: hex2rgb('#df9c27'),
    ambient: hex2rgb('#4e0e4f')
  }

  return function draw(time, projection, view) {
    // move our light a bit
    light.position[0] = -Math.sin(time/2)*2
    light.position[1] = Math.sin(time/2)*1
    light.position[2] = Math.sin(time/2)*0.5
    
    // bind our textures to correct slots
    diffuse.bind(0)
    normal.bind(1)
    specular.bind(2)

    // draw our phong mesh
    mesh.light = light
    mesh.draw(time, projection, view)

    // draw our light indicator
    sphere.position = light.position
    sphere.color = light.color
    sphere.draw(time, projection, view)
  }
}