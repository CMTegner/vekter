var createKey = require('./create-key.js');
var User = require('../ui/js/models/User.js'); // TODO: Move to ~/common

module.exports = function(client, users, messages) {
    return function(request, reply) {
        var user = request.payload.user;
        user = user && user.trim() && user.toLowerCase();
        if (!user) {
            reply('Missing user').code(400);
            return;
        }
        var message = request.payload.message;
        message = message && message.trim();
        if (!message) {
            reply('Missing message').code(400);
            return;
        }
        var u = new User({ id: user });
        u.get('message').set({
            message: message,
            from: client.nick,
            to: user,
            direction: 'sent'
        });
        var data = u.toJSON();
        users.put(user, data, function(err) {
            if (err) {
                console.error('Error while storing user', err);
                return;
            }
            var key = createKey(user, data.message.time);
            messages.put(key, data.message, function(err) {
                if (err) {
                    console.error('Error while storing outgoing message', err);
                    return;
                }
                client.say(user, message);
                reply();
            });
        });
    };
};
