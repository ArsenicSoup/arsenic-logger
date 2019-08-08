"use strict";

const winston = require('winston')
const chalk = require('chalk')
const stack = require('callsite')
const path = require('path')
const util = require('util');
const os = require("os");
const format = require('winston').format;
const moment = require('moment')

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
const Logger = {

    colors : {
        log : chalk.white,
        trace : chalk.gray,
        debug : chalk.green,
        input : chalk.blue,
        info : chalk.blue,
        warn : chalk.yellow,
        error : chalk.red,
        fatal : chalk.bold.red,
        exception : chalk.bold.white.bgRed,
        time : chalk.gray
    },  

    settings: {
        maxDepth: 3,
        handleExceptions: false,
        apiKey: null,
        echoMemory: false,
        echoCPU: false,
        locale: 'en',
        level: 'debug',
        globalLevel: 'debug',
        timestampPattern : 'ddd MMM DD h:mm:ss YYYY', // Mon Oct 20 12:00:22 2014'
        timestamps : true,
        colorize: true
    },

    _logger: null,

    /**
    * Set the maximum stack depth to show
    */
    setMaxStackDepth(depth){
        maxDepth = depth;
    },

    /**
    * Set the time stamp format, @see http://momentjs.com/docs/
    * @param {string} pattern data format pattern, default is 'ddd MMM h:mm:ss YYYY'
    */
    setTimestampFormat(pattern){
        if (!pattern) pattern = 'ddd MMM DD h:mm:ss YYYY';
        Logger.settings.timestampPattern = pattern;
        Logger.settings.timestamps = true;
    },

    /**
    * Set the time stamp locale, @see http://momentjs.com/docs/
    * @param {string} locale locale string, default is 'en'
    */
    setLocale(locale){
        if (!locale) locale = 'en';
        moment.locale(locale);
        Logger.settings.timestamps = true;
    },

    echoTimestamps(toggle){
        Logger.settings.timestamps = !!toggle;
    },

	setLevel(lvl) {
		Logger._logger.level = lvl
    },
        
    /**
    * Instruct the Logger to catch any uncaught exceptions.
    */
    catchExceptions(){
        process.on('uncaughtException', function (err) {
            Logger.fatal(err);
            //var stack = new Error().stack;
            //Logger.exception(stack);
        });
    },

    echoCPUUsage(toggle){
        if (!toggle) toggle = true;
        Logger.settings.echoCPU = toggle;
    },

    echoMemoryUsage(toggle){
        if (!toggle) toggle = true;
        Logger.settings.echoMemory = toggle;
    },
            
    __init(){
        
        const myFormat = format.printf(info => {
            return Logger.colors.time('['+info.timestamp+']') + ` ${info.level}: ${info.message}`;
        });

        const myCloudFormat = format.printf(info => {
            return `[${info.timestamp}] ${info.level}: ${info.message}`;
        });

        let transports = [
            new winston.transports.Console({
                // See https://github.com/winstonjs/logform
                format: format.combine(                                
                    format.timestamp({
                        //format: 'ddd MMM DD h:mm:ss YYYY'
                        format: 'ddd MMM DD h:mm:ss'
                    }),
                    format.colorize(),
                    myFormat
                )                
            })           
        ]

        Logger._logger = winston.createLogger({
  			transports: transports
        });
          
    },
    
    __getStackTrace(stackObj){

        let trace_str = ''
        let depth = 1
        let startDepth = 9999
        const maxDepth = 6

        if (stackObj){

            stackObj.forEach(function(site){

                if (site){

                    let no = site.getLineNumber()
                    let fname = site.getFileName()
                    fname = (fname) ? path.basename(fname) : fname
                    let funcname = site.getFunctionName() || 'anonymous'

                    if (funcname){
                        funcname = ' ('+funcname + ')' || '';
                    }
                    else {
                        funcname = '';
                    }

                    if (fname == 'Logger.js') {
                        startDepth = depth+1
                    }

                    if (depth == startDepth){
                        trace_str += " {from line " + no + " of " + fname + funcname;
                    }
                    else if (no && depth > startDepth && depth <= startDepth + maxDepth){
                        //trace_str += ", called from line " + no + " of " + fname + funcname;
                        trace_str += ", line " + no + " of " + fname + funcname;
                    }


                }

                depth+=1;

            });
            trace_str += '}';
        }

        if (Logger.settings.colorize){
            return Logger.colors.trace(trace_str)
        }

        return trace_str

    },

    __serialize(args){      

        let msg = ''

   
        var rusage = "";

        if (Logger.settings.echoMemory){
            var mem = process.memoryUsage();
            //var total = Math.ceil(os.totalmem()/1048576) ;
            var memUsed = mem.heapUsed/1048576;
            rusage += memUsed.toFixed(2) + "MB ";
        }

        if (Logger.settings.echoCPU){
            var load = os.loadavg();
            rusage += load[2].toFixed(2) + "%";
        }

        if (rusage != ""){
            //msg += Logger.colors[Logger._logger.level](`(${rusage}) `);
            msg += chalk.blue.dim(`(${rusage}) `);
        }

        for (let i=0; i<args.length; i++) {

            if (typeof args[i] == 'object'){
                msg += "\n" + util.inspect(args[i], {colors:Logger.settings.colorize, compact:false, breakLength: 60, depth: null});
            }
            else {
                msg += args[i];
            }

            msg += " ";
        }

        return msg
    },

	log() {        
        
        var str = Logger.__serialize(arguments)

        if (process.env.NODE_ENV != 'production'){
            str += Logger.__getStackTrace(stack())
        }

        Logger._logger.log.apply(Logger._logger, ['log', str]);    
	},

	debug() {        
        
        var str = Logger.__serialize(arguments)

        if (process.env.NODE_ENV != 'production'){
            str += Logger.__getStackTrace(stack())
        }

        Logger._logger.log.apply(Logger._logger, ["debug", str]);    
        
	},

	info() {          
        
        var str = Logger.__serialize(arguments)

        if (process.env.NODE_ENV != 'production'){
            str += Logger.__getStackTrace(stack())
        }

        Logger._logger.log.apply(Logger._logger, ["info", str]);    
  	},

	warn() {

        var str = Logger.__serialize(arguments)

        if (process.env.NODE_ENV != 'production'){
            str += Logger.__getStackTrace(stack())
        }

        Logger._logger.log.apply(Logger._logger, ["warn", str]);    
	},

	error() {
        let str = Logger.__serialize(arguments) + Logger.__getStackTrace(stack())
        Logger._logger.log.apply(Logger._logger, ["error", str]);    
	},

	fatal() {
        let str = Logger.__serialize(arguments) + Logger.__getStackTrace(stack())
        Logger._logger.log.apply(Logger._logger, ["error", str]);    
	}     
}

Logger.__init()
Logger.setLevel('debug')

module.exports = Logger
