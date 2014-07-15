#!/usr/bin/env node
var fs = require('fs');
var path = require('path');
var mkdir = require('mkdirp');
var level = require('level');
var args = require('nomnom')
    .option('directory', {
        position: 0,
        required: true,
        help: 'Path to the vekter home directory which will be converted'
    })
    .option('user', {
        position: 1,
        required: true,
        help: 'The vekter user (nickname)'
    })
    .parse();

var home = require('home-dir').directory;
var dir = args.directory.replace(/^~\//, home + '/');
dir = path.resolve(process.cwd(), dir);
if (/\/$/.test(dir)) {
    dir = dir.substring(0, dir.length - 1);
}
if (!fs.existsSync(dir)) {
    console.error('%s does not exist', dir);
    process.exit(1);
}
if (fs.existsSync(dir + '.bak')) {
    console.error('%s.bak already exists', dir);
    process.exit(1);
}
fs.renameSync(dir, dir + '.bak');
mkdir.sync(dir);
console.log('Converting %s', dir);

var oldUsers = level(dir + '.bak/users', { valueEncoding: 'json' });
var newUsers = level(dir + '/users', { valueEncoding: 'json' }).batch();

var userCount = 0;
oldUsers.createReadStream()
    .on('data', function(data) {
        var json = {
            id: data.key,
            message: {
                time: data.value.latestMessageTime,
                message: data.value.latestMessage,
                from: args.user,
                to: data.key,
                direction: 'sent'
            }
        };
        newUsers.put(data.key, json);
        userCount++;
    })
    .on('error', function(err) {
        console.log('An error occurred while reading users', err);
    })
    .on('end', function() {
        newUsers.write(function(err) {
            if (err) {
                console.error('Error storing converted users', err);
            } else {
                console.log('%s users successfully converted', userCount);
            }
        });
    });

var oldMessages = level(dir + '.bak/messages');
var newMessages = level(dir + '/messages', { valueEncoding: 'json' }).batch();

var messageCount = 0;
oldMessages.createReadStream()
    .on('data', function(data) {
        var parts = data.key.split('☃');
        var json = {
            time: parts[1],
            message: data.value,
            from: args.user,
            to: parts[0],
            direction: 'sent'
        };
        newMessages.put(data.key, json);
        messageCount++;
    })
    .on('error', function(err) {
        console.log('An error occurred while reading messages', err);
    })
    .on('end', function() {
        newMessages.write(function(err) {
            if (err) {
                console.error('Error storing converted messages', err);
            } else {
                console.log('%s messages successfully converted', messageCount);
            }
        });
    });
