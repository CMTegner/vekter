var createKey = require('./create-key.js');

module.exports = function (client, users, messages) {
    client.addListener('pm', function (from, message) {
        from = from.toLowerCase();
        var data = {
            latestMessage: message,
            latestMessageTime: new Date().toISOString()
        };
        users.put(from, data, function (err) {
            if (err) {
                console.error('Error while storing user', err);
                return;
            }
            var key = createKey(from);
            messages.put(key, message, function (err) {
                if (err) {
                    console.error('Error while storing incoming message', err);
                }
            });
        });
    });

    client.addListener('error', function (err) {
        console.error(err);
    });

    return {
        users: require('./users.js')(users),
        messages: require('./messages.js')(messages),
        say: require('./say.js')(client, users, messages)
    };
};