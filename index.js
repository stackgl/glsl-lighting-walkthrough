import createApp from './lib/app'

import each from 'async-each'
import loadImage from 'img'

//load our texture maps
const names = ['diffuse', 'normal', 'specular']
const urls = names.map(x => `assets/brick-${x}.jpg`)

each(urls, loadImage, (err, images) => {
  if (err)
    throw err

  const app = createApp(images)
  document.body.appendChild(app.canvas)
})