import createGeometry from 'gl-geometry'
import createShader from 'gl-shader'
import createTorus from 'torus-mesh'
import normals from 'normals'
import mat4 from 'gl-mat4'

//babelify@6.0.2 breaks the static analysis here
//https://github.com/babel/babelify/issues/81 
const glslify = require('glslify')

const vert = glslify('./shaders/phong.vert')
const frag = glslify('./shaders/phong.frag')

export default function(gl, opt) {
  const uniforms = undefined //auto detect
  const attributes = [
    { name: 'position', type: 'vec4', location: 0 },
    { name: 'normal', type: 'vec3', location: 1 }
  ]

  const complex = createTorus({
    majorSegments: 64,
    minorSegments: 64
  })

  //enable derivatives for face normals
  const ext = gl.getExtension('OES_standard_derivatives')
  if (!ext)
    throw new Error('derivatives not supported')

  const shader = createShader(gl, vert, frag, uniforms, attributes)

  const geom = createGeometry(gl)
    .attr('position', complex.positions)
    .attr('normal', complex.normals)
    .attr('uv', complex.uvs, { size: 2 })
    .faces(complex.cells)
  
  const model = mat4.identity([])

  const mesh = {
    draw,
    light: null,
    flatShading: false,
  }

  return mesh

  function draw(time, projection, view) {
    //set our uniforms for the shader
    shader.bind()
    shader.uniforms.projection = projection
    shader.uniforms.view = view
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