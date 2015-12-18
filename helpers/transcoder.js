var consts = require('../config/consts');
var schedule = require('node-schedule');
var request = require('request');

exports.transcode = function(options, wait, cb)
{
  request.post({url: consts.transcoder.upload,
                json: options},
      function (err, res, body)
  {
    if (err) {
      cb('Transcoding failed at upload stage: '+err, undefined);
    } else if (!wait) {
      cb(null, body.jobid);
    } else {
      check(body.jobid, cb);
    }
  });
};

function check(job, cb)
{
  exports.download(job, function(err, ready) {
    if (err) cb(err, undefined);
    else if (ready) cb(null, job);
    else {
      var nextCheck = new Date();
      nextCheck.setSeconds(nextCheck.getSeconds() + consts.transcoder.checkInterval);
      var checker = schedule.scheduleJob(nextCheck,
        function() { check(job, cb); });
    }
  });
};

exports.download = function(job, cb) {
  request({url: consts.transcoder.status+job, json: true}, function(err, res, status)
  {
    if (err) {
      cb('Could not find status of transcoding job', undefined, undefined);
    } else if (status.error) {
      cb('Transcoding failed', undefined, undefined);
    } else {
      cb(null, status.ready, status.result);
    }
  });
};
