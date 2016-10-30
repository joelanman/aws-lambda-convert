
const fs = require('fs')
var child = require('child_process')

spawn = require('child_process').spawn,
    ls    = spawn('convert', ['/tmp/inputsvg', '-flatten', '/tmp/output.svg.jpg']);

ls.stdout.on('data', function (data) {
  console.log('stdout: ' + data.toString());
});

ls.stderr.on('data', function (data) {
  console.log('stderr: ' + data.toString());
});

ls.on('exit', function (code) {
  console.log('child process exited with code ' + code.toString());
});


// var myREPL = child.exec('convert /tmsg  werewr -flatten /tmp/output.svg.jpg')
//
// myREPL.stdout.on('data', function(data) {
//     console.log(data);
// });
//
// myREPL.on('exit', function (code, stdout, stderr) {
//   console.log('done ', code, stdout, stderr)
// })
