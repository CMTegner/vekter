module.exports = function(users) {
    return function(request, reply) {
        var data = [];
        users.createReadStream()
            // TODO: concat-json-stream
            .on('data', function(chunk) {
                var user = {
                    id: chunk.key,
                    latestMessageTime: chunk.value.latestMessageTime,
                    latestMessage: chunk.value.latestMessage
                };
                data.push(user);
            })
            .on('end', function() {
                reply(data);
            })
            .on('error', function() {
                reply('Error reading users from db').code(500);
            }); // TODO: Code coverage
    };
};
