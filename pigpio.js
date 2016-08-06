// Requiring modules
var rpio = require('rpio');
var async = require('async');

exports.high = function(params, cb) {
  if (typeof params.gpionum !== 'undefined' && params.gpionum !== null){
    async.each(params.gpionum.split(','), function(data, next) {
      try {
        rpio.open(data, rpio.OUTPUT);
        rpio.write(data, rpio.HIGH);
      } catch(e) {
        console.log(e);
      }
      next();
    }, function complete(err) {
      cb(null, params.gpionum);
    });
  } else
  {
    cb(null, null);
  }
}

exports.low = function(params, cb) {
  if (typeof params.gpionum !== 'undefined' && params.gpionum !== null){
    async.each(params.gpionum.split(','), function(data, next) {
      try {
        rpio.open(data, rpio.OUTPUT);
        rpio.write(data, rpio.LOW);
      } catch(e) {
        console.log(e);
      }
      next();
    }, function complete(err) {
      cb(null, params.gpionum);
    });
  } else
  {
    cb(null, null);
  }
}
