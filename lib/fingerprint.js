const { exec } = require('child_process')
const path = require('path')
const https = require('https')
const fs = require('fs')
const { dbClient } = require('./db')
const { DEJAVU_APP_PATH, PYTHON } = require('./constants')

function downloadCreative (req, res, next) {
  const { creativeId, fileName, remotePath } = req.body
  if (!creativeId || !fileName || !remotePath) {
    return res.json(400, { error: 'Invalid parameters' })
  }
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
      res.json(201, JSON.parse(stdout))
    }
    next(error)
  })
}

function handleRemoveFingerprint (req, res, next) {
  const query = `DELETE from songs WHERE song_name="${req.params.name}"`
  dbClient.query(query, (error, results, fields) => {
    if (error) {
      return res.json(500, { error: error.message })
    }
    res.json({ success: 'OK' })
  })
}

module.exports = {
  downloadCreative,
  handleFingerprint,
  handleRemoveFingerprint
}
