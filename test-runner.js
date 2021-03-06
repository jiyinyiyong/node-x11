var x11 = require('./lib/x11');
var Mocha = require('mocha');
var fs = require('fs');
var path = require('path');
var util = require('util');
var async = require('async');

var mocha = new Mocha({
    timeout : 80000
});

// To be able to perform the tests we need the server:
// 1 - to support the dpms extension.
// 2 - dpms version is 1.1.
// 3 - to be dpms capable.
var run_dpms_test = function(cb) {
    var client = x11.createClient(function(dpy) {
        var display = dpy;
        var X = display.client;
        X.require('dpms', function(ext) {
            if (!util.isError(ext)) {
                dpms = ext;
                dpms.GetVersion(undefined, undefined, function(err, version) {
                    if (!err && version[0] === 1 && version[1] === 1) {
                        dpms.Capable(function(err, capable) {
                            if (!err && capable[0] == 1) cb(true);
                            else cb(false);
                        });
                    } else {
                        cb(false);
                    }
                });
            } else {
                cb(false);
            }
        });
    });

    client.on('error', function() {
        cb(false);
    });
};

var run_xtest_test = function(cb) {
    var client = x11.createClient(function(dpy) {
        var display = dpy;
        var X = display.client;
        X.require('dpms', function(ext) {
            if (!util.isError(ext)) cb(true);
            else cb(false);
        });
    });

    client.on('error', function() {
        cb(false);
    });
};

// Add all files from test root directory
async.forEach(
    fs.readdirSync('./test'),
    function(file, cb) {
        if (file === 'dpms.js') {
            run_dpms_test(function(run) {
                if (run) {
                    mocha.addFile(path.join('./test', file));
                }

                cb();
            });
        } else if (file === 'xtest.js') {
            run_xtest_test(function(run) {
                if (run) {
                    mocha.addFile(path.join('./test', file));
                }

                cb();
            });
        } else {
            mocha.addFile(path.join('./test', file));
            cb();
        }
    },
    function(err) {
        mocha.run(function() {
            process.exit();
        });
    }
);
