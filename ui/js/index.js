var request = require('hyperquest');
var concat = require('concat-stream');
var MessageCollection = require('./collections/Message.js');
var UserCollection = require('./collections/User.js');

var messages = new MessageCollection();
var users = new UserCollection();

// getMessages interval id
var mid;

messages.on('add', function (message) {
    var row = document.createElement('div');
    row.innerHTML = '<small><em>'
        + message.get('time').fromNow()
        + '</em></small><br>'
        + message.get('message')
        + '<br>';
    document.querySelector('[data-role=message-container]').appendChild(row);
});

messages.on('reset', function () {
    document.querySelector('[data-role=message-container]').innerHTML = '';
});

users.on('add', function (user) {
    var row = document.createElement('div');
    row.className = 'user';
    row.setAttribute('data-user', user.id);
    row.innerHTML = '<small class="pull-right"><em>'
        + user.get('latestMessageTime').fromNow()
        + '</em></small>'
        + user.id
        + '<div>' + user.get('latestMessage') + '</div>';
    document.querySelector('[data-role=user-container]').appendChild(row);
    user.on('change', function () {
        row.innerHTML = '<small class="pull-right"><em>'
            + user.get('latestMessageTime').fromNow()
            + '</em></small>'
            + user.id
            + '<div>' + user.get('latestMessage') + '</div>';
    });
    row.addEventListener('click', onUserClick);
});

function getMessages(user) {
    var uri = 'http://localhost:13333/messages';
    var last = messages.last();
    if (user) {
        uri += '?user=' + user;
    } else  if (last) {
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

function getUsers(callback) {
    request('http://localhost:13333/users')
        .on('error', function (err) {
            throw err; // TODO
        })
        .pipe(concat(function (data) {
            // TODO: data is an empty array when the backend can't be reached, wtf?
            users.add(JSON.parse(data), { parse: true, merge: true });
            if (callback) {
                callback();
            }
        }));
}

getUsers(function () {
    var user = users.first();
    if (user) {
        selectUser(user.id);
    }
    setInterval(getUsers, 500); // TODO: socket.io
});

document.querySelector('[data-role=new-pm]').addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    clearInterval(mid);
    messages.reset();
    var input = document.querySelector('input');
    input.style.display = 'block';
    input.value = '';
    input.focus();
});

function onUserClick(event) {
    event.preventDefault();
    selectUser(event.currentTarget.getAttribute('data-user'));
}

function selectUser(user) {
    var input = document.querySelector('input');
    input.style.display = 'none';
    input.value = user;
    document.querySelector('textarea').focus();
    messages.reset();
    getMessages(user);
    clearInterval(mid);
    mid = setInterval(function () {
        getMessages(user)
    }, 500); // TODO: socket.io
}

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