var level = require('level');
var messages = level('.messages');

var irc = require('irc');
var client = new irc.Client('open.ircnet.net', 'christianBNC');

client.addListener('pm', function (from, message) {
    console.log(from + ' => ME: ' + message);
    var key = createKey(from);
    messages.put(key, message, function (err) {
        if (err) {
            console.error(err);
        }
        say(from, 'dude...');
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
    var key = createKey(user);
    messages.put(key, message, function (err) {
        if (err) {
            console.error(err);
            return;
        }
        client.say(user, message);
    });
}

