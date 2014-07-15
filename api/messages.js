var createKey = require('./create-key.js');
var User = require('../models/User.js');

/**
 * Get messages. TODO
 *
 * @param {Object} options
 * @param {level} options.messages leveldb database containing messages
 * @param {Object} options.user
 * @param {Object} [options.since]
 * @param {Object} [options.last]
 * @param {Function} cb the node-style callback
 */
module.exports.read = function(options, cb) {
    var query = {};
    var user = options.user;
    user = user && user.trim() && user.toLowerCase();
    if (!user) {
        cb(new Error('No user specified'));
        return;
    }
    query.start = user + createKey.sep;
    query.end = query.start + '~';
    var since = options.since;
    var last = options.last;
    if (since && last) {
        cb(new Error('Specify either since or last'));
        return;
    }
    if (since) {
        query.start += since + '~';
    }
    if (last) {
        query.reverse = true;
        query.limit = parseInt(last, 10);
        query.start = require('./create-key.js')(user);
        query.end = user + createKey.sep;
    }
    var data = [];
    options.messages.createReadStream(query)
        // TODO: concat-json-stream
        .on('data', function(chunk) {
            chunk.value.id = chunk.key;
            data.push(chunk.value);
        })
        .on('end', function() {
            if (query.reverse) {
                data.reverse();
            }
            cb(null, data);
        })
        .on('error', cb); // TODO: Code coverage
};

/**
 * Create message. TODO
 *
 * @param {Object} options
 * @param {level} options.users
 * @param {level} options.messages
 * @param {String} options.to
 * @param {String} options.from
 * @param {String} options.message
 * @param {String} options.direction {sent,received}
 * @param {Function} cb the node-style callback
 */
module.exports.create = function(options, cb) {
    var to = options.to;
    to = to && to.trim() && to.toLowerCase();
    if (!to) {
        cb(new Error('No recipient specified'));
        return;
    }
    var from = options.from;
    from = from && from.trim() && from.toLowerCase();
    if (!from) {
        cb(new Error('No sender specified'));
        return;
    }
    var message = options.message;
    message = message && message.trim();
    if (!message) {
        cb(new Error('No message body specified'));
        return;
    }
    var direction = options.direction;
    if (!direction) {
        cb(new Error('No direction specified'));
        return;
    }
    var key = direction === 'sent' ? to : from;
    var u = new User({ id: key });
    u.get('message').set({
        message: message,
        from: from,
        to: to,
        direction: options.direction
    });
    var data = u.toJSON();
    options.users.put(key, data, function(err) {
        if (err) {
            cb(new Error('Error while storing user'));
            return;
        }
        var key = createKey(to, data.message.time);
        options.messages.put(key, data.message, function(err) {
            if (err) {
                cb(new Error('Error while storing message'));
                return;
            }
            cb(null, data.message);
        });
    });
};
