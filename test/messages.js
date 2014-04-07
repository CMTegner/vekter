var Emitter = require('events').EventEmitter;
var test = require('tape');
var levelup = require('levelup');
var memdown = require('memdown');
var request = require('request');
var api = require('../');

var users, messages, server, uri;

function empty(db) {
    var batch = [];
    db.createReadStream()
        .on('data', function (entry) {
            batch.push({
                type: 'del',
                key: entry.key
            });
        })
        .on('end', function () {
            db.batch(batch);
        });
}

test('setup', function (t) {
    t.plan(1);

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
    server.start(function () {
        var port = server.info.port;
        uri = 'http://localhost:' + port;
        t.pass('setup: server should start');
    });
});

test('GET /messages (no user)', function (t) {
    t.plan(3);

    request(uri + '/messages', function (err, response, body) {
        t.ok(err === null, 'should not err');
        t.equal(response.statusCode, 400, 'should result in a \'bad request\'');
        t.equal(body, 'Missing user');
    });
});

test('GET /messages (empty db)', function (t) {
    t.plan(3);

    request(uri + '/messages?user=foo', function (err, response, body) {
        t.ok(err === null, 'should not err');
        t.equal(response.statusCode, 200, 'should return \'OK\'');
        t.deepEqual(JSON.parse(body), []);
    });
});

test('GET /messages (user only)', function (t) {
    t.plan(4);

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

    request(uri + '/messages?user=christian', function (err, response, body) {
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
        empty(messages);
    });
});

test('GET /messages (user and since)', function (t) {
    t.plan(4);

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

    var since = key2.split('☃')[1];
    request(uri + '/messages?user=christian&since=' + since, function (err, response, body) {
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
        empty(messages);
    });
});


test('GET /messages (since later than newest message)', function (t) {
    t.plan(4);

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
    request(uri + '/messages?user=christian&since=' + since, function (err, response, body) {
        t.ok(err === null, 'should not err');
        t.equal(response.statusCode, 200, 'should return \'OK\'');
        var msgs = JSON.parse(body);
        t.equal(msgs.length, 0, 'should return 0 messages');
        t.deepEqual(msgs, []);
        empty(messages);
    });
});

test('GET /messages (last)', function (t) {
    t.plan(4);

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

    request(uri + '/messages?user=christian&last=2', function (err, response, body) {
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
        empty(messages);
    });
});

test('GET /messages (since and last)', function (t) {
    t.plan(3);

    request(uri + '/messages?user=christian&last=foo&since=bar', function (err, response, body) {
        t.ok(err === null, 'should not err');
        t.equal(response.statusCode, 400, 'should result in a \'bad request\'');
        t.equal(body, 'Specify either since or last');
    });
});

test('teardown', function (t) {
    t.plan(1);

    server.stop(function () {
        t.pass('teardown: server should stop');
    });
});