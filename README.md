# node-logger

## Summary

Simple, easy to read log statements with stack trace in Node.js. There are a few other great loggers out there for Node.js, the inspiration to create our own was mainly driven by the need for both a stack trace and a colorized and easy to read output.

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

Logger = require('arsenic-logger');

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

## Tagging & Advanced Options

You can add a custom tag and other advanced options by using the 'advanced' version of the logging commands;

```js
    Logger.debugX('opts', 'args');
    Logger.warnX(('opts', 'args');
    Logger.infoX(('opts', 'args');
    Logger.errorX(('opts', 'args');
    Logger.fatalX(('opts', 'args');
```
 
Where `opts` includes custom options, which for now only includes tags. The other `args` are the same as the basic version of the Logging commands. 

`opts` supports usage as an object, e.g. {tag:'TestTag'} or as a string (where the value of the string is assumed to be a tag). The object form is reserved for advanced future usage.

Here is an example;

```js
var someObject = new Object();
someObject.name = 'fred';
someObject.data = [5,6,7,8,9];
someObject.date = new Date();

Logger.debugX("TestTag", "This is an object, but using a custom tag... ", someObject);
```

You can now filter output based on log level and also these advanced values using `setFilter`, for example;

```js
Logger.setLevel('debug');
Logger.setFilter({tag:"TestTag"});

var someObject = new Object();
someObject.name = 'fred';
someObject.data = [5,6,7,8,9];
someObject.date = new Date();

var anotherObject = new Object();
anotherObject.name = 'bob';
anotherObject.data = [2,7,8];

Logger.debug("This is an object... ", someObject, anotherObject);

Logger.debugX("TestTag", "This is an object, but using a custom tag... ", someObject);
```

Here, because the level was set to `debug` and a the filter was set to the tag "TestTag" the only output from this would be from the 2nd debug statement. 

This can be particulalry useful for large projects where you want to only see the logs from a specific section of code at a time.

## Remote Logging

### Loggly

The Logger now supports [Loggly](https://www.loggly.com/). It makes use of [node-loggly](https://github.com/nodejitsu/node-loggly) under-the-hood. To use this, call;

```js
Logger.useLoggly('token', 'subdomain','username','password');
```

Then all calls will be sent to your loggly account!

### ArsenicLogger

The Logger supports the cloud logging service offered by ArsenicSoup. To use this service first create an account at ArsenicLogger (http://logger.arsenicsoup.com).

Once you have an account, you will be given a API key. With this, you can now setup this Logger class to send log reports from your server to the ArsenicLogger service. 

Then simply setup the Logger like so;

```js
Logger.useArsenicLogger('YOUR-API-KEY');
```

You can also specify a custom tag to assign to all subsequent logging calls to help with searching and categorizing on 
the ArsenicLogger service, e.g.;

```js
Logger.useArsenicLogger('YOUR-API-KEY', 'MY-TAG');
```

## Memory/CPU Usage

The Logger can echo current memory and cpu usage information to the command line using the following commands, which can be combined. **Note:** the arsenic logger service automatically is sent this information.

### Memory Usage

```js
Logger.echoMemoryUsage()
```

This will add the amount of memory used by the heap *at the time an entry was logged*. For example, the follow result shows the process was consuming 3.16GB of heap space when the `Logger.error("errortest")` method was called.

```sh
[3.16GB  error] errortest  {from line 14 of test.js....}
```

### CPU Usage

```js
Logger.echoCPUUsage()
```

In a similar fashion, the current 15 minute average CPU usage is sent to the console, for example;

```sh
[1.43%  error] errortest  {from line 14 of test.js,......}
```

## Requirements

Requires the excellent callsite module (https://github.com/visionmedia/callsite)

npm install callsite

And also the Path module (http://nodejs.org/api/path.html)

npm install path

## Advanced

For a more full featured logger, check out [tracer](https://github.com/baryon/tracer).

## Donate

If you like this, and use it, please consider donating to help support future development.

<a class="coinbase-button" data-code="1f955f58582ddd191e84a8bb8fcd7a77" data-button-style="donation_small" href="https://coinbase.com/checkouts/1f955f58582ddd191e84a8bb8fcd7a77">Donate Bitcoins</a><script src="https://coinbase.com/assets/button.js" type="text/javascript"></script>

## Suggestions

Feel free to contact me at mike@arsenicsoup.com if you want to help or have suggestions.

Thanks!

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