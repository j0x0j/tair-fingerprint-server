const restify = require('restify')
const corsMiddleware = require('restify-cors-middleware')
const { dbClient } = require('./lib/db')

const {
  downloadCreative,
  handleFingerprint,
  handleRemoveFingerprint
} = require('./lib/fingerprint')
const { handleSample } = require('./lib/sample')
const { transcodeCreative } = require('./lib/transcoder')

function handleHealth (req, res, next) {
  res.json({
    status: 'OK'
  })
}

const server = restify.createServer()

// 4 minutes timeout
server.server.setTimeout(240000)

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

server.get('/health', handleHealth)
server.head('/health', handleHealth)

// Process a sample
server.post('/sample', handleSample)

// Create fingerprint data
server.post(
  '/fingerprint',
  downloadCreative,
  transcodeCreative,
  handleFingerprint
)

// Delete a fingerprint
server.del('/fingerprint/:name', handleRemoveFingerprint)

server.listen(process.env.PORT || 8080, () => {
  // Connect to dejavu DB
  dbClient.connect()
  console.log('%s listening at %s', server.name, server.url)
})
