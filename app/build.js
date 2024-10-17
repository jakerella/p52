
const start = Date.now()

const fs = require('fs-extra')
const path = require('path')
const Handlebars = require('handlebars')

// You should change these options! //
const BUILD_DEST = 'app/build/'
const DEFAULT_LAYOUT = 'basic'
const LAYOUTS_LOC = 'app/layouts/'
const PARTIALS_LOC = 'app/layouts/partials/'
const PAGES_LOC = 'app/pages/'
const STATIC_COPIES = [
  { source: 'app/assets/', dest: '' },
  { source: 'scenarios/the-calico-wizard/calico-wizard.json', dest: 'scenarios/calico-wizard.json' }
]

// TODO: custom step to copy in scenarios?

// ------------------------------- //

const logger = createLogger()

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
    fs.copySync(loc.source, dest)
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

// ---------------- Logging Helper ------------------ //

function createLogger(opts = {}) {
  const LEVELS = {
    DEBUG: 5,
    LOG: 4,
    INFO: 3,
    WARN: 2,
    ERROR: 1,
    OFF: 0
  }
  const DEFAULT_LEVEL = 'INFO'
  const DEFAULT_MESSAGE_LEVEL = 'LOG'
  const LOG_METHDOS = [null, 'error', 'warn', 'info', 'log', 'debug']
  const COLORS = {
    DEBUG: '\x1b[36m',
    LOG: '\x1b[37m',
    INFO: '\x1b[34m',
    WARN: '\x1b[33m',
    ERROR: '\x1b[31m',
    RESET: '\x1b[0m'
  }
  
  const loggerLevel = (LEVELS[opts.level] === undefined) ? (process.env.DEBUG_LEVEL || DEFAULT_LEVEL) : opts.level

  if (loggerLevel === 'DEBUG') {
      console.debug(`${COLORS.DEBUG}Creating logger with level ${loggerLevel}${COLORS.RESET}`)
  }

  function writeLog(level, args) {
      level = (LEVELS[level] === undefined) ? DEFAULT_MESSAGE_LEVEL : level
      args = (args.splice) ? args : [ args ]

      if ( LEVELS[loggerLevel] < LEVELS[level] ) { return }

      const message = [COLORS[level], args[0]]

      if (args.length > 1) {
          args.slice(1).forEach((a) => {
              if (typeof(a) === 'object') {
                  message.push('\n')
                  message.push(JSON.stringify(a))
                  message.push('\n')
              } else {
                  message.push(a)
              }
          })
      }

      message.push(COLORS.RESET)

      console[LOG_METHDOS[LEVELS[level]]].apply( console, [message.join(' ')] )
  }

  const loggerInstance = function() {
      writeLog('LOG', Array.from(arguments))
  }
  loggerInstance.debug = function() { writeLog('DEBUG', Array.from(arguments)) }
  loggerInstance.log = function() { writeLog('LOG', Array.from(arguments)) }
  loggerInstance.info = function() { writeLog('INFO', Array.from(arguments)) }
  loggerInstance.warn = function() { writeLog('WARN', Array.from(arguments)) }
  loggerInstance.error = function() { writeLog('ERROR', Array.from(arguments)) }

  return loggerInstance
}
