#!/usr/bin/env node

var path = require('path');
var mkdir = require('mkdirp');
var level = require('level');
var args = require("nomnom")
    .option('port', {
        abbr: 'p',
        default: 0,
        help: 'The server\'s port number'
    })
    .option('directory', {
        abbr: 'd',
        default: '~/.web-bnc',
        help: 'Path to web-bnc home directory'
    })
    .option('server', {
        position: 0,
        required: true,
        help: 'The IRC server to connect to'
    })
    .option('nick', {
        position: 1,
        required: true,
        help: 'The nick to use when connecting to the IRC server'
    })
    .option('version', {
        flag: true,
        help: 'Print version and exit',
        callback: function() {
            return require('../package.json').version;
        }
    })
    .parse();

var home = require('home-dir').directory;
var dir = args.directory.replace(/^~\//, home + '/');
dir = path.resolve(process.cwd(), dir);
mkdir.sync(dir);
console.log('Using directory: %s', dir);

var users = level(dir + '/users', {
    valueEncoding: 'json'
});
var messages = level(dir + '/messages');

var Client = require('irc').Client;
var client = new Client(args.server, args.nick);

var server = require('../')(client, users, messages, args.port);

server.start(function () {
    console.log('Service running on http://%s:%s', server.info.host, server.info.port);
});
