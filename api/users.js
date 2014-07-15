/**
 * Get users.
 *
 * @param {level} users leveldb database containing users
 * @param {Function} cb the node-style callback
 */
module.exports = function(users, cb) {
    var data = [];
    users.createReadStream()
        // TODO: concat-json-stream
        .on('data', function(chunk) {
            data.push(chunk.value);
        })
        .on('end', function() {
            cb(null, data);
        })
        .on('error', cb); // TODO: Code coverage
};
