/**
*
* *******************************************************************
*
* Copyright (C) 2011 by Ad Astra Systems, LLC
*
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*
* *******************************************************************
*
* Simple Logger class for Node.js (V8 and above)
*
* Usage:
*
* var ArsenicLogger = require('./Logger.js');
* var Logger = new ArsenicLogger();
*
* Logger.setLevel('debug');
* Logger.set
*
* Logger.debug("debug test");
* Logger.info("info test");
* Logger.warn("info test");
* Logger.error("errortest");
*
*
* function somefunc(){
* 	Logger.debug("testing inside a function");
* }
*
* var someclass = {
* 	test:function(){
* 		Logger.debug("Testing inside a class");
* 	}
* }
*
* somefunc();
* someclass.test();
*
* // A fatal call, that will call process.exit
* Logger.fatal("fatal test");
*
* Requires:
*
* callsite (https://github.com/visionmedia/callsite)
* npm install callsite
*
* path
* npm install path
*
* @author Mike Pritchard (mike@arsenicsoup.com)
*/

var stack = require('callsite');
var path = require('path');
var util = require('util');
var httpHelper = require('./HttpHelper.js');
var ConsoleTransport = require('./transports/ConsoleTransport.js');
var PaperTrailTransport = require('./transports/PaperTrailTransport.js');
var FileTransport = require('./transports/FileTransport.js');
var os = require("os");
var needle = require('needle');
var _ = require('lodash');
var moment = require('moment');


