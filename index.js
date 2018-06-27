const restify = require('restify')
const fs = require('fs')
const mysql = require('mysql')
const { exec } = require('child_process')
const corsMiddleware = require('restify-cors-middleware')

const DEJAVU_APP_PATH = __dirname + '/../dejavu2'

// MySQL config

const dbClient = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'dejavu',
})

function handleSample (req, res, next) {
  const SAMPLE_PATH = __dirname + '/samples/' + req.files.file.name
  const TEMP_PATH = req.files.file.path

  fs.createReadStream(TEMP_PATH)
    .pipe(fs.createWriteStream(SAMPLE_PATH))
    .on('finish', () => {
      const cmd = [
        'python3',
        `${DEJAVU_APP_PATH}/dejavu.py`,
        '--config',
        `${DEJAVU_APP_PATH}/dejavu.cnf`,
        '--recognize',
        'file',
        SAMPLE_PATH,
      ]

      exec(cmd.join(' '), (error, stdout, stderr) => {
        fs.unlinkSync(SAMPLE_PATH)
        fs.unlinkSync(TEMP_PATH)
        if (error) {
          console.error(`exec error: ${error}`)
          res.json(500, { status: 'error' })
          next(error)
        } else {
          res.json(JSON.parse(stdout))
        }
      })
    })
    .on('error', (error) => {
      console.error(`file error: ${error}`)
      fs.unlinkSync(SAMPLE_PATH)
      fs.unlinkSync(TEMP_PATH)
      next(error)
    })
}

function handleHealth (req, res, next) {
  res.json({
    status: 'OK'
  })
}

function handleFingerprint (req, res, next) {
  const CREATIVE_DIR = `${DEJAVU_APP_PATH}/wav`
  const CREATIVE_PATH = `${CREATIVE_DIR}/${req.files.file.name}`
  const TEMP_PATH = req.files.file.path

  fs.createReadStream(TEMP_PATH)
    .pipe(fs.createWriteStream(CREATIVE_PATH))
    .on('finish', () => {
      const cmd = [
        'python3',
        `${DEJAVU_APP_PATH}/dejavu.py`,
        '--config',
        `${DEJAVU_APP_PATH}/dejavu.cnf`,
        '--fingerprint',
        CREATIVE_PATH,
      ]

      exec(cmd.join(' '), (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`)
          res.json(500, { status: 'error' })
        } else {
          res.json(JSON.parse(stdout))
        }
        next(error)
        fs.unlinkSync(TEMP_PATH)
      })
    })
}

function handleRemoveFingerprint (req, res, next) {
  const query = `DELETE from songs WHERE song_name="${req.params.name}"`
  dbClient.query(query, (error, results, fields) => {
    if (error) {
      return res.json(500, { status: 'error', message: error.message })
    }
    res.json({ status: 'OK' })
  })
}

const server = restify.createServer()

server.use(restify.plugins.bodyParser({
  mapFiles: true
}))

const cors = corsMiddleware({
  origins: ['*'],
  allowHeaders: ['Access-Control-Allow-Origin'],
  exposeHeaders: ['Access-Control-Allow-Origin']
})

server.pre(cors.preflight)
server.use(cors.actual)

server.post('/sample', handleSample)
server.head('/sample', handleSample)

server.get('/health', handleHealth)
server.head('/health', handleHealth)

server.post('/fingerprint', handleFingerprint)
server.head('/fingerprint', handleFingerprint)

server.del('/fingerprint/:name', handleRemoveFingerprint)
server.head('/fingerprint/:name', handleRemoveFingerprint)

server.listen(process.env.PORT || 8080, () => {
  // Connect to dejavu DB
  dbClient.connect()
  console.log('%s listening at %s', server.name, server.url)
})
