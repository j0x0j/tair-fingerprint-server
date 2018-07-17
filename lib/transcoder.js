const fs = require('fs')
const { exec } = require('child_process')
const { DEJAVU_APP_PATH } = require('./constants')

const createFilename = (name) => {
  const parts = name.split('.')
  const ext = parts[parts.length - 1]
  return name.replace(ext, 'wav')
}

const transcodeCreative = function (req, res, next) {
  const CREATIVE_DIR = `${DEJAVU_APP_PATH}/wav`
  const OUTPUT_PATH =
    `${CREATIVE_DIR}/${createFilename(req.files.file.name)}`
  const TEMP_PATH = req.files.file.path

  const cmd = [
    'ffmpeg',
    '-i', TEMP_PATH,
    '-f', 's16le',
    '-ac', '1',
    '-ar', '44.1k',
    '-acodec', 'pcm_s16le',
    '-f', 'wav',
    OUTPUT_PATH
  ]

  exec(cmd.join(' '), (error, stdout, stderr) => {
    if (error) return next(error)
    req.files.file.convertedPath = OUTPUT_PATH
    fs.unlink(TEMP_PATH, (err) => next(err))
  })
}

module.exports = {
  transcodeCreative
}
