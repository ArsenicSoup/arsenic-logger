var path = require('path');
var util = require('util');
var os = require("os");
var _ = require('lodash');
var moment = require('moment');

var ConsoleTransport = {

    colors : {
		  red:      '\033[0;31m',
		  lightRed: '\033[1;31m',
		  whiteOnRed:'\033[7;31m',
		  tag:'\033[1;30;37m',
		  green:    '\033[0;32m',
		  yellow:   '\033[0;33m',
		  blue:     '\033[0;34m',
		  magenta:  '\033[0;35m',
		  cyan:     '\033[0;36m',
		  gray:     '\033[0;90m',
		  white:    '\033[0;37m',
		  reset:    '\033[0m',
		  resetold:    '\033[39m'
	},

    message: function(args, level, stackObj, hasTag, settings, filterOptions){
        var txt = ConsoleTransport.__getText(args, level, stackObj, hasTag, settings, filterOptions);
        console.log(txt);
        //if (level == 'fatal') process.exit(0);
    },

    __getText : function(args, level, stackObj, hasTag, settings, filterOptions){

        var msg = "";
        var start_i = 0;
        var tags = [];
        var matchedTags = "";

        if (hasTag){
            start_i = 1;
            if (_.isArray(args[0])){
                tags = args[0];
            }
            else {
                tags = [args[0]];
            }
        }
        else if (settings.logTag && settings.logTag !== ''){
            tags = [settings.logTag];
        }


        if (filterOptions){

            if ('tags' in filterOptions){

                // We need to match at least one tag
                var matches = _.intersection(tags, filterOptions.tags);

                if (!matches || matches.length == 0){
                    return;
                }

                matchedTags = matches.join(' ');

            }

            if ('functions' in filterOptions){

                var findFuncName = function(names){

                    for (var key in stackObj) {
                        if (stackObj.hasOwnProperty(key)) {
                            var site = stackObj[key];
                            var funcname = site.getFunctionName();
                            if (names.indexOf(funcname) != -1) return true;
                        }
                    }

                    return false;
                }

                if (!findFuncName(filterOptions.functions)){
                    return;
                }
            }

            if ('files' in filterOptions){

                var findFileName = function(names){

                    for (var key in stackObj) {
                        if (stackObj.hasOwnProperty(key)) {
                            var site = stackObj[key];
                            var fname = path.basename(site.getFileName());
                            if (names.indexOf(fname) != -1) return true;
                        }
                    }

                    return false;
                }

                if (!findFileName(filterOptions.files)){
                    return;
                }
            }
        }

        for (var i=start_i; i<args.length; i++) {

            if (typeof args[i] == 'object'){
                var useCol = false;
                msg += util.inspect(args[i], false, null, useCol);
            }
            else {
                msg += args[i];
            }

            msg += " ";
        }

        var col = "";
        var reset = ConsoleTransport.colors.reset;

        switch(level){
            case 'log': col = ConsoleTransport.colors.green; log_level = 0; break;
            case 'debug': col = ConsoleTransport.colors.green; log_level = 1; break;
            case 'info': col = ConsoleTransport.colors.blue; log_level = 2; break;
            case 'warn': col = ConsoleTransport.colors.magenta; log_level = 3; break;
            case 'error': col = ConsoleTransport.colors.lightRed; log_level = 4; break;
            case 'fatal': col = ConsoleTransport.colors.red; log_level = 5; break;
            case 'exception': col = ConsoleTransport.colors.whiteOnRed; log_level = 5; break;
        }

        var trace_str = ConsoleTransport.colors.gray;
        var depth = 1;
        var startDepth = 3;

        if (level == 'exception') {
            startDepth = 4;
        }

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

            if (depth == startDepth){
                trace_str += " {from line " + no + " of " + fname + funcname;
            }
            else if (depth > startDepth && depth <= startDepth + settings.maxDepth){
                trace_str += ", called from line " + no + " of " + fname + funcname;
            }

            depth++;

        });

        trace_str += '}' + reset;

        var rusage = "";

        if (settings.echoMemory){
            var mem = process.memoryUsage();
            //var total = Math.ceil(os.totalmem()/1048576) ;
            var memUsed = mem.heapUsed/1048576;
            rusage += memUsed.toFixed(2) + "MB ";
        }

        if (settings.echoCPU){
            var load = os.loadavg();
            rusage += load[2].toFixed(2) + "% ";
        }

        var tagStr = "";
        if (matchedTags != ""){
            //tagStr = ConsoleTransport.colors.tag + " " + tag + " " + reset + " ";
            tagStr = '[' + matchedTags + '] ';
        }
        else if (tags.length > 0){
            tagStr = '[' + tags.join(' ') + '] ';
        }

        var timeStr = "";
        if (settings.timestamps){
            timeStr = "[" + moment().format(settings.timestampPattern) + "] ";
        }

        txt = timeStr + col + tagStr + "[" + rusage + level + "]" + reset + " " + msg + trace_str;

        return txt;
    }
}

module.exports = ConsoleTransport;