var ArsenicLogger = (function(){

    // private static fields

	/** Filter output options */
	var filterOptions = null;

	var globalLogLevel = null;

    // class function a.k.a. constructor
    function cls(opts)
    {
	    // //////////////////////////////////////////////////////////////////////////////////////////////
    	//
        // private instance fields
        //
	    // //////////////////////////////////////////////////////////////////////////////////////////////

        var self = this;

		var defaults = {
			maxDepth: 3,
			handleExceptions: false,
			apiKey: null,
			/** Log to console */
			logConsole: true,
			/** Log to ArsenicSoup logging service */
			logRemote: false,
			/** Log to ArsenicSoup logging service */
			logPaperTrail: false,
			/** Log to a file */
			logFile: false,
			/** You can specifiy a tag for all following log entries */
			logTag: '',
			echoMemory: false,
			echoCPU: false,
			locale: 'en',
			level: 'debug',
			globalLevel: 'debug',
		    timestampPattern : 'ddd MMM DD h:mm:ss YYYY', // Mon Oct 20 12:00:22 2014'
		    timestamps : true,
		};

		var logLevel = 0;

		if (!opts){
			opts = [];
		}

		var settings = _.defaults(opts, defaults);

		ConsoleTransport.setup();

	    // //////////////////////////////////////////////////////////////////////////////////////////////
		//
		// Public instance fields
		//
	    // //////////////////////////////////////////////////////////////////////////////////////////////

		this.age = 10;

	    // //////////////////////////////////////////////////////////////////////////////////////////////
	    //
	    // Public methods
	    //
	    // //////////////////////////////////////////////////////////////////////////////////////////////


		/**
		* Set the maximum stack depth to show
		*/
		this.setMaxStackDepth = function(depth){
			maxDepth = depth;
		};

	    /**
	    * Set the time stamp format, @see http://momentjs.com/docs/
	    * @param {string} pattern data format pattern, default is 'ddd MMM h:mm:ss YYYY'
	    */
		this.setTimestampFormat = function(pattern){
			if (!pattern) pattern = 'ddd MMM DD h:mm:ss YYYY';
			settings.timestampPattern = pattern;
			settings.timestamps = true;
		};

	    /**
	    * Set the time stamp locale, @see http://momentjs.com/docs/
	    * @param {string} locale locale string, default is 'en'
	    */
		this.setLocale = function(locale){
			if (!locale) locale = 'en';
			moment.locale(locale);
			settings.timestamps = true;
		};

		this.echoTimestamps = function(toggle){
			settings.timestamps = !!toggle;
		};

		this.setLabel = function(label){
			settings.logTag = label;
		};

		/**
		* Instruct the Logger to catch any uncaught exceptions.
		*/
		this.catchExceptions = function(){
			process.on('uncaughtException', function (err) {
				self.exception(err);
				//var stack = new Error().stack;
				//Logger.exception(stack);
			});
		};

		this.echoCPUUsage = function(toggle){
			if (!toggle) toggle = true;
			settings.echoCPU = toggle;
		};

		this.echoMemoryUsage = function(toggle){
			if (!toggle) toggle = true;
			settings.echoMemory = toggle;
		};

	    // //////////////////////////////////////////////////////////////////////////////////////////////

		this.setFilter = function(opts){

			filterOptions = opts;

			// Backwards compatible (convert tag to tags)
			if ('tag' in filterOptions){
				filterOptions.tags = [filterOptions.tag];
			}

			if ('tags' in filterOptions && typeof filterOptions.tags == 'string'){
				filterOptions.tags = [filterOptions.tags];
			}

			if ('functions' in filterOptions && typeof filterOptions.functions == 'string'){
				filterOptions.functions = [filterOptions.functions];
			}
		};

	    // //////////////////////////////////////////////////////////////////////////////////////////////

		/**
		* Setup the Logger to use the ArsenicLogger remote logging service
		* @param {string} apiKey The API key from the ArsenicLogger service
		*/
		/*
		this.useArsenicLogger = function(apiKey, tag){

	        var pid = process.pid // you can use any valid PID instead

			//usage.clearHistory(process.pid);
			settings.apiKey = apiKey;
	        settings.logRemote = true;
	        settings.logTag = tag;

		};
		*/

		this.setTransport = function(transports){

			if (!_.isArray(transports)){
				transports = [transports];
			}

			// Clear existing options
			//settings.logConsole = false;
			//settings.logPaperTrail = false;

			for (var i=0; i<transports.length; i++){

				var transport = transports[i];

				if (transport.name === 'console'){
					settings.logConsole = true;
					if (transport.theme){
						ConsoleTransport.setup(transport.theme);
					}
				}

				if (transport.name === 'papertrail'){
					settings.logPaperTrail = true;
					PaperTrailTransport.setup(transport.host, transport.port);
				}

				if (transport.name === 'file'){
					settings.logFile = true;
					FileTransport.setup(transport.filename);
				}
			}
		},

	    // //////////////////////////////////////////////////////////////////////////////////////////////

		/**
		* Set the logging level
		* @param {string} level - specifiy the desired minimum logging level, e.g. 'warn' will mean only
		* warning or above will be logged.
		*/
		this.setLevel = function(level){
			switch(level){
				case 'log': logLevel = 0; break;
				case 'debug': logLevel = 1; break;
				case 'info': logLevel = 2; break;
				case 'warn': logLevel = 3; break;
				case 'error': logLevel = 4; break;
				case 'fatal': logLevel = 5; break;
			}
		};

		this.setGlobalLevel = function(level){
			switch(level){
				case 'log': globalLogLevel = 0; break;
				case 'debug': globalLogLevel = 1; break;
				case 'info': globalLogLevel = 2; break;
				case 'warn': globalLogLevel = 3; break;
				case 'error': globalLogLevel = 4; break;
				case 'fatal': globalLogLevel = 5; break;
			}
		};


	    this.getLevel = function(levelString){

	        var log_level = 'unknown';

	        switch(levelString){
	            case 'log': log_level = 0; break;
	            case 'debug': log_level = 1; break;
	            case 'info': log_level = 2; break;
	            case 'warn': log_level = 3; break;
	            case 'error': log_level = 4; break;
	            case 'fatal': log_level = 5; break;
	            case 'exception':log_level = 5; break;
	        }

	        return log_level;
	    };

	    // //////////////////////////////////////////////////////////////////////////////////////////////

		this.debug = function() { message(arguments, 'debug', false); };
		this.warn = function() { message(arguments, 'warn', false); };
		this.info = function() { message(arguments, 'info', false); };
		this.error = function() { message(arguments, 'error', false); };
		this.fatal = function() { message(arguments, 'fatal', false); };
		this.exception = function() { message(arguments, 'exception', false); };

		this.debugX = function() { message(arguments, 'debug', true); };
		this.warnX = function() { message(arguments, 'warn', true); };
		this.infoX = function() { message(arguments, 'info', true); };
		this.errorX = function() { message(arguments, 'error', true); };
		this.fatalX = function() { message(arguments, 'fatal', true); };
		this.exceptionX = function() { message(arguments, 'exception', true); };

	    // //////////////////////////////////////////////////////////////////////////////////////////////
	    //
	    // Private methods
	    //
	    // //////////////////////////////////////////////////////////////////////////////////////////////

	    function init(){
			// Process settings
			self.setLocale(settings.locale);
			self.setTimestampFormat(settings.timestampPattern);

			if (settings.handleExceptions){
				self.catchExceptions(settings.timestampPattern);
			}
	    }

		function message(args, level, hasTag){

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

	        var stackObj = stack();

			// Route the message based on the mode

	        if (settings.logPaperTrail){
				PaperTrailTransport.message(args, level, stackObj, hasTag, self);
	        }

	        if (settings.logConsole){
	            ConsoleTransport.message(args, level, stackObj, hasTag, settings, filterOptions);
	        }

			if (settings.logFile){
				FileTransport.message(args, level, stackObj, hasTag, settings, filterOptions);
			}

		};

	    // //////////////////////////////////////////////////////////////////////////////////////////////

		init();
    }

    return cls;
})();

//module.exports = ArsenicLogger;

//module.exports = ArsenicLogger;

if(require.main === module) {
	var Logger = new ArsenicLogger();
	Logger.debug('test');
}
else {
	module.exports = ArsenicLogger;
}