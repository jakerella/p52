const start = Date.now()

const fs = require('fs-extra')
const path = require('path')
const Handlebars = require('handlebars')
const logger = require('./logger.js')()

// You should change these options! //
const BUILD_DEST = 'app/build/'
const DEFAULT_LAYOUT = 'basic'
const LAYOUTS_LOC = 'app/layouts/'
const PARTIALS_LOC = 'app/layouts/partials/'
const PAGES_LOC = 'app/pages/'
const STATIC_COPIES = [
  { source: 'app/assets/', dest: '' }
]
// ------------------------------- //

;(() => {
  logger.info('Starting build...')

  logger.log('Cleaning previous build...')
  fs.rmSync(BUILD_DEST, { recursive: true, force: true })
  logger.debug(`Removed previous build folder: ${BUILD_DEST}`)

  const templates = buildTemplates()
  logger.info(`Parsed ${Object.keys(templates).length} templates for use: ${Object.keys(templates)}`)

  fs.mkdirSync(BUILD_DEST)
  logger.log(`Created new build directory at: ${BUILD_DEST}`)

  const pages = gatherPageData()
  for (let name in pages) {
    const result = templates[pages[name].layout || DEFAULT_LAYOUT]({ ...pages[name].metadata, contents: pages[name].contents })
    logger.debug(`Generated page (${name}) from template (${pages[name].layout || DEFAULT_LAYOUT})`)
    fs.writeFileSync(`${BUILD_DEST}/${name}.html`, result)
    logger.debug(`Wrote page contents to: ${BUILD_DEST}/${name}.html`)
  }

  STATIC_COPIES.forEach(loc => {
    const dest = path.join(BUILD_DEST, loc.dest)
    logger.debug(`copying ${loc.source} to ${dest}`)
    const out = fs.copySync(loc.source, dest)
  })
  logger.info(`Copied static assets to ${BUILD_DEST}`)

  reportCompletion()
})()


// ---------------------- HELPERS ---------------------- //

function buildTemplates() {
  const partials = gatherFilesFromDir(PARTIALS_LOC, 'partial')
  Handlebars.registerPartial(partials)
  logger.debug(`Registered ${Object.keys(partials).length} partials with Handlebars`)

  const layouts = gatherFilesFromDir(LAYOUTS_LOC, 'layout')
  const templates = {}
  for (let name in layouts) {
    templates[name] = Handlebars.compile(layouts[name])
    logger.debug(`Compiled ${name} template from layout`)
  }
  logger.log(`Compiled ${Object.keys(templates).length} layout templates`)
  return templates
}

function gatherPageData() {
  const pages = {}
  const pageFiles = gatherFilesFromDir(PAGES_LOC, 'page')
  for (let name in pageFiles) {
    if (pageFiles[name].indexOf('---') !== 0 || pageFiles[name].indexOf('---', 4) < 0) {
      logger.warn(`Skipping page file with bad or missing metadata: ${name}`)
      continue
    }
    const pageParts = pageFiles[name].split('---')
    const metaLines = pageParts[1].split(/\n/).slice(1,-1)
    const metadata = {}
    metaLines.forEach((line) => {
      const data = line.split(':')
      metadata[data[0]] = data[1].trim()
    })
    logger.debug(`Parsed metadata for: ${name}`)
    pages[name] = {
      contents: pageParts[2],
      metadata,
      sourceLoc: path.join(PAGES_LOC, `${name}.html`)
    }
  }
  logger.info(`Parsed ${Object.keys(pages).length} pages for processing`)
  return pages
}

function gatherFilesFromDir(dir, type) {
  logger.debug(`Looking for ${type} files at: ${dir}`)
  const files = {}
  fs.readdirSync(dir, { withFileTypes: true }).forEach((f) => {
    if (!f.isFile()) {
      return logger.debug(`Skipping non-file entry: ${f.name}`)
    }
    const filename = f.name
    try {
      files[filename.split('.')[0]] = fs.readFileSync(path.join(dir, filename)).toString()
    } catch (err) {
      return logger.warn(`Unable to read file: ${filename}`)
    }
    logger.debug(`Found ${type}: ${filename}`)
  })
  logger.log(`Found ${Object.keys(files).length} ${type} entries`)
  return files
}

function reportCompletion() {
  let units = 'ms'
  let diff = Date.now() - start
  if (diff > 1000) {
    diff = Math.round((Date.now() - start) / 100) / 10
    units = 's'
  }

  logger.info(`Finished build in ${diff}${units}`)
}
