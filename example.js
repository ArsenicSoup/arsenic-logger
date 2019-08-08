/**
* Example usage of the Logger clas
*/
var Logger = require('./index.js');

//Logger.setTransport({name:'console'});

Logger.echoMemoryUsage();
Logger.echoCPUUsage();
Logger.echoTimestamps();
Logger.echoTimestamps(true);
Logger.setTimestampFormat('ddd, hA');
Logger.setLocale('fr');

Logger.debug("debug test");
Logger.info("info test");
Logger.warn("info test");
Logger.error("errortest");

var someObject = new Object();
someObject.name = 'fred';
someObject.data = [5,6,7,8,9];
someObject.date = new Date();

var anotherObject = new Object();
anotherObject.name = 'bob';
anotherObject.data = [2,7,8];

Logger.debug("This is an object... ", someObject, anotherObject);

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

//Logger.debug(variableThatDoesntExist);