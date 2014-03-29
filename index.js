var level = require('level');
var messages = level('.messages');
var users = level('.users');

var irc = require('irc');
var client = new irc.Client('open.ircnet.net', 'christianBNC');

client.addListener('pm', function (from, message) {
    from = from.toLowerCase();
    console.log(from + ' => ME: ' + message);
    var key = createKey(from);
    messages.put(key, message, function (err) {
        if (err) {
            console.error('Error while storing incoming message', err);
            return;
        }
        users.put(from, from, function (err) {
            if (err) {
                console.error('Error while storing user', err);
                return;
            }
            say(from, 'dude...');
        });
    });
});

client.addListener('error', function (err) {
    console.error(err);
});

client.addListener('registered', function () {
    console.log('connected');
    say('christian', 'lol idk');
});

function createKey(user) {
    return user + '☃' + new Date().toUTCString();
}

function say(user, message) {
    user = user.toLowerCase();
    var key = createKey(user);
    messages.put(key, message, function (err) {
        if (err) {
            console.error('Error while storing outgoing message', err);
            return;
        }
        users.put(user, user, function (err) {
            if (err) {
                console.error('Error while storing user', err);
                return;
            }
            client.say(user, message);
        });
    });
}

