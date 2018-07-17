const { exec } = require('child_process')
const { dbClient } = require('./db')
const { DEJAVU_APP_PATH } = require('./constants')

function handleFingerprint (req, res, next) {
  const CREATIVE_PATH = req.files.file.convertedPath
  if (!CREATIVE_PATH) {
    return next(new Error('No converted creative'))
  }

  const cmd = [
    'python2.7',
    `${DEJAVU_APP_PATH}/dejavu.py`,
    '--config',
    `${DEJAVU_APP_PATH}/dejavu.cnf`,
    '--fingerprint',
    CREATIVE_PATH
  ]

  exec(cmd.join(' '), (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`)
      res.json(500, { status: 'error' })
    } else {
      res.json(JSON.parse(stdout))
    }
    next(error)
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

module.exports = {
  handleFingerprint,
  handleRemoveFingerprint
}
