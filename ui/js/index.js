var request = require('hyperquest');
var concat = require('concat-stream');
var MessageCollection = require('./collections/Message.js');

var messages = new MessageCollection();

messages.on('add', function (message) {
    var row = document.createElement('div');
    row.innerText = message.get('name')
        + ' (' + message.get('time').fromNow()
        + '): '
        + message.get('message');
    document.querySelector('[data-role=message-container]').appendChild(row);
});

function getMessages() {
    var uri = 'http://localhost:13333/messages';
    var last = messages.last();
    if (last) {
        uri += '?start=' + last.id + '~'
    }
    request(uri)
        .on('error', function (err) {
            throw err; // TODO
        })
        .pipe(concat(function (data) {
            // TODO: data is an empty array when the backend can't be reached, wtf?
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
setInterval(getMessages, 500); // TODO: socket.io

document.forms[0].addEventListener('submit', function (event) {
    event.preventDefault();
    var input = document.querySelector('input');
    var user = input.value;
    var textarea = document.querySelector('textarea');
    var message = textarea.value;
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
            textarea.value = '';
            textarea.focus();
        })
        .end(JSON.stringify({
            user: user,
            message: message
        }));
});