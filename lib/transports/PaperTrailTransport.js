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

        var msg = "[" + os.hostname() + "] " + tConsoleTransport.__getText(args, level, stackObj, hasTag, settings, filterOptions) + "\n\r";

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
    }

};

module.exports = PaperTrailTransport;
