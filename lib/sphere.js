import createGeometry from 'gl-geometry'
import createShader from 'gl-shader'
import mat4 from 'gl-mat4'
import icosphere from 'icosphere'

const glslify = require('glslify')
const vert = glslify('./shaders/basic.vert')
const frag = glslify('./shaders/basic.frag')

export default function(gl, opt) {
  const shader = createShader(gl, vert, frag)
  const mesh = icosphere(2)
  const geom = createGeometry(gl)
    .attr('position', mesh.positions)
    .faces(mesh.cells)
  
  const model = mat4.identity([])
  const s = 0.05

  const sphere = {
    position: [0, 0, 0],
    scale: [s, s, s],
    color: [1, 0, 0],
    draw
  }

  return sphere

  function draw(time, projection, view) {
    //set up our model matrix
    mat4.identity(model)
    mat4.translate(model, model, sphere.position)
    mat4.scale(model, model, sphere.scale)

    //set our uniforms for the shader
    shader.bind()
    shader.uniforms.projection = projection
    shader.uniforms.view = view
    shader.uniforms.model = model
    shader.uniforms.color = sphere.color

    //draw the mesh
    geom.bind(shader)
    geom.draw(gl.TRIANGLES)
    geom.unbind()
  }
}