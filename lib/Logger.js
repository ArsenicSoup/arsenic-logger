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
* Logger = require('./Logger.js');
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

var Logger = {
	
	maxDepth : 3,
	handleExceptions : false,

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

*/	

	colors : {
		  red:      '\033[0;31m',
		  lightRed: '\033[1;31m',
		  whiteOnRed:'\033[7;31m',
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

	/** the current logging level */
	logLevel : 0,

	/**
	* Set the maximum stack depth to show
	*/
	setMaxStackDepth : function(depth){
		maxDepth = depth;	
	},
	
	/**
	* Instruct the Logger to catch any uncaught exceptions.
	*/
	catchExceptions : function(){	
		process.on('uncaughtException', function (err) {
			Logger.exception(err);
			var stack = new Error().stack
			Logger.error( stack );			
		})					
	},
	
	/**
	* Set the logging level
	* @param {string} level - specifiy the desired minimum logging level, e.g. 'warn' will mean only
	* warning or above will be logged.
	*/	
	setLevel : function(level){
		switch(level){
			case 'log': Logger.logLevel = 0; break;
			case 'debug': Logger.logLevel = 1; break;
			case 'info': Logger.logLevel = 2; break;
			case 'warn': Logger.logLevel = 3; break;
			case 'error': Logger.logLevel = 4; break;
			case 'fatal': Logger.logLevel = 5; break;
		}
	},
		
	debug : function() { Logger.message(arguments, 'debug'); },
	warn : function() { Logger.message(arguments, 'warn'); },
	info : function() { Logger.message(arguments, 'info'); },
	error : function() { Logger.message(arguments, 'error'); },
	fatal : function() { Logger.message(arguments, 'fatal'); },
	exception : function() { Logger.message(arguments, 'exception'); },
			
	message : function(args, level){

		var msg = "";

		for (var i=0; i<args.length; i++) {
					
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
		var reset = Logger.colors.reset;
		
		switch(level){
			case 'log': col = Logger.colors.green; log_level = 0; break;
			case 'debug': col = Logger.colors.green; log_level = 1; break;
			case 'info': col = Logger.colors.blue; log_level = 2; break;
			case 'warn': col = Logger.colors.magenta; log_level = 3; break;
			case 'error': col = Logger.colors.lightRed; log_level = 4; break;
			case 'fatal': col = Logger.colors.red; log_level = 5; break;
			case 'exception': col = Logger.colors.whiteOnRed; log_level = 5; break;
		}
		
		if (log_level < Logger.logLevel){
			return;
		}
		
		var trace_str = Logger.colors.gray;			
		var depth = 1;
		var startDepth = 3;
		if (level == 'exception') startDepth = 4;

		stack().forEach(function(site){
			
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
			else if (depth > startDepth && depth <= startDepth + Logger.maxDepth){
				trace_str += ", called from line " + no + " of " + fname + funcname;					
			}
			depth++;
		});
	
		trace_str += '}' + reset;
		
		
		txt = col + "[" + level + "]" + reset + " " + Logger.colors.white + msg + reset + trace_str;

		console.log(txt);	
		
		if (level == 'fatal') process.exit(0);
		
	}
}

module.exports = Logger;