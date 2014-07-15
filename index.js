var http = require('http');
var url = require('url');
var st = require('st');
var concat = require('concat-stream');
var auth = require('basic-auth');
var listen = require('./client/listen.js');
var api = {
    users: require('./api/users.js'),
    messages: require('./api/messages.js')
};

/**
 * Create a new server.
 *
 * @param {irc.Client} options.client the IRC client to interact with for inbound/outbound messages
 * @param {level} options.users the database used for storing and retrieving users
 * @param {level} options.messages the database used for storing and retrieving messages
 * @param {String} [options.username] the username to use for the optional HTTP basic auth
 * @param {String} [options.password] the password to use for the optional HTTP basic auth
 * @param {Number} [options.port] the server's port, an ephemeral port will be picked if non is specified
 * @returns {http.Server} the http server object
 */
module.exports = function(options) {
    listen(options.client, options.users, options.messages);
    var stat = st({
        path: __dirname + '/ui',
        index: 'index.html'
    });
    function authenticated(req) {
        if (!options.password) {
            return true;
        }
        var user = auth(req);
        if (!user) {
            return false;
        }
        return user.name === options.username &&
            user.pass === options.password;
    }
    var server = http.createServer(function(req, res) {
        var uri = url.parse(req.url, true);
        var pathname = uri.pathname;
        if (pathname === '/users') {
            if (!authenticated(req)) { return sendNotAuthorizedError(res); }
            if (req.method !== 'GET') { return sendMethodNotAllowedError(res); }
            api.users(options.users, function(err, data) {
                if (err) {
                    console.error('Error while retrieving users');
                    console.error(err.stack);
                    res.writeHead(500);
                    return res.end('Error loading resource');
                }
                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });
                res.end(JSON.stringify(data));
            });
            return;
        }
        if (pathname === '/messages') {
            if (!authenticated(req)) { return sendNotAuthorizedError(res); }
            if (req.method !== 'GET') { return sendMethodNotAllowedError(res); }
            var opts = uri.query;
            opts.messages = options.messages;
            api.messages.read(opts, function(err, data) {
                if (err) {
                    console.error('Error while retrieving messages');
                    console.error(err.stack);
                    res.writeHead(500);
                    return res.end('Error loading resource');
                }
                res.writeHead(200, {
                    'Content-Type': 'application/json'
                });
                res.end(JSON.stringify(data));
            });
            return;
        }
        if (pathname === '/say') {
            if (!authenticated(req)) { return sendNotAuthorizedError(res); }
            if (req.method !== 'POST') { return sendMethodNotAllowedError(res); }
            req.on('error', function(err) {
                console.error('Error while reading /say request payload');
                console.error(err.stack);
            });
            req.pipe(concat(function(data) {
                var opts = JSON.parse(data);
                opts.from = options.client.nick;
                opts.users = options.users;
                opts.messages = options.messages;
                opts.direction = 'sent';
                api.messages.create(opts, function(err, message) {
                    if (err) {
                        console.error('Error while storing outgoing message');
                        console.error(err.stack);
                        res.writeHead(500);
                        return res.end('Error loading resource');
                    }
                    options.client.say(opts.to, message.message);
                    res.writeHead(200, {
                        'Content-Type': 'application/json'
                    });
                    res.end();
                });
            }));
            return;
        }
        if (req.method !== 'GET') { return sendMethodNotAllowedError(res); }
        stat(req, res);
    });
    server.listen(options.port || 0);
    return server;
};

function sendMethodNotAllowedError(response) {
    response.writeHead(405);
    response.end();
}

function sendNotAuthorizedError(response) {
    response.writeHead(401, {
        'WWW-Authenticate': 'Basic'
    });
    response.end();
}
