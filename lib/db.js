const mysql = require('mysql')

// MySQL config
const dbClient = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'dejavu'
})

module.exports = {
  dbClient
}
