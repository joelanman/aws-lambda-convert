const AWS = require('aws-sdk')
const gm = require('gm').subClass({imageMagick: true})

const s3 = new AWS.S3()

exports.handler = function (event, context) {
  var srcBucket = event.Records[0].s3.bucket.name
  // Object key may have spaces or unicode non-ASCII characters.
  var srcKey = event.Records[0].s3.object.key.replace(/\+/g, ' ')
  srcKey = decodeURIComponent(srcKey)

  console.log(srcBucket)
  console.log(srcKey)

  // Infer the image type.
  var typeMatch = srcKey.match(/\.([^.]*)$/)
  if (!typeMatch) {
    console.error('unable to infer image type for key ' + srcKey)
    return
  }
  var fileType = typeMatch[1].toLowerCase()
  if (fileType !== 'pdf' && fileType !== 'png' && fileType !== 'jpg') {
    console.log('Can\'t process this filetype: ' + srcKey)
    return
  }

  var newFiletype = 'JPG'

  // download, convert, and upload

  function download () {
    console.time('download')
    console.log('download')
    // Download the file from S3 into a buffer.
    s3.getObject({
      Bucket: srcBucket,
      Key: srcKey
    }, convert)
    console.timeEnd('download')
  }

  function convert (err, response) {
    if (err) {
      console.error(err)
      return
    }
    // convert to png
    console.time('convert')
    console.log('Reponse content type :' + response.ContentType)
    console.log('convert')
    gm(response.Body)
      .antialias(true)
      .background('white')
      .alpha('remove')
      .strip()
      .resize('1024x1024\>')
      .toBuffer(newFiletype, function (err, buffer) {
        if (err) {
          console.error(err)
        } else {
          console.timeEnd('convert')
          upload(buffer)
        }
      })
  }

  function upload (data) {
    console.time('upload')
    var newKey = srcKey.split('/')
    newKey.shift() // remove 'pdf/'
    newKey.unshift('out')
    newKey = newKey.join('/') + '.thumbnail.' + newFiletype.toLowerCase()
    console.log(`upload to path : ${newKey}`)
    // Stream the transformed image to a different folder.
    s3.putObject({
      Bucket: srcBucket,
      Key: newKey,
      Body: data,
      ContentType: newFiletype
    }, function (err) {
      console.timeEnd('upload')
      if (err) {
        console.error(err)
      } else {
        console.log('done')
      }
    })
  }

  download()
}
