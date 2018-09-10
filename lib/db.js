const mysql = require('mysql')
const {
  MYSQL_DB_HOST,
  MYSQL_DB_NAME,
  MYSQL_DB_USER,
  MYSQL_DB_PASS
} = require('./constants')

// MySQL config
const dbClient = mysql.createConnection({
  host: MYSQL_DB_HOST,
  user: MYSQL_DB_USER,
  password: MYSQL_DB_PASS,
  database: MYSQL_DB_NAME
})

module.exports = {
  dbClient
}
