var request = require('hyperquest');
var concat = require('concat-stream');

function listMessages(callback) {
    request('http://localhost:13333/messages')
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
                row.innerText = session.key
                    + ": "
                    + session.value;
                document.body.appendChild(row);
            })
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
                document.body.appendChild(row);
            })
        }));
}

listUsers(listMessages);

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
            console.log("OK");
            document.body.innerHTML = '';
            listUsers(listMessages);
        })
        .end(JSON.stringify(data));
};