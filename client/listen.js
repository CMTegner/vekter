var api = require('../api/messages.js');

module.exports = function(client, users, messages) {
    client.on('pm', function(from, message) {
        var options = {
            users: users,
            messages: messages,
            to: client.nick,
            from: from,
            message: message,
            direction: 'received'
        };
        api.create(options, function(err) {
            if (err) {
                console.error('Error while storing incoming message');
                console.error(err);
            }
        });
    });
    client.on('error', function(err) {
        console.error(err);
    });
};
