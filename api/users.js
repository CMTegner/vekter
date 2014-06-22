module.exports = function(users) {
    return function(request, reply) {
        var data = [];
        users.createReadStream()
            // TODO: concat-json-stream
            .on('data', function(chunk) {
                data.push(chunk.value);
            })
            .on('end', function() {
                reply(data);
            })
            .on('error', function(err) {
                console.error(err);
                reply('Error reading users from db').code(500);
            }); // TODO: Code coverage
    };
};
