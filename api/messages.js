module.exports = function (messages) {
    return function (request, reply) {
        var data = [];
        messages.createReadStream()
            // TODO: concat-json-stream
            .on('data', function (chunk) {
                data.push(chunk);
            })
            .on('end', function () {
                reply(data);
            })
            .on('error', function () {
                reply('Error reading messages from db').code(500);
            }); // TODO: Code coverage
    };
};