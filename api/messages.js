module.exports = function(messages) {
    return function(request, reply) {
        var options = {};
        var user = request.query.user;
        if (!user) {
            reply('Missing user').code(400);
            return;
        }
        options.start = user + '☃';
        options.end = options.start + '~';
        var since = request.query.since;
        var last = request.query.last;
        if (since && last) {
            reply('Specify either since or last').code(400);
            return;
        }
        if (since) {
            options.start += since + '~';
        }
        if (last) {
            options.reverse = true;
            options.limit = parseInt(last, 10);
            options.start = require('./create-key.js')(user);
            options.end = user + '☃';
        }
        var data = [];
        messages.createReadStream(options)
            // TODO: concat-json-stream
            .on('data', function(chunk) {
                var tokens = chunk.key.split('☃'); // TODO
                var message = {
                    id: chunk.key,
                    name: tokens[0],
                    time: tokens[1],
                    message: chunk.value
                };
                data.push(message);
            })
            .on('end', function() {
                if (options.reverse) {
                    data.reverse();
                }
                reply(data);
            })
            .on('error', function() {
                reply('Error reading messages from db').code(500);
            }); // TODO: Code coverage
    };
};
