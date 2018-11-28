// Worker in charge of creating messages for queue
const async = require('async')
const { NODE_NAME } = require('./constants')
const { dbClient } = require('./db')

function createQueueMessages (creativeId, mainCallback) {
  if (NODE_NAME !== 'd0') {
    // Only master node can create messages
    return mainCallback(null, true)
  }
  async.waterfall([
    function getNodes (callback) {
      dbClient.query(`SELECT * FROM nodes`, (error, rows) => {
        callback(error, rows)
      })
    },
    function (nodes, callback) {
      async.each(nodes, (node, eachCallback) => {
        const query = `INSERT INTO messages (node_name, creative_id) VALUES ("${node.name}", "${creativeId}")`
        dbClient.query(query, (error, messages) => {
          eachCallback(error, messages)
        })
      })
      callback(null, true)
    }
  ], (err, result) => {
    mainCallback(err, result)
  })
}

function deleteQueueMessages (node, mainCallback) {
  if (!node) return mainCallback(new Error('Needs the node name'))
  dbClient.query(`DELETE FROM messages WHERE node_name="${node}"`, (error, rows) => {
    mainCallback(error, true)
  })
}

function readQueueMessages (node, mainCallback) {
  if (!node) return mainCallback(new Error('Needs the node name'))
  dbClient.query(`SELECT * FROM messages WHERE node_name="${node}"`, (error, rows) => {
    mainCallback(error, rows)
  })
}

module.exports = {
  createQueueMessages,
  readQueueMessages,
  deleteQueueMessages
}
