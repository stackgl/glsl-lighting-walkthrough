var createApp = require('./lib/app')
var each = require('async-each')
var loadImage = require('img')

// load our texture maps
const names = ['diffuse', 'normal', 'specular']
const urls = names.map(x => {
  return `assets/brick-${x}.jpg`
})

each(urls, loadImage, (err, images) => {
  if (err) 
    throw err

  const app = createApp(images)
  document.body.appendChild(app.canvas)
})
