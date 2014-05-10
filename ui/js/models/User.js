var Model = require('backbone').Model;
var moment = require('moment');

module.exports = Model.extend({

    defaults: {
        id: undefined, // String, e.g. "christian"
        latestMessageTime: undefined, // moment
        latestMessage: undefined // String
    },

    parse: function(data) {
        data.latestMessageTime = moment(data.latestMessageTime);
        return data;
    }
});
