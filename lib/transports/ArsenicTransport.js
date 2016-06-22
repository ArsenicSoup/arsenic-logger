var stack = require('callsite');
var path = require('path');
var util = require('util');
var httpHelper = require('./HttpHelper.js');
var ConsoleTransport = require('./transports/ConsoleTransport.js');
var FileTransport = require('./transports/FileTransport.js');
var PaperTrailTransport = require('./transports/PaperTrailTransport.js');
var os = require("os");
var needle = require('needle');
var _ = require('lodash');
var moment = require('moment');

var ArsenicRemoteLogger = {

    message: function(args, level, stackObj, hasTag){

        var msg = "";
        var start_i = 0;
        var tag = "";

        if (hasTag){
            start_i = 1;
            if (typeof args[i] == 'object'){
                tag = args[0]['tag'];
            }
            else {
                tag = args[0];
            }
        }
        else if (settings.logTag){
            tag = settings.logTag;
        }


        for (var i=start_i; i<args.length; i++) {

            if (typeof args[i] == 'object'){
                var useCol = false;
                msg += JSON.stringify(args[i], null, "</br>");
            }
            else {
                msg += args[i];
            }

            msg += " ";
        }

        var log_level = self.getLevel(level);

        if (globalLogLevel){
            if (log_level < globalLogLevel){
                return;
            }
        }
        else {
            if (log_level < logLevel){
                return;
            }
        }

        var depth = 1;
        var startDepth = 3;
        if (level == 'exception') startDepth = 4;
        var stackObjList = [];

        stackObj.forEach(function(site){

            var no = site.getLineNumber();
            var fname = path.basename(site.getFileName());
            var funcname = site.getFunctionName();

            if (funcname){
                funcname = ' ('+funcname + ')' || '';
            }
            else {
                funcname = '';
            }

            var obj = {
                functionName: site.getFunctionName() || 'anonymous',
                fileName: path.basename(site.getFileName()),
                line: site.getLineNumber()
            };

            if (depth >= startDepth && depth <= startDepth + settings.maxDepth){
                stackObjList.push(obj);
            }

            depth++;

        });

        if (settings.apiKey){

            var mem = process.memoryUsage();
            var load = os.loadavg();
            var cpus = os.cpus().length;

            var data = {
                apiKey: settings.apiKey,
                message: msg,
                memory: mem.heapUsed,
                memoryTotal: os.totalmem(), //mem.heapTotal,
                cpu: load[2],
                level: level,
                hostname: os.hostname(),
                stack: JSON.stringify(stackObjList),
                pid: process.pid,
                tag: tag
            };

            //console.log(data);

            var url = 'http://logger.arsenicsoup.com/api/log';
            //var url = 'http://localhost:3010/api/log';

            submitLog(url, data, 1);

            function submitLog(url, data, tryNo){

                try {
                    needle.post(url, data, {follow: true, json:true, timeout: 1000}, function(err, resp, body){
                        if (err){
                            if (tryNo < 3){
                                submitLog(url, data, tryNo++);
                            }
                        }
                    });
                }
                catch(err){
                    console.log("Error sending log", err);
                }

            }

            //httpHelper.request('http://logger.arsenicsoup.com/api/log', {method: 'POST', params:data});

            //httpHelper.Post('logger.arsenicsoup.com', '/api/log', data);

        }

    }
}

module.exports = ArsenicRemoteLogger;
