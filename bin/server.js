#!/usr/bin/env node

var args = require("nomnom")
    .option('port', {
        abbr: 'p',
        default: 0,
        help: 'The server\'s port number'
    })
    .option('version', {
        flag: true,
        help: 'Print version and exit',
        callback: function() {
            return require('../package.json').version;
        }
    })
    .parse();

var userDBPath = process.argv[3];
var messagesDBPath = process.argv[4];

var level = require('level');
var users = level(userDBPath, {
    valueEncoding: 'json'
});
var messages = level(messagesDBPath);
var Client = require('irc').Client;
var client = new Client('open.ircnet.net', 'christianBNC');

var server = require('../')(client, users, messages, args.port);

server.start(function () {
    console.log('Service running on http://%s:%s', server.info.host, server.info.port);
});
