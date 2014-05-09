var hapi = require('hapi');
var bcrypt = require('bcrypt');
var api = require('./api/index.js');

/**
 * Create a new server.
 *
 * @param {irc.Client} options.client the IRC client to interact with for inbound/outbound messages
 * @param {level} options.users the database used for storing and retrieving users
 * @param {level} options.messages the database used for storing and retrieving messages
 * @param {String} [options.username] the username to use for the optional HTTP basic auth
 * @param {String} [options.password] the password to use for the optional HTTP basic auth
 * @param {Number} [options.port] the server's port, an ephemeral port will be picked if non is specified
 * @returns {hapi.Server} the hapi server object, ready to be started
 */
module.exports = function (options) {
    var a = api(options.client, options.users, options.messages);
    var server = hapi.createServer(options.port || 0, {
        files: {
            relativeTo: __dirname
        }
    });

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
            handler: a.messages
        });
        server.route({
            path: '/users',
            method: 'GET',
            config: { auth: auth },
            handler: a.users
        });
        server.route({
            path: '/say',
            method: 'POST',
            config: { auth: auth },
            handler: a.say
        });
    }

    if (options.username) {
        server.pack.require('hapi-auth-basic', function () {
            var validate = function (username, password, callback) {
                if (username !== options.username) {
                    return callback(null, false);
                }
                bcrypt.compare(password, options.password, function (err, isValid) {
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
