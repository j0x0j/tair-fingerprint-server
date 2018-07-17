const path = require('path')
const dotenv = require('dotenv')
const config = dotenv.load().parsed

module.exports = {
  DEJAVU_APP_PATH: path.join(__dirname, '/../../dejavu'),
  PYTHON: config.PYTHON,
  FFMPEG: config.FFMPEG
}
