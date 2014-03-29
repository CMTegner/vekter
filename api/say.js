var createKey = require('./create-key.js');

module.exports = function (client, users, messages) {
    return function (user, message) {
        user = user.toLowerCase();
        users.put(user, user, function (err) {
            if (err) {
                console.error('Error while storing user', err);
                return;
            }
            var key = createKey(user);
            messages.put(key, message, function (err) {
                if (err) {
                    console.error('Error while storing outgoing message', err);
                    return;
                }
                client.say(user, message);
            });
        });
    };
};