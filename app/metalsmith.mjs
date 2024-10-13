import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import Metalsmith from 'metalsmith'
import markdown from '@metalsmith/markdown'
import layouts from '@metalsmith/layouts'

const __dirname = dirname(fileURLToPath(import.meta.url))

Metalsmith(__dirname)
  .source('./content')
  .destination('./build')
  .clean(true)
  .use(markdown())
  .metadata({
    sitename: 'P52',
    siteurl: 'https://example.com/',
    description: "It's about saying Hello to the world."
  })
  .use(
    layouts({
      pattern: '**/*.html'
    })
  )
  .build((err) => {
    if (err) throw err
    console.log(`Build success`)
  })