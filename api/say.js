var createKey = require('./create-key.js');

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
        var data = {
            latestMessage: message,
            latestMessageTime: new Date().toISOString()
        };
        users.put(user, data, function(err) {
            if (err) {
                console.error('Error while storing user', err);
                return;
            }
            var key = createKey(user);
            messages.put(key, message, function(err) {
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
