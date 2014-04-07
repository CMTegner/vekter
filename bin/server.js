#!/usr/bin/env node

var path = require('path');
var mkdir = require('mkdirp');
var read = require('read');
var bcrypt = require('bcrypt');
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
    .option('user', {
        abbr: 'u',
        help: 'Username to use for optional HTTP basic auth (you will be prompted for the password)'
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

if (args.user) {
    var opts = {
        prompt: 'Password:',
        silent: true,
        replace: '*'
    };
    read(opts, function(err, secret) {
        if (err) {
            throw err;
        }
        setup(secret);
    });
} else {
    setup();
}

function setup(secret) {
    var home = require('home-dir').directory;
    var dir = args.directory.replace(/^~\//, home + '/');
    dir = path.resolve(process.cwd(), dir);
    mkdir.sync(dir);
    console.log('Using directory: %s', dir);

    var users = level(dir + '/users', { valueEncoding: 'json' });
    var messages = level(dir + '/messages');

    var Client = require('irc').Client;
    var client = new Client(args.server, args.nick);
    client.addListener('registered', function() {
        console.log('Connected to %s as %s', args.server, args.nick);

        var hash = secret && bcrypt.hashSync(secret, 10);
        var server = require('../')(args.user, hash, client, users, messages, args.port);
        server.start(function () {
            console.log('Service running on http://%s:%s', server.info.host, server.info.port);
        });
    });
}
