var url = require('url');
var _last = require('lodash.last');
var request = require('hyperquest');
var concat = require('concat-stream');
var ornament = require('ornament/runtime');
var MessageCollection = require('../../collections/Message.js');
var UserCollection = require('../../collections/User.js');
var marked = require('marked');
var keydown = require('keydown');

var messages = new MessageCollection();
var users = new UserCollection();

// getMessages interval id
var mid;
var uri = url.parse(location.href);
var host = uri.protocol + '//' + uri.hostname;
if (uri.port) {
    host += ':' + uri.port;
}
var messageLimit = 20;
var selectedUser;

messages.on('add', function(message) {
    while (messages.length > messageLimit) {
        messages.shift();
    }
    message.set('message', marked(message.get('message'), {
        gfm: true,
        tables: false,
        sanitize: true,
        smartypants: true
    }));
});

ornament.settings = require('ornament/binding-backbone.js');
var tree = ornament(require('../templates/app.json'), {
    users: users,
    messages: messages
});
var children = tree.childNodes;
for (var i = 0; i < children.length; i++) {
    document.body.appendChild(children[i]);
}

function fromNow(message) {
    message.set('fromNow', message.get('time').fromNow());
}

setInterval(function() {
    messages.forEach(fromNow);
    users.pluck('message').forEach(fromNow);
}, 1000);

users.on('add', function(user) {
    // TODO
    // row.addEventListener('click', onUserClick);
    if (!selectedUser) {
        selectUser(user.id);
    }
});

function getMessages(user) {
    var uri = host + '/messages?user=' + user;
    var last = messages.last();
    if (last) {
        uri += '&since=' + last.get('time').toISOString();
    } else {
        uri += '&last=20';
    }
    request(uri)
        .on('error', function(err) {
            throw err; // TODO
        })
        .pipe(concat(function(data) {
            // TODO: data is an empty array when the backend can't be reached, wtf?
            var msg = _last(JSON.parse(data), messageLimit);
            messages.add(msg, { parse: true });
            messages.forEach(fromNow);
        }));
}

function getUsers() {
    request(host + '/users')
        .on('error', function(err) {
            throw err; // TODO
        })
        .pipe(concat(function(data) {
            // TODO: data is an empty array when the backend can't be reached, wtf?
            users.add(JSON.parse(data), { parse: true, merge: true });
            users.pluck('message').forEach(fromNow);
        }));
}

setInterval(getUsers, 500); // TODO: socket.io

document.querySelector('[data-role=new-pm]').addEventListener('click', function(event) {
    event.preventDefault();
    event.stopPropagation();
    clearInterval(mid);
    messages.reset();
    var input = document.querySelector('input');
    input.style.display = 'block';
    input.value = '';
    input.focus();
});

document.querySelector('[data-role=user-container]').addEventListener('click', function(event) {
    event.preventDefault();
    var el = event.target;
    if (el.getAttribute('data-role') === 'new-pm') {
        return;
    }
    while (!el.getAttribute('data-user')) {
        el = el.parentElement;
    }
    selectUser(el.getAttribute('data-user'));
});

var textarea = document.querySelector('textarea');

function selectUser(user) {
    selectedUser = user;
    var input = document.querySelector('input');
    input.style.display = 'none';
    input.value = user;
    textarea.focus();
    messages.reset();
    // TODO: Abort pending request
    clearInterval(mid);
    mid = setInterval(function() {
        getMessages(user);
    }, 500); // TODO: socket.io
    getMessages(user);
}

keydown('<enter>', textarea).on('pressed', onSubmit);

document.forms[0].addEventListener('submit', function(event) {
    event.preventDefault();
    onSubmit();
});

function onSubmit() {
    var input = document.querySelector('input');
    var user = input.value.trim();
    var message = textarea.value.trim();
    if (!user || !message) {
        return;
    }
    var opts = {
        headers: {
            'Content-Type': 'application/json'
        },
        method: 'POST'
    };
    request(host + '/say', opts)
        .on('error', function(err) {
            throw err; // TODO
        })
        .on('end', function() {
            textarea.value = '';
            textarea.focus();
            if (!selectedUser) {
                selectUser(user);
            }
        })
        .end(JSON.stringify({
            to: user,
            message: message
        }));
}
