var stack = require('callsite');
var path = require('path');
var util = require('util');
var ConsoleTransport = require('./ConsoleTransport.js');
var os = require("os");
var needle = require('needle');
var _ = require('lodash');
var moment = require('moment');
var net = require('net');
var tls = require('tls');

/**
* Transport to send logs to PaperTrail
*/
var PaperTrailTransport = {

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

    host: 'logs.papertrailapp.com',
    port: '1234',
    appName: '',

    /** Flag to determine if we've initialized the connecting to papertrail yet */
    isSetup: false,

    /** Flag to determing if we're erroring (can't connect to papertrail) */
    isErroring: false,

    /** Maximum buffer size (default: 1MB) */
    maxBufferSize : 1 * 1024 * 1024,

    /** Disable TLS connections (enabled by default) */
    disableTls: false,

    /** Number of attempts before decaying reconnection */
    attemptsBeforeDecay: 5,

    /** Maximum number of reconnection attempts before disabling buffer */
    maximumAttempts: 25,

    /** Delay between normal attempts */
    connectionDelay: 1000,

    /** Handle Exceptions */
    handleExceptions: false,

    /** Maximum delay between attempts */
    maxDelayBetweenReconnection: 6000,

    /** Total connection retries */
    currentRetries: 0,

    /** Total retries */
    totalRetries: 0,

    /** Buffer to store logs until we connect */
    buffer: '',

    /** True if we have an active connection */
    loggingEnabled: true,

    /** Max time to keep connection alive */
    _KEEPALIVE_INTERVAL : 15 * 1000,

    /**
    * Setup the conncetion to paper trail
    */
    setup : function(host, port, useTLS){

        PaperTrailTransport.host = host;
        PaperTrailTransport.port = port;

        if (!PaperTrailTransport.isSetup){
            PaperTrailTransport.isSetup = true;
            PaperTrailTransport.__connectStream();
        }
    },

    message: function(args, level, stackObj, hasTag, settings, filterOptions){

        if (!PaperTrailTransport.isSetup){
            PaperTrailTransport.isSetup = true;
            PaperTrailTransport.__connectStream();
        }

        var msg = PaperTrailTransport.__getText(args, level, stackObj, hasTag, settings, filterOptions) + "\n\r";

        if (PaperTrailTransport.stream && PaperTrailTransport.stream.writable) {
            PaperTrailTransport.stream.write(msg);
        }
        else if (PaperTrailTransport.loggingEnabled && PaperTrailTransport.buffer.length < PaperTrailTransport.maxBufferSize) {
            PaperTrailTransport.buffer += msg;
        }
    },

    // Opens a connection to Papertrail
    __connectStream: function() {

        console.log("Connecting to Papertrail...");

        // don't connect on either error or shutdown
        if (PaperTrailTransport.isErroring) {
            return;
        }

        try {

            function wireStreams() {
                PaperTrailTransport.stream.on('error', PaperTrailTransport.__onErrored);
                // If we have the stream end, simply reconnect
                PaperTrailTransport.stream.on('end', PaperTrailTransport.__connectStream);
            }

            if (PaperTrailTransport.disableTls) {
                PaperTrailTransport.stream = net.createConnection(PaperTrailTransport.port, PaperTrailTransport.host, PaperTrailTransport.__onConnected);
                PaperTrailTransport.stream.setKeepAlive(true, PaperTrailTransport._KEEPALIVE_INTERVAL);
                wireStreams();
            }
            else {
                var socket = net.createConnection(PaperTrailTransport.port, PaperTrailTransport.host, function () {

                    socket.setKeepAlive(true, PaperTrailTransport._KEEPALIVE_INTERVAL);

                    PaperTrailTransport.stream = tls.connect({
                        socket: socket,
                        rejectUnauthorized: false
                    }, PaperTrailTransport.__onConnected);

                    wireStreams();
                });

                socket.on('error', PaperTrailTransport.__onErrored);
            }
        }
        catch (e) {
            console.error('Caught error:',e);
            PaperTrailTransport.__onErrored(e);
        }
    },

    __onErrored : function(err) {

        console.error('Error connecting to papertrail', err);

        // make sure we prevent simultaneous attempts to connect and handle errors
        PaperTrailTransport.isErroring = true;

        // We may be disconnected from the papertrail endpoint for any number of reasons;
        // i.e. inactivity, network problems, etc, and we need to be resilient against this
        // that said, we back off reconnection attempts in case Papertrail is truly down
        setTimeout(function () {
            // Increment our retry counts
            PaperTrailTransport.currentRetries++;
            PaperTrailTransport.totalRetries++;

            // Decay the retry rate exponentially up to max between attempts
            if ((PaperTrailTransport.connectionDelay < PaperTrailTransport.maxDelayBetweenReconnection) && (PaperTrailTransport.currentRetries >= PaperTrailTransport.attemptsBeforeDecay)) {
                PaperTrailTransport.connectionDelay = PaperTrailTransport.connectionDelay * 2;
                PaperTrailTransport.currentRetries = 0;
            }

            // Stop buffering messages after a fixed number of retries.
            // This is to keep the buffer from growing unbounded
            if (PaperTrailTransport.loggingEnabled && (PaperTrailTransport.totalRetries >= (PaperTrailTransport.maximumAttempts))) {
                PaperTrailTransport.loggingEnabled = false;
                console.error('Max entries eclipsed, disabling buffering');
            }

            // continue
            PaperTrailTransport.isErroring = false;
            PaperTrailTransport.__connectStream();

        }, PaperTrailTransport.connectionDelay);
    },

    __onConnected: function() {

        // Reset our variables
        PaperTrailTransport.loggingEnabled = true;
        PaperTrailTransport.currentRetries = 0;
        PaperTrailTransport.totalRetries = 0;
        PaperTrailTransport.connectionDelay = 1000;

        console.log('Connected to Papertrail at ' + PaperTrailTransport.host + ':' + PaperTrailTransport.port);

        // Did we get messages buffered
        if (PaperTrailTransport.buffer.length > 0) {
            PaperTrailTransport.stream.write(PaperTrailTransport.buffer);
            PaperTrailTransport.buffer = '';
        }
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

        txt = "[" + os.hostname() + "] " + timeStr + col + tagStr + "[" + rusage + level + "]" + reset + " " + msg + trace_str;

        return txt;
    }

};

module.exports = PaperTrailTransport;
