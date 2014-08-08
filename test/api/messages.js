var Emitter = require('events').EventEmitter;
var test = require('tape');
var levelup = require('levelup');
var memdown = require('memdown');
var api = require('../../api/messages.js');
var createKey = require('../../api/create-key.js');
var Message = require('../../models/Message.js');

var users = levelup({
    db: memdown,
    valueEncoding: 'json'
});
var messages = levelup({
    db: memdown,
    valueEncoding: 'json'
});
var millis = new Date().getTime() - 1000;

function addMessage(to, message, direction) {
    var date = new Date(millis++);
    var key = createKey(to, date.toISOString());
    var m = new Message({
        id: key,
        time: date,
        message: message,
        from: 'noreply',
        to: to,
        direction: direction
    });
    messages.put(key, m.toJSON());
    return m;
}

function empty(db, done) {
    var batch = [];
    db.createReadStream()
        .on('data', function(entry) {
            batch.push({
                type: 'del',
                key: entry.key
            });
        })
        .on('end', function() {
            db.batch(batch);
            done();
        });
}

test('messages.read (no user)', function(t) {
    api.read({}, function(err, msgs) {
        t.ok(err, 'should err');
        t.equal(err.message, 'No user specified');
        t.equal(msgs, undefined, 'should not return any messages');
        t.end();
    });
});

test('messages.read (empty db)', function(t) {
    var options = {
        messages: messages,
        user: 'foo'
    };
    api.read(options, function(err, messages) {
        t.equal(err, null, 'should not err');
        t.equal(messages.length, 0, 'should return an empty array');
        t.end();
    });
});

test('messages.read (empty db)', function(t) {
    var m1 = addMessage('christian', 'foo bar 42', 'sent');
    var m2 = addMessage('christian', 'boom bang', 'sent');
    addMessage('john', 'beep boop', 'sent');
    addMessage('john', 'hello world', 'sent');
    var m3 = addMessage('christian', 'test', 'sent');
    addMessage('lisa', 'golly gosh');

    var options = {
        messages: messages,
        user: 'christian'
    };
    api.read(options, function(err, msgs) {
        t.equal(err, null, 'should not err');
        t.equal(msgs.length, 3, 'should return 3 messages');
        t.deepEqual(msgs, [m1.toJSON(), m2.toJSON(), m3.toJSON()]);
        empty(messages, t.end);
    });
});

test('messages.read (user and since)', function(t) {
    var m1 = addMessage('christian', 'foo bar 42', 'sent');
    var m2 = addMessage('christian', 'boom bang', 'sent');
    addMessage('john', 'beep boop', 'sent');
    addMessage('john', 'hello world', 'sent');
    var m3 = addMessage('christian', 'test', 'sent');
    addMessage('lisa', 'golly gosh');

    var options = {
        messages: messages,
        user: 'christian',
        since: m1.toJSON().time
    };
    api.read(options, function(err, msgs) {
        t.equal(err, null, 'should not err');
        t.equal(msgs.length, 2, 'should return 2 messages');
        t.deepEqual(msgs, [m2.toJSON(), m3.toJSON()]);
        empty(messages, t.end);
    });
});

test('messages.read (since equal to last message)', function(t) {
    addMessage('christian', 'foo bar 42', 'sent');
    addMessage('christian', 'boom bang', 'sent');
    addMessage('john', 'beep boop', 'sent');
    addMessage('john', 'hello world', 'sent');
    var m1 = addMessage('christian', 'test', 'sent');
    addMessage('lisa', 'golly gosh');

    var options = {
        messages: messages,
        user: 'christian',
        since: m1.toJSON().time
    };
    api.read(options, function(err, msgs) {
        t.equal(err, null, 'should not err');
        t.equal(msgs.length, 0, 'should return 0 messages');
        t.deepEqual(msgs, []);
        empty(messages, t.end);
    });
});

test('messages.read (since later than newest message)', function(t) {
    addMessage('christian', 'foo bar 42', 'sent');
    addMessage('christian', 'boom bang', 'sent');
    addMessage('john', 'beep boop', 'sent');
    addMessage('john', 'hello world', 'sent');
    addMessage('christian', 'test', 'sent');
    addMessage('lisa', 'golly gosh');

    var options = {
        messages: messages,
        user: 'christian',
        since: '2099-12-31T23:59:59.999Z'
    };
    api.read(options, function(err, msgs) {
        t.equal(err, null, 'should not err');
        t.equal(msgs.length, 0, 'should return 0 messages');
        t.deepEqual(msgs, []);
        empty(messages, t.end);
    });
});

test('messages.read (last)', function(t) {
    addMessage('christian', 'foo bar 42', 'sent');
    var m1 = addMessage('christian', 'boom bang', 'sent');
    addMessage('john', 'beep boop', 'sent');
    addMessage('john', 'hello world', 'sent');
    var m2 = addMessage('christian', 'test', 'sent');
    addMessage('lisa', 'golly gosh');

    var options = {
        messages: messages,
        user: 'christian',
        last: 2
    };
    api.read(options, function(err, msgs) {
        t.equal(err, null, 'should not err');
        t.equal(msgs.length, 2, 'should return 2 messages');
        t.deepEqual(msgs, [m1.toJSON(), m2.toJSON()]);
        empty(messages, t.end);
    });
});

