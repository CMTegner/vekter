#!/usr/bin/env node
var path = require('path');
var mkdir = require('mkdirp');
var read = require('read');
var level = require('level');
var server = require('../index.js');
var args = require('nomnom')
    .option('port', {
        abbr: 'p',
        default: 0,
        help: 'The server\'s port number'
    })
    .option('directory', {
        abbr: 'd',
        default: '~/.vekter',
        help: 'Path to vekter home directory'
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
    .option('echo', {
        flag: true,
        help: 'Use EchoClient (for testing)'
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
            console.log(); // Make sure next prompt is on a new line
            process.exit(1);
        }
        setup(secret);
    });
} else {
    setup();
}

function setup(secret) {
    var options = {
        port: args.port
    };
    var home = require('home-dir').directory;
    var dir = args.directory.replace(/^~\//, home + '/');
    dir = path.resolve(process.cwd(), dir);
    mkdir.sync(dir);
    console.log('Using directory: %s', dir);

    options.users = level(dir + '/users', { valueEncoding: 'json' });
    options.messages = level(dir + '/messages', { valueEncoding: 'json' });

    var Client;
    if (args.echo) {
        Client = require('../client/EchoClient.js');
    } else {
        Client = require('irc').Client;
    }
    options.client = new Client(args.server, args.nick);
    options.client.on('registered', function() {
        console.log('Connected to %s as %s', args.server, args.nick);

        if (secret) {
            options.username = args.user;
            options.password = secret;
        }
        var srv = server(options).on('listening', function() {
            var address = srv.address();
            console.log('Service running on http://%s:%s', address.address, address.port);
        });
    });
}
