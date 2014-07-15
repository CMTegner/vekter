var EventEmitter = require('events').EventEmitter;

module.exports = function (server, nick) {
    var client = new EventEmitter();
    client.nick = nick;
    client.say = function (user, message) {
        // PM self
        client.emit('pm', user, message);
    };
    setImmediate(function () {
        client.emit('registered');
    });
    return client;
};