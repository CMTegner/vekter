var createKey = require('./create-key.js');

module.exports = function (client, users, messages) {
    client.addListener('pm', function (from, message) {
        from = from.toLowerCase();
        users.put(from, from, function (err) {
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

    client.addListener('registered', function () {
        // TODO: Should not allow sending messages until connection is established
        console.log('connected');
    });

    return {
        users: require('./users.js')(users),
        messages: require('./messages.js')(messages),
        say: require('./say.js')(client, users, messages)
    };
};