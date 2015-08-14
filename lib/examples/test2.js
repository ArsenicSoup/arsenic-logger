/**
* Example usage of the Logger clas
*/

var ArsenicLogger = require('../ArsenicLogger.js');

var Logger = new ArsenicLogger({
	logTag:'TEST-TAG',
	level: 'debug'
});

//Logger.setFilter({tag:"TestTag"});
//Logger.setFilter({tags:["LABEL1","LABEL2"]});
//Logger.setFilter({functions:"somefunc", files: ["test.js"]})

Logger.debug("test2 debug test");
Logger.info("test2 info test");
Logger.warn("test2 info test");
Logger.error("test2 errortest");