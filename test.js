
const fs = require('fs')
var child = require('child_process')

var fileType = 'pdf'

spawn = require('child_process').spawn

if (fileType == 'pdf'){

  var convertChild = child.spawn('gs', ['-sDEVICE=jpeg', '-o', '/tmp/output.jpg', '-dGraphicsAlphaBits=4', '-dTextAlphaBits=4', '-sPageList=1', '/tmp/input.pdf'])

} else {

  var convertChild = child.spawn('convert', ['/tmp/input.' + fileType+'[0]', '-background', 'white', '-alpha', 'remove', '-resize', '1024x1024>', '/tmp/output.jpg'])

}

convertChild.stdout.on('data', function (data) {
  console.log('stdout: ' + data.toString())
})

convertChild.stderr.on('data', function (data) {
  console.log('stderr: ' + data.toString())
})

convertChild.on('exit', function (code) {
  console.log('child process exited with code ' + code.toString())
})

// var myREPL = child.exec('convert /tmsg  werewr -flatten /tmp/output.svg.jpg')
//
// myREPL.stdout.on('data', function(data) {
//     console.log(data);
// });
//
// myREPL.on('exit', function (code, stdout, stderr) {
//   console.log('done ', code, stdout, stderr)
// })
