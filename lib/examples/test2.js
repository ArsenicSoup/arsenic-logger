/**
* Example usage of the Logger clas
*/

var Logger = require('../Logger.js');
/*
var Logger = new ArsenicLogger({
	logTag:'TEST-TAG',
	level: 'debug'
});
*/


Logger.setTransport({name:'papertrail', host:'logs2.papertrailapp.com', port:'17431'});

//Logger.setFilter({tag:"TestTag"});
//Logger.setFilter({tags:["LABEL1","LABEL2"]});
//Logger.setFilter({functions:"somefunc", files: ["test.js"]})

Logger.debug("test2 debug test");
Logger.info("test2 info test");
Logger.warn("test2 info test");
Logger.error("test2 errortest");
