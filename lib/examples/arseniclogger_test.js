/**
 * Example usage of the Logger clas
 */
Logger = require('../Logger.js');

//var apiKey = 'a6a6349d-ff32-4367-bc59-529678f8b2e3';
var apiKey = '34213608-4af8-48fa-cf13-585a2adf09fa';

Logger.setLevel('error');
Logger.useArsenicLogger(apiKey, 'LoggerTest');
Logger.logConsole = false;

Logger.debug("debug test");

Logger.info("info test");
Logger.warn("info test");


Logger.error("errortest");


var someObject = new Object();
someObject.name = 'testing';
someObject.data = [5,6,7,8,9];
someObject.date = new Date();

Logger.debug("This is an object... ", someObject);

function somefunc(){
    Logger.debug("testing inside a function");
}

var someclass = {
    test:function(){
        Logger.debug("Testing inside a class");
    }
}

somefunc();
someclass.test();

Logger.info(someObject);

// A fatal call, that will call process.exit
Logger.fatal("fatal test");

// Feed uncaught exceptions to the Logger
Logger.catchExceptions();

function badFunc(){
    throw "This is an exception!";
}

badFunc();

Logger.debug(variableThatDoesntExist);

    