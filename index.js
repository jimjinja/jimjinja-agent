// Requiring modules
var request = require('request');
var newXhr = require('socket.io-client-cookies-headers');
var camera = require('./picamera');
var sh = require('./pishell');
var gpio = require('./pigpio');
var audio = require('./piaudio');
var date_util = require('date-utils');
var async = require('async');
var fs = require('fs');
var ss = require('socket.io-stream');

// Read config json file
if (process.env.NODE_ENV == 'production') {
  var configjson = require(__dirname + '/config.json');
} else {
  var configjson = require(__dirname + '/config.dev.json');
}
var modulejson = require(__dirname + '/module.json');
var server_url = configjson.url;
var form_username = configjson.username;
var form_password = configjson.password;
var form_version = configjson.version;

// Create a queue object with concurrency 1
var concurrency = 1;
var queue = async.queue(function(task, callback) {
  console.log('Task : ' + task.name + ' (waiting:' + queue.length() + ')');

  var stack = [];
  async.each(task.message.workflow, function(job, callback) {
    // Set async jobs
    stack.push(function(callback) {
      // Set start time
      job['starttime'] = Date.now();

      // Switching by module_id
      switch(modulejson[job['module_id']]['type']) {
        case "in_camera":
          // Set current date and filename
          var dt = new Date();
          var params = { filename: dt.toFormat(job['parameter'] + "_YYYYMMDDHH24MISS") + ".jpg"};

          // Taking a picture
          camera.takePicture(params, function(err, data) {
            if (err) job['status'] = "2";
            else job['status'] = "3";
            job['endtime'] = Date.now();
            job['filename'] = params.filename;

            var stream = ss.createStream();
            var filename = './pictures/' + params.filename;
            ss(task.socket).emit('server_picture', stream, {name: filename});
            var chunkStream =  fs.createReadStream(filename);
            var size = 0;
            var stat = fs.statSync(filename);
            chunkStream.on('data', function(chunk) {
              size += chunk.length;
              console.log('Uploading to server ' + Math.floor(size / stat.size * 100) + '%');
              ss(task.socket).emit('server_progress', Math.floor(size / stat.size * 100));
            });
            chunkStream.pipe(stream);
            callback();
          });
          break;
        case "in_audio":
          // Set audio filename
          var params = { filename: job['parameter'] };

          // Playing an audio file
          audio.playAudio(params, function(err, data) {
            if (err) job['status'] = "2";
            else job['status'] = "3";
            job['endtime'] = Date.now();
            callback();
          });
          break;
        case "gpio_high":
          // Set gpio number
          var params = { gpionum: job['parameter'] };

          gpio.high(params, function(err, data) {
            if (err) job['status'] = "2";
            else job['status'] = "3";
            job['endtime'] = Date.now();
            callback();
          });
          break;
        case "gpio_low":
          // Set gpio number
          var params = { gpionum: job['parameter'] };

          gpio.low(params, function(err, data) {
            if (err) job['status'] = "2";
            else job['status'] = "3";
            job['endtime'] = Date.now();
            callback();
          });
          break;
        case "shell":
          // Set exec file and parameter
          var execFile = __dirname + "/../cli/" + modulejson[job['module_id']]['exec'];
          var parameter = job['parameter'];

          // Perform a shell
          sh.perform({shell: execFile, option: [parameter]}, function(err, data) {
            if (err) job['status'] = "2";
            else job['status'] = "3";
            job['endtime'] = Date.now();
            callback();
          });
          break;
      }
    });
  });

  // Perform jobs
  async.series(stack, function(err, data) {
    callback(null, task.message);
  });
}, concurrency);

// Assign a callback
queue.drain = function() {
  console.log('all items have been processed');
};

// Lets configure and request
request({
  url : 'http://' + server_url + '/login',   // URL to hit
  qs  : {
    from : 'motobot',
    time : +new Date()
  },
  method : 'POST',  // Query string data
  form : {  // Lets post the following key/values as form
    username: form_username,
    password: form_password
  }
}, function(err, res) {
  if(err) {
    console.log(err);
    return;
  }
  newXhr.setCookies(res.headers["set-cookie"]);
  var socket = require('socket.io-client')('http://' + server_url);

  // Connect
  socket.on('connect', function() {
    console.log("Connected.");
    socket.emit('server_login', {pi_username: form_username, pi_version: form_version});
  });

  // Disconnect
  socket.on('disconnect', function(){
    console.log("Disconnected.");
  });

  // Receive message
  socket.on('rpi_message', function(data) {
    console.log('Message:' + data)
  });

  // ModuleList message
  socket.on('rpi_modulelist', function(data) {
    var result = true;
    for( var key in data) {
      var module_name = data[key]['module_name'] + "_" + data[key]['module_id']
      if(modulejson.hasOwnProperty(module_name) == true) {
        console.log(module_name + " test OK.")
      } else {
        console.log(module_name + " test NG.")
        result = false;
      }
    }
    if( result == false ) {
      socket.disconnect();
    }
  });

  // Job message
  socket.on('rpi_joblist', function(data) {
    // add some items to the queue
    queue.push({name: data.job_id, message: data, socket: socket}, function(err, data) {
      if (err) console.log(err);
      console.log('finished processing ' + data.job_id);
      socket.emit('server_joblist', data);
    });
  });
});

