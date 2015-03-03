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
var os = require("os");
var needle = require('needle');
var _ = require('lodash');
var moment = require('moment');


var ArsenicLogger = (function(){

    // private static fields

	/** Filter output options */
	var filterOptions = null;

	var globalLogLevel = null;


	/*
		Black       0;30     Dark Gray     1;30
		Blue        0;34     Light Blue    1;34
		Green       0;32     Light Green   1;32
		Cyan        0;36     Light Cyan    1;36
		Red         0;31     Light Red     1;31
		Purple      0;35     Light Purple  1;35
		Brown       0;33     Yellow        1;33
		Light Gray  0;37     White         1;37

		\[\033[1;30m\]

		http://misc.flogisoft.com/bash/tip_colors_and_formatting
	*/	
	var colors = {
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
	};

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

		//console.log('opts = ', opts);
		//console.log('defaults = ', defaults);
		//console.log('settings = ', settings);

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
			if (!toggle) toggle = true;
			settings.timestamps = toggle;				
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
			})					
		};
		
		this.echoCPUUsage = function(toggle){
			if (!toggle) toggle = true;
			settings.echoCPU = toggle
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
		this.useArsenicLogger = function(apiKey, tag){

	        var pid = process.pid // you can use any valid PID instead

			//usage.clearHistory(process.pid);
			settings.apiKey = apiKey;
	        settings.logRemote = true;
	        settings.logTag = tag;
	        
		};
		
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

	        var stackObj = stack();

			// Route the message based on the mode

	        if (settings.logRemote){
	            doRemoteMessage(args, level, stackObj, hasTag);
	        }

	        if (settings.logConsole){
	            doConsoleMessage(args, level, stackObj, hasTag);
	        }

		};

	    function doRemoteMessage(args, level, stackObj, hasTag){
			
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

	    };

	    // //////////////////////////////////////////////////////////////////////////////////////////////

	    function doConsoleMessage(args, level, stackObj, hasTag){

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
			var reset = colors.reset;
			
			switch(level){
				case 'log': col = colors.green; log_level = 0; break;
				case 'debug': col = colors.green; log_level = 1; break;
				case 'info': col = colors.blue; log_level = 2; break;
				case 'warn': col = colors.magenta; log_level = 3; break;
				case 'error': col = colors.lightRed; log_level = 4; break;
				case 'fatal': col = colors.red; log_level = 5; break;
				case 'exception': col = colors.whiteOnRed; log_level = 5; break;
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
			
			var trace_str = colors.gray;			
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
				//tagStr = colors.tag + " " + tag + " " + reset + " ";
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

		    console.log(txt);

			//if (level == 'fatal') process.exit(0);
			
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
