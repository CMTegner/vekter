module.exports = function (messages) {
    return function (request, reply) {
        var opts = {};
        if (request.query.user) {
            opts.start = request.query.user + '☃';
            opts.end  = request.query.user + '☃~';
        }
        if (request.query.start) {
            opts.start = request.query.start;
        }
        var data = [];
        messages.createReadStream(opts)
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