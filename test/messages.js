var Emitter = require('events').EventEmitter;
var test = require('tape');
var levelup = require('levelup');
var memdown = require('memdown');
var request = require('request');
var api = require('../');

var users;
var messages;
var server;
var uri;

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
    messages = levelup(memdown);
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
    var millis = new Date().getTime();
    function createKey(user) {
        return user + '☃' + new Date(millis++).toISOString();
    }

    var key1 = createKey('christian');
    messages.put(key1, 'foo bar 42');
    var key2 = createKey('christian');
    messages.put(key2, 'boom bang');
    messages.put(createKey('john'), 'beep boop');
    messages.put(createKey('john'), 'hello world');
    var key3 = createKey('christian');
    messages.put(key3, 'test');
    messages.put(createKey('lisa'), 'golly gosh');

    request(uri + '/messages?user=christian', function(err, response, body) {
        t.ok(err === null, 'should not err');
        t.equal(response.statusCode, 200, 'should return \'OK\'');
        var msgs = JSON.parse(body);
        t.equal(msgs.length, 3, 'should return 3 messages');
        t.deepEqual(msgs, [{
            id: key1,
            name: 'christian',
            time: key1.split('☃')[1],
            message: 'foo bar 42'
        }, {
            id: key2,
            name: 'christian',
            time: key2.split('☃')[1],
            message: 'boom bang'
        }, {
            id: key3,
            name: 'christian',
            time: key3.split('☃')[1],
            message: 'test'
        }]);
        empty(messages, t.end);
    });
});

test('GET /messages (user and since)', function(t) {
    var millis = new Date().getTime();
    function createKey(user) {
        return user + '☃' + new Date(millis++).toISOString();
    }

    var key1 = createKey('christian');
    messages.put(key1, 'foo bar 42');
    var key2 = createKey('christian');
    messages.put(key2, 'boom bang');
    messages.put(createKey('john'), 'beep boop');
    messages.put(createKey('john'), 'hello world');
    var key3 = createKey('christian');
    messages.put(key3, 'test');
    messages.put(createKey('lisa'), 'golly gosh');

    var since = key1.split('☃')[1];
    request(uri + '/messages?user=christian&since=' + since, function(err, response, body) {
        t.ok(err === null, 'should not err');
        t.equal(response.statusCode, 200, 'should return \'OK\'');
        var msgs = JSON.parse(body);
        t.equal(msgs.length, 2, 'should return 2 messages');
        t.deepEqual(msgs, [{
            id: key2,
            name: 'christian',
            time: key2.split('☃')[1],
            message: 'boom bang'
        }, {
            id: key3,
            name: 'christian',
            time: key3.split('☃')[1],
            message: 'test'
        }]);
        empty(messages, t.end);
    });
});

test('GET /messages (since equal to last message)', function(t) {
    var millis = new Date().getTime();
    function createKey(user) {
        return user + '☃' + new Date(millis++).toISOString();
    }

    var key1 = createKey('christian');
    messages.put(key1, 'foo bar 42');
    var key2 = createKey('christian');
    messages.put(key2, 'boom bang');
    messages.put(createKey('john'), 'beep boop');
    messages.put(createKey('john'), 'hello world');
    var key3 = createKey('christian');
    messages.put(key3, 'test');
    messages.put(createKey('lisa'), 'golly gosh');

    var since = key3.split('☃')[1];
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
    var millis = new Date().getTime();
    function createKey(user) {
        return user + '☃' + new Date(millis++).toISOString();
    }

    var key1 = createKey('christian');
    messages.put(key1, 'foo bar 42');
    var key2 = createKey('christian');
    messages.put(key2, 'boom bang');
    messages.put(createKey('john'), 'beep boop');
    messages.put(createKey('john'), 'hello world');
    var key3 = createKey('christian');
    messages.put(key3, 'test');
    messages.put(createKey('lisa'), 'golly gosh');

    var since = new Date(millis++).toISOString();
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
    var millis = new Date().getTime() - 100;
    function createKey(user) {
        return user + '☃' + new Date(millis++).toISOString();
    }

    var key1 = createKey('christian');
    messages.put(key1, 'foo bar 42');
    var key2 = createKey('christian');
    messages.put(key2, 'boom bang');
    messages.put(createKey('john'), 'beep boop');
    messages.put(createKey('john'), 'hello world');
    var key3 = createKey('christian');
    messages.put(key3, 'test');
    messages.put(createKey('lisa'), 'golly gosh');

    request(uri + '/messages?user=christian&last=2', function(err, response, body) {
        t.ok(err === null, 'should not err');
        t.equal(response.statusCode, 200, 'should return \'OK\'');
        var msgs = JSON.parse(body);
        t.equal(msgs.length, 2, 'should return 2 messages');
        t.deepEqual(msgs, [{
            id: key2,
            name: 'christian',
            time: key2.split('☃')[1],
            message: 'boom bang'
        }, {
            id: key3,
            name: 'christian',
            time: key3.split('☃')[1],
            message: 'test'
        }]);
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
