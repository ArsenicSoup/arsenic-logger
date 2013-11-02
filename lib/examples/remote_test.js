/**
 * Example usage of the Logger clas
 */
Logger = require('../Logger.js');

var apiKey = '5a4e08fc-9930-4f5d-fd2b-b4416b73edda';
Logger.setLevel('debug');
Logger.useArsenicLogger(apiKey);

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
    