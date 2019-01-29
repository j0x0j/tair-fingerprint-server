const util = require('util')
const request = require('request')
const schedule = require('node-schedule')
const {
  NODE_NAME,
  MASTER_DEJAVU_URL,
  BMP_URL,
  S3_BUCKET
} = require('./lib/constants')

const S3_PATH = `https://s3.us-east-2.amazonaws.com/${S3_BUCKET}`
const get = util.promisify(request.get)
const post = util.promisify(request.post)
const del = util.promisify(request.del)
const fingerprintUrl = 'http://localhost:8080/fingerprint'

const main = async function () {
  if (NODE_NAME === 'd0') {
    throw new Error('Worker can not run in master node')
  }
  console.log('STARTING')
  try {
    // get messages for node
    const messagesResponse =
      await get(`${MASTER_DEJAVU_URL}/messages/${NODE_NAME}`, { json: true })
    // post to local server for download and fingerprint
    for (const message of messagesResponse.body.messages) {
      const creativeId = message.creative_id
      let messageResponse
      if (message.type === 'add') {
        // Need to add a new fingerprint
        // get creative details
        try {
          const creativeResponse =
            await get(`${BMP_URL}/api/creative/${creativeId}`, { json: true })
          if (!creativeResponse.body || !creativeResponse.body.filePath) {
            throw new Error(`No creative found for id ${creativeId}`)
          }
          messageResponse = await post(fingerprintUrl, {
            formData: {
              creativeId,
              remotePath: `${S3_PATH}/${creativeResponse.body.filePath}`,
              fileName: creativeResponse.body.filePath.split('/')[1]
            },
            json: true
          })
          console.log('[ADD] messageResponse', messageResponse.body)
        } catch (messageFingerprintError) {
          console.error('[ADD:ERROR] messageResponse', messageFingerprintError.message)
        }
      } else if (message.type === 'del') {
        // Need to remove an expired fingerprint
        try {
          messageResponse = await del(`${fingerprintUrl}/${creativeId}`, { json: true })
          console.log('[DEL] messageResponse', messageResponse.body)
        } catch (messageDeleteError) {
          console.error('[DEL:ERROR] messageResponse', messageDeleteError.message)
        }
      }
    }
  } catch (error) {
    console.log(error.message)
    // Should notify owner
  }
}

const rule = new schedule.RecurrenceRule()
// Runs every 45 minutes past the hour
rule.minute = 45

const job = schedule.scheduleJob(rule, main)

job.on('run', function () {
  console.log('Dejavu Sync Job Running', new Date())
})
