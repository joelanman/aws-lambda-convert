const gm = require('gm').subClass({imageMagick: true})

gm(__dirname + '/test.svg')
  .antialias(true)
  .background('white')
  .alpha('remove')
  .strip()
  .resize('1024x1024')
  .toBuffer('PNG', function (err, buffer) {
    if (err) {
      console.error(err)
    } else {
      console.log('success: ' + buffer.length)
    }
  })
  // .write(__dirname + '/test.png', function(error) {
  //   if (error) {
  //     console.error(error);
  //   } else {
  //     console.log(this.outname);
  //   };
  // })
