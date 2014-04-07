var hapi = require('hapi');
var bcrypt = require('bcrypt');

/**
 * Create a new server.
 *
 * @param {String} [username] TODO
 * @param {String} [password] TODO
 * @param {irc.Client} client TODO
 * @param {level} users TODO
 * @param {level} messages TODO
 * @param {Number} port the server's port
 * @returns {Server} the hapi server object, ready to be started
 */
module.exports = function (username, password, client, users, messages, port) {
    var api = require('./api')(client, users, messages);
    var server = hapi.createServer(port || 0);

    function setup(auth) {
        // UI
        server.route({
            path: '/{file*}',
            method: 'GET',
            config: { auth: auth },
            handler: {
                directory: {
                    path: 'ui/',
                    index: true
                }
            }
        });

        // API
        server.route({
            path: '/messages',
            method: 'GET',
            config: { auth: auth },
            handler: api.messages
        });
        server.route({
            path: '/users',
            method: 'GET',
            config: { auth: auth },
            handler: api.users
        });
        server.route({
            path: '/say',
            method: 'POST',
            config: { auth: auth },
            handler: api.say
        });
    }

    if (username) {
        server.pack.require('hapi-auth-basic', function () {
            var validate = function (u, pw, callback) {
                if (u !== username) {
                    return callback(null, false);
                }
                bcrypt.compare(pw, password, function (err, isValid) {
                    callback(err, isValid, {});
                });
            };
            server.auth.strategy('simple', 'basic', { validateFunc: validate });
            setup('simple');
        });
    } else {
        setup();
    }

    return server;
};