test('messages.read (since and last)', function(t) {
    var options = {
        messages: messages,
        user: 'christian',
        last: 2,
        since: '2099-12-31T23:59:59.999Z'
    };
    api.read(options, function(err, msgs) {
        t.ok(err, 'should err');
        t.equal(err.message, 'Specify either since or last');
        t.equal(msgs, undefined, 'should not return any messages');
        t.end();
    });
});

test('messages.read (fail)', function(t) {
    var emitter = new Emitter();
    var options = {
        messages: {
            createReadStream: function() {
                return emitter;
            }
        },
        user: 'christian',
        last: 10
    };
    api.read(options, function(err) {
        t.ok(err, 'should err');
        t.equal(err.message, 'facepalm');
        t.end();
    });
    emitter.emit('error', new Error('facepalm'));
});

test('messages.create (no recipient)', function(t) {
    api.create({}, function(err, msg) {
        t.ok(err, 'should err');
        t.equal(err.message, 'No recipient specified');
        t.equal(msg, undefined, 'should not return any data');
        t.end();
    });
});

test('messages.create (no sender)', function(t) {
    var options = {
        to: 'foo'
    };
    api.create(options, function(err, msg) {
        t.ok(err, 'should err');
        t.equal(err.message, 'No sender specified');
        t.equal(msg, undefined, 'should not return any data');
        t.end();
    });
});

test('messages.create (no message)', function(t) {
    var options = {
        to: 'foo',
        from: 'bar'
    };
    api.create(options, function(err, msg) {
        t.ok(err, 'should err');
        t.equal(err.message, 'No message body specified');
        t.equal(msg, undefined, 'should not return any data');
        t.end();
    });
});

test('messages.create (no direction)', function(t) {
    var options = {
        to: 'foo',
        from: 'bar',
        message: 'msg'
    };
    api.create(options, function(err, msg) {
        t.ok(err, 'should err');
        t.equal(err.message, 'No direction specified');
        t.equal(msg, undefined, 'should not return any data');
        t.end();
    });
});

test('messages.create (store user fails)', function(t) {
    var options = {
        to: 'foo',
        from: 'bar',
        message: 'msg',
        direction: 'sent',
        users: {
            put: function(to, data, cb) {
                cb(true);
            }
        }
    };
    api.create(options, function(err, msg) {
        t.ok(err, 'should err');
        t.equal(err.message, 'Error while storing user');
        t.equal(msg, undefined, 'should not return any data');
        t.end();
    });
});

test('messages.create (store message fails)', function(t) {
    var options = {
        to: 'foo',
        from: 'bar',
        message: 'msg',
        direction: 'sent',
        users: users,
        messages: {
            put: function(to, data, cb) {
                cb(true);
            }
        }
    };
    api.create(options, function(err, msg) {
        t.ok(err, 'should err');
        t.equal(err.message, 'Error while storing message');
        t.equal(msg, undefined, 'should not return any data');
        users.createReadStream()
            .on('data', function(data) {
                t.equal(data.key, 'foo', 'should use the user\'s name as the key');
                var expected = {
                    id: 'foo',
                    message: {
                        time: data.value.message.time,
                        message: 'msg',
                        to: 'foo',
                        from: 'bar',
                        direction: 'sent'
                    }
                };
                t.deepEqual(data.value, expected, 'should store the user');
                empty(users, t.end);
            });
    });
});

test('messages.create (sent)', function(t) {
    var options = {
        to: 'foo',
        from: 'bar',
        message: 'msg',
        direction: 'sent',
        users: users,
        messages: messages
    };
    api.create(options, function(err, msg) {
        t.equal(err, null, 'should not err');
        messages.createReadStream()
            .on('data', function(data) {
                var time = data.key.split(createKey.sep)[1];
                var expected = {
                    time: time,
                    message: 'msg',
                    to: 'foo',
                    from: 'bar',
                    direction: 'sent'
                };
                t.deepEqual(msg, expected, 'should return the message');
                t.equal(data.key, 'foo' + createKey.sep + time,
                    'should use the user\'s name and current time as the key');
                t.deepEqual(data.value, expected, 'should store the message');
                empty(users, function() {
                    empty(messages, t.end);
                });
            });
    });
});

test('messages.create (received)', function(t) {
    var options = {
        to: 'foo',
        from: 'bar',
        message: 'msg',
        direction: 'received',
        users: users,
        messages: messages
    };
    api.create(options, function(err) {
        t.equal(err, null, 'should not err');
        var o = { messages: messages, users: users, user: 'bar', last: 1 };
        api.read(o, function(err, msgs) {
            t.equal(err, null, 'should not err');
            t.equals(msgs.length, 1);
            var msg = msgs[0];
            t.equals(msg.to, options.to);
            t.equals(msg.from, options.from);
            t.equals(msg.message, options.message);
            t.equals(msg.direction, options.direction);
            users.createReadStream()
                .on('data', function(data) {
                    t.equal(data.key, 'bar', 'should use the sender\'s name as the key');
                    var expected = {
                        id: 'bar',
                        message: {
                            time: data.value.message.time,
                            message: 'msg',
                            to: 'foo',
                            from: 'bar',
                            direction: 'received'
                        }
                    };
                    t.deepEqual(data.value, expected, 'should store the user');
                    empty(users, function() {
                        empty(messages, t.end);
                    });
                });
        });
    });
});
