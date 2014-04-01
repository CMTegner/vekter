#!/usr/bin/env node

// TODO: Parse args

var port = parseInt(process.argv[2]); // TODO: null = 0
var userDBPath = process.argv[3];
var messagesDBPath = process.argv[4];

var level = require('level');
var users = level(userDBPath, {
    valueEncoding: 'json'
});
var messages = level(messagesDBPath);
var Client = require('irc').Client;
var client = new Client('open.ircnet.net', 'christianBNC');

var server = require('../')(client, users, messages, port);

server.start();
