var request = require('hyperquest');
var concat = require('concat-stream');
var MessageCollection = require('./collections/Message.js');

var messages = new MessageCollection();

messages.on('add', function (message) {
    var row = document.createElement('div');
    row.innerText = message.get('name')
        + ' (' + message.get('time')
        + '): '
        + message.get('message');
    document.querySelector('[data-role=message-container]').appendChild(row);
});

function getMessages() {
    request('http://localhost:13333/messages')
        .on('error', function (err) {
            throw err; // TODO
        })
        .pipe(concat(function (data) {
            messages.add(JSON.parse(data), { parse: true });
        }));
}

function listUsers(callback) {
    request('http://localhost:13333/users')
        .on('error', function (err) {
            throw err; // TODO
        })
        .on('end', function () {
            if (typeof callback === 'function') {
                callback();
            }
        })
        .pipe(concat(function (data) {
            console.log(data);
            console.log(JSON.parse(data));
            var sessions = JSON.parse(data);
            sessions.forEach(function (session) {
                var row = document.createElement('div');
                row.innerHTML = session.key;
                document.querySelector('[data-role=user-container]').appendChild(row);
            })
        }));
}

listUsers();
getMessages();
setInterval(getMessages, 500);

window.say = function (user, message) {
    var data = {
        user: user,
        message: message
    };
    var opts = {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST'
    };
    request('http://localhost:13333/say', opts)
        .on('error', function (err) {
            throw err; // TODO
        })
        .on('end', function () {
            console.log('OK');
            document.body.innerHTML = '';
            listUsers(listMessages);
        })
        .end(JSON.stringify(data));
};