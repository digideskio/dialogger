const exec = require('child_process').exec;
var consts = require('../config/consts');
var transcoder = require('../helpers/transcoder');
var db = module.parent.exports.db;
var log = module.parent.exports.log;
var fs = require('fs');
var request = require('request');

exports.download = function(req, res)
{
  transcoder.download(req.params.jobid, function(err, ready, result) {
    var returnStatus = req.path.indexOf('status') > -1 ? true : false;
    if (err) {
      log.error(err);
      res.status(500).send(err);
    } else if (!ready) {
      res.status(202).json({ready: false});
    } else if (returnStatus) {
      res.json({ready: true});
    } else {
      res.download(consts.transcoder.output+req.params.jobid, result);
    }
  });
};

exports.transcode = function(req, res)
{
  db.edits.find({_id: req.params.id, owner: req.user._id}, function (err, docs) {
    if (err) log.error(err);
    else if (!docs.length) res.sendStatus(500);
    else {
      db.assets.find({_id: docs[0].asset, owner: req.user._id}, function (err, assets) {
        if (err) {
          log.error(err);
          res.sendStatus(500);
        } else if (!assets.length) {
          res.sendStatus(500);
        } else {
          var options = req.body;
          options.path = assets[0].path;

          // extra metadata for EDL
          if (assets[0].info.audio_tracks.length) {
            var audioTrack = assets[0].info.audio_tracks[0];
            options.edlconfig.sampleRate = audioTrack.sample_rate;
            options.edlconfig.channels = audioTrack.ch;
          }
          options.edlconfig.description = docs[0].description;
          options.edlconfig.filename = docs[0].name;

          transcoder.transcode(options, false, function(err, jobid) {
            if (err) {
              log.error(err);
              res.sendStatus(500);
            } else {
              log.info({options: options, username: req.user.username}, 'Transcoding started');
              res.json({success: true, jobid: jobid});
            }
          });
        }
      });
    }
  });
};

exports.save = function(req, res)
{
  db.edits.insert({
    owner: req.user._id,
    asset: req.body.asset,
    name: req.body.name,
    description: req.body.description,
    transcript: req.body.transcript,
    printed: false,
    html: req.body.html,
    edl: req.body.edl,
    dateCreated: new Date(),
    dateModified: new Date()
  }, function(err, doc) {
    if (err) {
      log.error(err);
    } else {
      log.info({edit: doc, username: req.user.username}, 'Created edit');
      res.json(doc);
    }
  });
};

exports.update = function(req, res)
{
  var fields = {dateModified: new Date()};
  if (req.body.transcript) fields.transcript = req.body.transcript;
  if (req.body.html) fields.html = req.body.html;
  if (req.body.edl) fields.edl = req.body.edl;
  if (req.body.name) fields.name = req.body.name;
  if (req.body.description) fields.description = req.body.description;
  db.edits.update({_id: req.params.id, owner: req.user._id},
      {$set: fields}, function(err, result) {
    if (err) {
      log.error(err);
    } else {
      log.info({edit: req.body, username: req.user.username}, 'Updated edit');
      res.json(result);
    }
  });
};

exports.destroy = function(req, res)
{
  db.edits.remove({_id: req.params.id, owner: req.user._id}, function(err) {
    if (err) {
      log.error(err);
    } else {
      log.info({edit: req.params.id, username: req.user.username}, 'Deleted edit');
      res.json({success: true});
    }
  });
};

exports.edits = function(req, res)
{
  // list user's edits 
  db.edits.find(
      {owner: req.user._id},
      {sort: {dateCreated: 1},
       fields: {transcript: 0, html: 0, edl: 0}}, function(err, docs) {
    if (err) log.error(err);
    else res.json(docs);
  });
};

exports.edit = function(req, res)
{
  // list a certain edit 
  db.edits.find({_id: req.params.id, owner: req.user._id},
      function(err, docs) {
    if (err) {
      log.error(err);
    } else {

      // if not a paper edit, return as normal
      if (!('printed' in docs[0])) {
        res.json(docs);
      } else if (docs[0].printed != true) {
        res.json(docs);

      // otherwise, get edited transcript from Anoto
      } else {
        request({
          url: 'https://shared.liveforms.anoto.com/BBC-FDF/output/get',
          proxy: 'http://www-cache:8080',
          method: 'POST',
          formData: {file: docs[0]._id+'.json'}
        }, function(error, response, body){
          if(error) {
            log.error(error);
          } else if (response.statusCode != 200) {
            res.sendStatus(202);
          } else {
            log.info(response.statusCode, body);
            var transcript = JSON.parse(body);
            docs[0].transcript = transcript.transcript;
            docs[0].segments = transcript.segments;
            res.json(docs);
          }
        });
      }
    }
  });
};

exports.downloadPDF = function(req, res)
{
  request({
    url: 'https://shared.liveforms.anoto.com/BBC-FDF/output/pdf',
    proxy: 'http://www-cache:8080',
    method: 'POST',
    formData: {file: req.params.id+'.json'}
  }).pipe(res);
};
