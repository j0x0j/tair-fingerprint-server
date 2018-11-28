const util = require('util')
const request = require('request')
const {
  NODE_NAME,
  WORKER_INTERVAL,
  MASTER_DEJAVU_URL,
  BMP_URL,
  S3_BUCKET
} = require('./lib/constants')

const S3_PATH = `https://s3.us-east-2.amazonaws.com/${S3_BUCKET}`
const get = util.promisify(request.get)
const post = util.promisify(request.post)
const fingerprintUrl = 'http://localhost:8080/fingerprint'

let mainInterval

const main = async function () {
  console.log('STARTING')
  if (NODE_NAME === 'd0') {
    return clearInterval(mainInterval)
  }
  try {
    // get messages for node
    const messagesResponse =
      await get(`${MASTER_DEJAVU_URL}/messages/${NODE_NAME}`, { json: true })
    // post to local server for download and fingerprint
    messagesResponse.body.messages.forEach(async message => {
      const creativeId = message.creative_id
      // get creative details
      const creativeResponse =
        await get(`${BMP_URL}/api/creative/${creativeId}`, { json: true })
      const messageResponse = await post(fingerprintUrl, {
        formData: {
          creativeId,
          remotePath: `${S3_PATH}/${creativeResponse.body.filePath}`,
          fileName: creativeResponse.body.filePath.split('/')[1]
        },
        json: true
      })
      console.log('messageResponse', messageResponse.body)
    })
  } catch (error) {
    console.log(error.message)
    // Should notify owner
    clearInterval(mainInterval)
  }
}

mainInterval = setInterval(main, WORKER_INTERVAL)
