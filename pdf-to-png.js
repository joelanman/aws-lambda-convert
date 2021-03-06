process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']
process.env['MAGICK_CONFIGURE_PATH'] = process.env['LAMBDA_TASK_ROOT']
const child = require('child_process')
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
const fs = require('fs')

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
  if (fileType !== 'pdf' && fileType !== 'png' && fileType !== 'jpg' && fileType !== 'svg') {
    console.log('Can\'t process this filetype: ' + srcKey)
    return
  }

  var newFiletype = 'JPG'

  // download, convert, and upload

  function download () {
    console.time('download')
    console.log('download')
    // Download the file from S3 into a buffer.
    var file = fs.createWriteStream('/tmp/input.' + fileType)
    file.on('close', convert)
    s3.getObject({
      Bucket: srcBucket,
      Key: srcKey
    }).createReadStream().on('error', function (err) {
      console.log(err)
    }).pipe(file)

    console.timeEnd('download')
  }

  function convert () {
    console.time('convert')
    console.log('convert')

    if (fileType == 'pdf'){
      var convertChild = child.spawn('./gs', ['-sDEVICE=jpeg', '-o', '/tmp/output.jpg', '-dGraphicsAlphaBits=4', '-dTextAlphaBits=4', '-sPageList=1', '/tmp/input.pdf'])
    } else {
      var convertChild = child.spawn('./convert', ['/tmp/input.' + fileType +'[0]', '-background', 'white', '-alpha', 'remove', '-resize', '1024x1024>', '/tmp/output.jpg'])
    }

    convertChild.stdout.on('data', function (data) {
      console.log('stdout: ' + data.toString())
    })

    convertChild.stderr.on('data', function (data) {
      console.log('stderr: ' + data.toString())
    })

    convertChild.on('exit', function (code) {
      console.log('child process exited with code ' + code.toString())
      var error = (code !== 0)
      upload(error)
    })

    // var myREPL = child.exec('convert /tmp/input.' + fileType + ' -flatten /tmp/output.jpg')
    //
    // myREPL.stdout.on('data', function(data) {
    //     console.log(data);
    // });
    //
    // myREPL.on('exit', function (code) {
    //   upload()
    // })

    // gm(response.Body)
    //   .antialias(true)
    //   .background('white')
    //   .alpha('remove')
    //   .strip()
    //   .resize('1024x1024\>')
    //   .toBuffer(newFiletype, function (err, buffer) {
    //     if (err) {
    //       console.error(err)
    //     } else {
    //       console.timeEnd('convert')
    //       upload(buffer)
    //     }
    //   })
  }

  function upload (error) {
    console.time('upload')
    console.log('upload (' + error + ')')
    var newKey = srcKey.split('/')
    newKey.shift() // remove 'pdf/'
    newKey.unshift('out')
    newKey = newKey.join('/') + '.thumbnail.' + newFiletype.toLowerCase()
    console.log(`upload to path : ${newKey}`)
    var filepath = (error) ? 'file-icon.png' : '/tmp/output.jpg'
    var fileStream = fs.createReadStream(filepath)
    fileStream.on('error', function (err) {
      if (err) { throw err }
    })
    fileStream.on('open', function () {
      s3.putObject({
        Bucket: srcBucket,
        Key: newKey,
        Body: fileStream,
        ContentType: newFiletype
      }, function (err) {
        try {
          fs.unlinkSync('/tmp/output.jpg')
        } catch (e) {}
        console.timeEnd('upload')
        if (err) {
          console.error(err)
        } else {
          console.log('done')
        }
      })
    })
  }

  download()
}
