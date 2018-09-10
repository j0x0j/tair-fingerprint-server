const path = require('path')
const dotenv = require('dotenv')
const config = dotenv.load().parsed

module.exports = {
  DEJAVU_APP_PATH: path.join(__dirname, '/../../dejavu'),
  PYTHON: config.PYTHON,
  FFMPEG: config.FFMPEG,
  MYSQL_DB_HOST: config.MYSQL_DB_HOST,
  MYSQL_DB_NAME: config.MYSQL_DB_NAME,
  MYSQL_DB_USER: config.MYSQL_DB_USER,
  MYSQL_DB_PASS: config.MYSQL_DB_PASS
}
