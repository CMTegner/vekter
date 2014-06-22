var createKey = require('./create-key.js');
var User = require('../ui/js/models/User.js'); // TODO: Move to ~/common

module.exports = function(client, users, messages) {
    client.on('pm', function(from, message) {
        from = from.toLowerCase();
        var u = new User({ id: from });
        u.get('message').set({
            message: message,
            from: from,
            to: client.nick,
            direction: 'received'
        });
        var data = u.toJSON();
        users.put(from, data, function(err) {
            if (err) {
                console.error('Error while storing user', err);
                return;
            }
            var key = createKey(from, data.message.time);
            messages.put(key, data.message, function(err) {
                if (err) {
                    console.error('Error while storing incoming message', err);
                }
            });
        });
    });

    client.on('error', function(err) {
        console.error(err);
    });

    return {
        users: require('./users.js')(users),
        messages: require('./messages.js')(messages),
        say: require('./say.js')(client, users, messages)
    };
};
