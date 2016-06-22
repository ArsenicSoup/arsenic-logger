# ArsenicLogger: Simple & Powerful logger with stack trace

## Summary

Simple, easy to read log statements with stack trace in Node.js. There are a few other great loggers out there for Node.js, the inspiration to create our own was mainly driven by the need for both a stack trace and a colorized and easy to read output.

## Installation

```
npm install arsenic-logger
```

## Basic Usage

```js

// Get a default logger instance
var Logger = require('arsenic-logger');

// Start using
Logger.debug("Hello world!");

```

## Advanced Usage

```js
// Get a default logger instance
var Logger = require('arsenic-logger');

// Set some more advanced options
Logger.echoCPUUsage();
Logger.echoMemoryUsage();
Logger.setTimestampFormat('ddd, hA');
Logger.setLocale('fr');

// Beam your logs to papertrail (https://papertrailapp.com)
Logger.setTransport({name:'papertrail', host:'logs.papertrailapp.com', port'1234'});

// Filter log out to a function in a specific Filter
Logger.setFilter({functions:"somefunc", files:"test.js"})
```

## Screen Shot

![](https://github.com/ArsenicSoup/arsenic-logger/raw/master/logger_screenshot.png)

## Options

The following options can be passed in when creating a Logger instance.

| Field | Default | Description |
| ----- | ------- | ----------- |
| maxDepth | 3 | The maximum depth of stack trace to display |
| handleExceptions | false | Catch and log exceptions |
| logTag | '' | A tag/label to use for this logger instance. Handy when combined with filtering or using [ArsenicLogger](http://logger.arsenicsoup.com) |
| echoMemory | false | Echo the current memory usage to the console (if console logging) |
| echoCPU | false | Echo the CPU usage to the console (if console logging) |
| locale | 'en' | Set the locale, used for formatting the timestamp |
| timestampPattern | 'ddd MMM DD h:mm:ss YYYY' | The timestamp pattern, see [Moment.js](http://momentjs.com/docs/#/displaying/) for options |
| timestamps | true | Echo timestamps to the console, if console logging |


All of these options can also be set through through the following methods;

### setTransport

By default the logger logs to the console, however you can specify the transport(s) you wish to use.

#### Console

The default choice, but you can enable using;

```js
Logger.setTransport({name:'console'});
```

#### File

Write to a file using the file transport. This guarantees atomic writes and protects against
race conditions.

```js
Logger.setTransport({name:'file', filename:'/path/to/your/file.log'});
```


#### PaperTrail

To enable PaperTrail, you need to specify the host and port number given to you by papertrail.

```js
Logger.setTransport({name:'papertrail', host:'logs.papertrailapp.com', port'1234'});
```

#### Multiple transports

You can use more than one transports by simply passing an array of transport options, for example to use the console **and** papertrail you can do the following;

```js
Logger.setTransport([
    {name:'console'},
    {name:'papertrail', host:'logs.papertrailapp.com', port'1234'}
]);
```

### setLevel(level)

Set the log level for this Logger instance. Options are; `debug`, `info`, `warn`, `error`, `fatal`.

### setGlobalLevel(level)

Set the log level for *all* logger instances. This will over-ride the log level on all Logger instances.

### setLabel(label)

Set the tag/label for the current Logger instance. Very useful when combined with filtering. For example you could set a different tag per module of your code, and then set a filter to only view log outout from a specific module.

### setFilter(opts)

The method `setFilter` can be used to give fine control over what logs are sent to the console. This supports function names, filenames and tags.

```js
Logger.setFilter({functions:"somefunc"})
Logger.setFilter({files:"test.js"})
Logger.setFilter({tags:"my-tag"})
```

These can be combined, such as;

```js
// Echo ONLY logs that match the filename and tag
Logger.setFilter({files:"test.js", tags: "my-tag"})
```

Also, you can pass an array or a single string into any of these options. In that case, the effect will be an OR, e.g.

```js
// Echo logs that have the tag my-tag or my-other-tag
Logger.setFilter({tags: ["my-tag", "my-other-tag"]})
```

### echoTimestamps(toggle)

Turns time stamps on or off. Only applicable if logging to the console.

```js
// Turn timestamps on
Logger.echoTimestamps(true);

// Example output
// [Tue Oct 9:40:24 2014] testing inside a function  {from line 35 of test.js ...

// Turn time stamps off
Logger.echoTimestamps(false);
```

### setTimestampFormat(format)

You can set the timestamp format using the following command. Internally the Logger uses the [moment](http://momentjs.com/) library and so supports any format supported by moment, you can see the supported formats [here](http://momentjs.com/docs/#/displaying/format/).

As a convenience, this also turns timestamps on, so no need to call `echoTimestaps(true)`.

```js
// Set timestamp format
Logger.setTimestampFormat('ddd, hA');

// Example output
//[Tue, 9AM] [debug] testing inside a function  {from line 36 of test.js ...
```

### setLocale(local)

Set the time locale. The Logger supports any localed support by [moment](http://momentjs.com/), for example 'fr'.

```js
Logger.setLocale('fr');

// Example output
// [mar. oct. 10:01:24 2014] [debug] testing inside a function  {from line 37 of test.js ...
```

### echoCPUUsage(toggle)

The Logger can echo cpu usage information to the command line using the following commands, which can be combined. **Note:** the arsenic logger service automatically is sent this information.

```js
Logger.echoCPUUsage()
```

In a similar fashion, the current 15 minute average CPU usage is sent to the console, for example;

```sh
[1.43%  error] errortest  {from line 14 of test.js,......}
```

### echoMemoryUsage(toggle)

The Logger can echo current memory and cpu usage information to the command line using the following commands, which can be combined. **Note:** the arsenic logger service automatically is sent this information.

```js
Logger.echoMemoryUsage()
```

This will add the amount of memory used by the heap *at the time an entry was logged*. For example, the follow result shows the process was consuming 3.16GB of heap space when the `Logger.error("errortest")` method was called.

```sh
[3.16GB  error] errortest  {from line 14 of test.js....}
```

## Tagging

You can over-ride the label used for the logger instance using the following commands. These add a custom tag and other advanced options by using the 'advanced' version of the logging commands;

```js
    Logger.debugX('tags', 'args');
    Logger.warnX('tags', 'args');
    Logger.infoX('tags', 'args');
    Logger.errorX('tags', 'args');
    Logger.fatalX('tags', 'args');
```

Where `tags` includes custom tags. The other `args` are the same as the basic version of the Logging commands.

`tags` can be either a string, or an array of strings. e.g. ```'TestTag'``` or ```['This','Or','That']``` where it will match on any of the tags in the array.

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
Logger.setFilter({tags:"TestTag"});

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

## Requirements

Requires the excellent callsite module (https://github.com/visionmedia/callsite)

npm install callsite

And also the Path module (http://nodejs.org/api/path.html)

npm install path

## Advanced

For a more full featured logger, check out [winston](https://github.com/winstonjs/winston).

## Donate

If you like this, and use it, please consider donating to help support future development.

<a class="coinbase-button" data-code="1f955f58582ddd191e84a8bb8fcd7a77" data-button-style="donation_small" href="https://coinbase.com/checkouts/1f955f58582ddd191e84a8bb8fcd7a77">Donate Bitcoins</a><script src="https://coinbase.com/assets/button.js" type="text/javascript"></script>

## Example Usage

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
