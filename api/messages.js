module.exports = function (messages) {
    return function (request, reply) {
        var options = {};
        var user = request.query.user;
        if (!user) {
            reply('Missing user').code(400);
            return;
        }
        options.start = user + '☃';
        options.end = options.start + '~';
        var since = request.query.since;
        if (since) {
            options.start += since;
        }
        var data = [];
        messages.createReadStream(options)
            // TODO: concat-json-stream
            .on('data', function (chunk) {
                var tokens = chunk.key.split('☃'); // TODO
                var message = {
                    id: chunk.key,
                    name: tokens[0],
                    time: tokens[1],
                    message: chunk.value
                };
                data.push(message);
            })
            .on('end', function () {
                reply(data);
            })
            .on('error', function () {
                reply('Error reading messages from db').code(500);
            }); // TODO: Code coverage
    };
};