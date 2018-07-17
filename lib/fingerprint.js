const fs = require('fs')
const { exec } = require('child_process')
const { dbClient } = require('./db')
const { DEJAVU_APP_PATH } = require('./constants')

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

module.exports = {
  handleFingerprint,
  handleRemoveFingerprint
}
