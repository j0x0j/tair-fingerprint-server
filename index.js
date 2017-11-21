const restify = require('restify')
const fs = require('fs')
const { exec } = require('child_process')

const DEJAVU_APP_PATH = __dirname + '/../dejavu'

function respond (req, res, next) {
  const SAMPLE_PATH = __dirname + '/samples/' + req.files.file.name

  fs.createReadStream(req.files.file.path)
    .pipe(fs.createWriteStream(SAMPLE_PATH))
    .on('finish', () => {
      const cmd = [
        'python2.7',
        `${DEJAVU_APP_PATH}/dejavu.py`,
        '--config',
        `${DEJAVU_APP_PATH}/dejavu.cnf`,
        '--recognize',
        'file',
        SAMPLE_PATH,
      ]

      exec(cmd.join(' '), (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`)
          res.json(500, { status: 'error' })
        } else {
          res.json(JSON.parse(stdout))
        }
        fs.unlink(SAMPLE_PATH, (err) => {
          next(err)
        })
      })
    })
}

function handleHealth (req, res, next) {
  res.json({
    status: 'OK'
  })
}

const server = restify.createServer()

server.use(restify.plugins.bodyParser({
  mapFiles: true
}))

server.post('/sample', respond)
server.head('/sample', respond)

server.get('/health', handleHealth)
server.head('/health', handleHealth)

server.listen(process.env.PORT || 8080, () => {
  console.log('%s listening at %s', server.name, server.url)
})
