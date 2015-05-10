import context from 'webgl-context'
import loop from 'canvas-fit-loop'
import assign from 'object-assign'
import mat4 from 'gl-mat4'

import createScene from './scene'

export default function(images) {
  const gl = context()
  const canvas = gl.canvas
  const app = loop(canvas, { 
    scale: window.devicePixelRatio 
  }).on('tick', render)

  //Model, View, Projection
  const projection = mat4.identity([])
  const view = mat4.identity([])
    
  //Camera properties
  const eye = [0, 0, 0]
  const target = [0, 0, 0]
  const up = [0, 1, 0]

  const drawScene = createScene(gl, images)

  let time = 0
  app.start()

  return assign(app, {
    canvas, 
    gl
  })

  function render(dt) {
    time += dt / 1000

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)

    gl.clearColor(0, 0, 0, 1)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    //build a perspective matrix
    const [ width, height ] = app.shape
    mat4.perspective(projection, Math.PI/4, width/height, 0.01, 100)
    
    //rotate the camera around origin
    const rotation = Math.PI/4 + time * 0.2
    const radius = 4
    eye[0] = Math.cos(rotation) * radius
    eye[2] = Math.sin(rotation) * radius

    //build a view matrix
    mat4.lookAt(view, eye, target, up)

    //draw our scene
    drawScene(time, projection, view)
  }
}
