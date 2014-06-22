var Emitter = require('events').EventEmitter;
var test = require('tape');
var levelup = require('levelup');
var memdown = require('memdown');
var request = require('request');
var moment = require('moment');
var api = require('../');
var Message = require('../ui/js/models/Message.js');

var users;
var messages;
var server;
var uri;

var millis = new Date().getTime() - 1000;
function createKey(user) {
    return user + '☃' + new Date(millis++).toISOString();
}

function addMessage(messages, to, message, direction) {
    var key = createKey(to);
    var m = new Message({
        id: key,
        time: moment(millis++),
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

test('setup', function(t) {
    users = levelup({
        db: memdown,
        valueEncoding: 'json'
    });
    messages = levelup({
        db: memdown,
        valueEncoding: 'json'
    });
    server = api({
        client: new Emitter(),
        users: users,
        messages: messages
    });
    server.start(function() {
        var port = server.info.port;
        uri = 'http://localhost:' + port;
        t.pass('setup: server should start');
        t.end();
    });
});

test('GET /messages (no user)', function(t) {
    request(uri + '/messages', function(err, response, body) {
        t.ok(err === null, 'should not err');
        t.equal(response.statusCode, 400, 'should result in a \'bad request\'');
        t.equal(body, 'Missing user');
        t.end();
    });
});

test('GET /messages (empty db)', function(t) {
    request(uri + '/messages?user=foo', function(err, response, body) {
        t.ok(err === null, 'should not err');
        t.equal(response.statusCode, 200, 'should return \'OK\'');
        t.deepEqual(JSON.parse(body), []);
        t.end();
    });
});

test('GET /messages (user only)', function(t) {
    var m1 = addMessage(messages, 'christian', 'foo bar 42', 'sent');
    var m2 = addMessage(messages, 'christian', 'boom bang', 'sent');
    addMessage(messages, 'john', 'beep boop', 'sent');
    addMessage(messages, 'john', 'hello world', 'sent');
    var m3 = addMessage(messages, 'christian', 'test', 'sent');
    addMessage(messages, 'lisa', 'golly gosh');

    request(uri + '/messages?user=christian', function(err, response, body) {
        t.ok(err === null, 'should not err');
        t.equal(response.statusCode, 200, 'should return \'OK\'');
        var msgs = JSON.parse(body);
        t.equal(msgs.length, 3, 'should return 3 messages');
        t.deepEqual(msgs, [m1.toJSON(), m2.toJSON(), m3.toJSON()]);
        empty(messages, t.end);
    });
});

test('GET /messages (user and since)', function(t) {
    var m1 = addMessage(messages, 'christian', 'foo bar 42', 'sent');
    var m2 = addMessage(messages, 'christian', 'boom bang', 'sent');
    addMessage(messages, 'john', 'beep boop', 'sent');
    addMessage(messages, 'john', 'hello world', 'sent');
    var m3 = addMessage(messages, 'christian', 'test', 'sent');
    addMessage(messages, 'lisa', 'golly gosh');

    var since = m1.toJSON().time;
    request(uri + '/messages?user=christian&since=' + since, function(err, response, body) {
        t.ok(err === null, 'should not err');
        t.equal(response.statusCode, 200, 'should return \'OK\'');
        var msgs = JSON.parse(body);
        t.equal(msgs.length, 2, 'should return 2 messages');
        t.deepEqual(msgs, [m2.toJSON(), m3.toJSON()]);
        empty(messages, t.end);
    });
});

test('GET /messages (since equal to last message)', function(t) {
    addMessage(messages, 'christian', 'foo bar 42', 'sent');
    addMessage(messages, 'christian', 'boom bang', 'sent');
    addMessage(messages, 'john', 'beep boop', 'sent');
    addMessage(messages, 'john', 'hello world', 'sent');
    var m1 = addMessage(messages, 'christian', 'test', 'sent');
    addMessage(messages, 'lisa', 'golly gosh');

    var since = m1.toJSON().time;
    request(uri + '/messages?user=christian&since=' + since, function(err, response, body) {
        t.ok(err === null, 'should not err');
        t.equal(response.statusCode, 200, 'should return \'OK\'');
        var msgs = JSON.parse(body);
        t.equal(msgs.length, 0, 'should return 0 messages');
        t.deepEqual(msgs, []);
        empty(messages, t.end);
    });
});

test('GET /messages (since later than newest message)', function(t) {
    addMessage(messages, 'christian', 'foo bar 42', 'sent');
    addMessage(messages, 'christian', 'boom bang', 'sent');
    addMessage(messages, 'john', 'beep boop', 'sent');
    addMessage(messages, 'john', 'hello world', 'sent');
    addMessage(messages, 'christian', 'test', 'sent');
    addMessage(messages, 'lisa', 'golly gosh');

    var since = '2099-12-31T23:59:59.999Z';
    request(uri + '/messages?user=christian&since=' + since, function(err, response, body) {
        t.ok(err === null, 'should not err');
        t.equal(response.statusCode, 200, 'should return \'OK\'');
        var msgs = JSON.parse(body);
        t.equal(msgs.length, 0, 'should return 0 messages');
        t.deepEqual(msgs, []);
        empty(messages, t.end);
    });
});

test('GET /messages (last)', function(t) {
    addMessage(messages, 'christian', 'foo bar 42', 'sent');
    var m1 = addMessage(messages, 'christian', 'boom bang', 'sent');
    addMessage(messages, 'john', 'beep boop', 'sent');
    addMessage(messages, 'john', 'hello world', 'sent');
    var m2 = addMessage(messages, 'christian', 'test', 'sent');
    addMessage(messages, 'lisa', 'golly gosh');

    request(uri + '/messages?user=christian&last=2', function(err, response, body) {
        t.ok(err === null, 'should not err');
        t.equal(response.statusCode, 200, 'should return \'OK\'');
        var msgs = JSON.parse(body);
        t.equal(msgs.length, 2, 'should return 2 messages');
        t.deepEqual(msgs, [m1.toJSON(), m2.toJSON()]);
        empty(messages, t.end);
    });
});

test('GET /messages (since and last)', function(t) {
    request(uri + '/messages?user=christian&last=foo&since=bar', function(err, response, body) {
        t.ok(err === null, 'should not err');
        t.equal(response.statusCode, 400, 'should result in a \'bad request\'');
        t.equal(body, 'Specify either since or last');
        t.end();
    });
});

test('GET /messages (fail)', function(t) {
    var emitter = new Emitter();
    var fn = messages.createReadStream;
    messages.createReadStream = function() {
        return emitter;
    };
    request(uri + '/messages?user=christian&last=10', function(err, response, body) {
        messages.createReadStream = fn;
        t.equal(err, null, 'should not err');
        t.equal(response.statusCode, 500, 'should result in a \'internal server error\'');
        t.equal(body, 'Error reading messages from db');
        t.end();
    });
    setTimeout(function() {
        emitter.emit('error');
    }, 100);
});

test('teardown', function(t) {
    server.stop(function() {
        t.pass('teardown: server should stop');
        t.end();
    });
});
