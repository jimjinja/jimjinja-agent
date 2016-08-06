exports.playAudio = function(params, cb) {
  // Set filename and option
  var audioFilename = params.filename;
  var option = [ '-o', "both", audioFilename ];

  // Take a picture
  var spawn = require('child_process').spawn;
  var child = spawn('omxplayer', option);

  // event emmitter - data(strout)
  child.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });

  // event emmitter - data(stderr)
  child.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  // event emmitter - close
  child.on('close', function (code) {
    console.log('playing an audio file process exited with code ' + code);
    cb(null, code);
  });

  // event emmitter - error
  child.on('error', function (err) {
    console.log('error: ' + err);
    return cb(err);
  });
}
