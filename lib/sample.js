const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { DEJAVU_APP_PATH, PYTHON } = require('./constants')

function deleteSampleFiles (files, cb) {
  Promise.all(files.map(file => new Promise((resolve, reject) => {
    fs.unlink(file, (err) => { (err ? reject(err) : resolve()) })
  })))
  .then(() => cb())
  .catch(e => cb(e))
}

function handleSample (req, res, next) {
  const SAMPLE_PATH = path.join(__dirname, '/../samples/' + req.files.file.name)
  const TEMP_PATH = req.files.file.path

  fs.createReadStream(TEMP_PATH)
    .pipe(fs.createWriteStream(SAMPLE_PATH))
    .on('finish', () => {
      const cmd = [
        PYTHON,
        `${DEJAVU_APP_PATH}/dejavu.py`,
        '--config',
        `${DEJAVU_APP_PATH}/dejavu.cnf`,
        '--recognize',
        'file',
        SAMPLE_PATH
      ]

      exec(cmd.join(' '), (execError, stdout, stderr) => {
        deleteSampleFiles([SAMPLE_PATH, TEMP_PATH], (deleteErr) => {
          if (deleteErr) console.error('delete error:', deleteErr)
          if (execError) {
            console.error(`exec error: ${execError}`)
            res.json(500, { status: 'error' })
            next(execError)
          } else {
            res.json(JSON.parse(stdout))
          }
        })
      })
    })
    .on('error', (error) => {
      console.error(`file error: ${error}`)
      deleteSampleFiles([SAMPLE_PATH, TEMP_PATH], (deleteErr) => {
        if (deleteErr) console.error('delete error:', deleteErr)
        next(error)
      })
    })
}

module.exports = {
  handleSample
}
