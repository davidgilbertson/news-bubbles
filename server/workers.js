'use strict';
var path = require('path')
  , models = require(path.join(__dirname, 'models', 'Story.model'))
  , Story = models.Story
  , utils = require(path.join(__dirname, 'utils'))
  , devLog = utils.devLog
  , prodLog = utils.prodLog;


function startCleanupWorker() {

  function cull() {
    var now = new Date();
    prodLog('  --  Running a cull now  --  ', now);

    var oneDayAgo = new Date(now - (1 * 24 * 60 * 60 * 1000));
    var twoDaysAgo = new Date(now - (2 * 24 * 60 * 60 * 1000));
    var fourDaysAgo = new Date(now - (4 * 24 * 60 * 60 * 1000));
    Story.remove(
      {
        $or: [
          {
            $and: [
              {postDate: {$lt: oneDayAgo}}, //TODO tweak each of these to keep the db at a reasonable size
              {score:    {$lt: 2}}
            ]
          },
          {
            $and: [
              {postDate: {$lt: twoDaysAgo}},
              {score:    {$lt: 4}}
            ]
          },
          {
            $and: [
              {postDate: {$lt: fourDaysAgo}},
              {score:    {$lt: 8}}
            ]
          }
        ]
      }
    );
  }

  setInterval(function() {
    cull();
  }, 1 * 24 * 60 * 60 * 1000); //Daily

}


function startMemoryStatsReporter() {

  function printMemStats() {
    var usage = process.memoryUsage();
    var rss = Math.round(+usage.rss / (1024 * 1024)) + 'mb';
    var heapTotal = Math.round(+usage.heapTotal / (1024 * 1024)) + 'mb';
    var heapUsed = Math.round(+usage.heapUsed / (1024 * 1024)) + 'mb';
    prodLog('  --  Memory usage  --  |  rss:', rss, ' Heap Total:', heapTotal, ' Heap Used:', heapUsed);
  }

  setInterval(function() {
    process.nextTick(printMemStats);
  }, 30000);

}

exports.startCleanupWorker = startCleanupWorker;
exports.startMemoryStatsReporter = startMemoryStatsReporter;
