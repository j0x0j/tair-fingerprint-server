const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const { DEJAVU_APP_PATH } = require('./constants')

function handleSample (req, res, next) {
  const SAMPLE_PATH = path.join(__dirname, '/../samples/' + req.files.file.name)
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
        SAMPLE_PATH
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

module.exports = {
  handleSample
}
