/**
* Example usage of the Logger clas
*/
Logger = require('../Logger.js');

Logger.setLevel('debug');
//Logger.setFilter({tag:"TestTag"});
//Logger.setFilter({tags:["This","That"]});
Logger.setFilter({functions:"somefunc", files: ["test.js"]})

Logger.echoMemoryUsage();
Logger.echoCPUUsage();
Logger.echoTimestamps();
//Logger.setTimestampFormat('ddd, hA');
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

Logger.debugX("That", "This is an object, but using a custom tag... ", someObject);
Logger.debugX(["This","That"], "This is an object, but using a custom compund tag... ", someObject);

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
