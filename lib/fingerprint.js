const { exec } = require('child_process')
const path = require('path')
const https = require('https')
const fs = require('fs')
const { dbClient } = require('./db')
const { createQueueMessages, readQueueMessages, deleteQueueMessages } = require('./message-queue')
const { DEJAVU_APP_PATH, PYTHON } = require('./constants')

const activeCreativeJobs = {}

function downloadCreative (req, res, next) {
  const { creativeId, fileName, remotePath } = req.body
  if (!creativeId || !fileName || !remotePath) {
    return res.json(400, { error: 'Invalid parameters' })
  }
  // Set current creative job
  if (activeCreativeJobs[creativeId]) {
    return res.json(400, { error: 'Creative is being processed' })
  }
  activeCreativeJobs[creativeId] = true
  const localPath = path.join(__dirname, `/../creatives/${fileName}`)
  const localFile = fs.createWriteStream(localPath)
  https.get(remotePath, s3Response => { s3Response.pipe(localFile) })
  localFile.on('finish', () => {
    req.files = {
      file: {
        id: creativeId,
        name: fileName,
        path: localPath
      }
    }
    next()
  })
}

function handleFingerprint (req, res, next) {
  const CREATIVE_PATH = req.files.file.convertedPath
  if (!CREATIVE_PATH) {
    return next(new Error('No converted creative'))
  }

  const cmd = [
    PYTHON,
    `${DEJAVU_APP_PATH}/dejavu.py`,
    '--config',
    `${DEJAVU_APP_PATH}/dejavu.cnf`,
    '--fingerprint',
    CREATIVE_PATH,
    '--creative',
    req.files.file.id
  ]

  exec(cmd.join(' '), (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`)
      res.json(500, { error: error.message })
    } else if (stderr) {
      res.json(400, JSON.parse(stderr))
    } else {
      createQueueMessages(req.files.file.id, 'add', (err, success) => {
        if (err) return next(err)
        res.json(201, JSON.parse(stdout))
      })
    }
    next(error)
    delete activeCreativeJobs[req.files.file.id]
  })
}

function handleRemoveFingerprint (req, res, next) {
  // @TODO: This is vulnerable to mass assignment and is open
  const { creative } = req.params
  const query = `DELETE from songs WHERE creative_id="${creative}"`
  dbClient.query(query, (error, results, fields) => {
    if (error) {
      return res.json(500, { error: error.message })
    }
    // Needs to create delete messages for follower nodes to consume
    createQueueMessages(creative, 'del', (queueError, success) => {
      if (queueError) {
        return res.json(500, { error: queueError.message })
      }
      res.json({ success: 'OK' })
    })
  })
}

function handleGetNodeMessages (req, res, next) {
  const { node } = req.params
  readQueueMessages(node, (error, messages) => {
    if (error) {
      return res.json(500, { error: error.message })
    }
    res.json({ messages })
    res.on('finish', () => {
      deleteQueueMessages(node, (error) => {
        if (error) console.log('Delete Error:', error)
      })
    })
  })
}

module.exports = {
  downloadCreative,
  handleFingerprint,
  handleRemoveFingerprint,
  handleGetNodeMessages
}
