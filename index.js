var hapi = require('hapi');

/**
 * Create a new server.
 *
 * @param {irc.Client} client TODO
 * @param {level} users TODO
 * @param {level} messages TODO
 * @param {Number} [port] the server's port, defaults to 0 (ephemeral)
 * @returns {Server} the hapi server object, ready to be started
 */
module.exports = function (client, users, messages, port) {
    var api = require('./api')(client, users, messages);
    var server = hapi.createServer(port || 0);

    // UI
    server.route({
        path: '/{file*}',
        method: 'GET',
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
        handler: api.messages
    });
    server.route({
        path: '/users',
        method: 'GET',
        handler: api.users
    });
    server.route({
        path: '/say',
        method: 'POST',
        handler: api.say
    });

    return server;
};
