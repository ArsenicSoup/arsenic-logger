# node-logger

## Summary

Simple, easy to read log statements with stack trace in Node.js. There are a few other great loggers out there for Node.js, the inspiration to create our own
was mainly driven by the need for both a stack trace and a colorized and easy to read output.

## Coming Soon

Output to a remote logging service hosted by arsenic soup

## Installation

```
npm install arsenic-logger
```

```js
Logger = require('arsenic-logger');
```
## Screen Shot

![](https://github.com/ArsenicSoup/arsenic-logger/raw/master/logger_screenshot.png)


## Usage

There are 5 levels of logging

```js 
log, debug, info, warn, error, fatal
```

Here is an example of how to use the logger.

```js

Logger = require('./Logger.js');

Logger.setLevel('debug');

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

```

## Requirements

REquires the excellent callsite module (https://github.com/visionmedia/callsite)

npm install callsite

And also the Path module (http://nodejs.org/api/path.html)

npm install path

## Advanced

For a more full featured logger, check out [tracer](https://github.com/baryon/tracer).

## License 

(The MIT License)

Copyright (C) 2012 by Ad Astra Systems, LLC;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.