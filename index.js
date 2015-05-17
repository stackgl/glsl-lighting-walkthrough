var createApp = require('./lib/app')
var each = require('async-each')
var loadImage = require('img')

// load our texture maps
var names = ['diffuse', 'normal', 'specular']
var urls = names.map(x => {
  return `assets/brick-${x}.jpg`
})

each(urls, loadImage, (err, images) => {
  if (err) 
    throw err

  var app = createApp(images)
  document.body.appendChild(app.canvas)
})
