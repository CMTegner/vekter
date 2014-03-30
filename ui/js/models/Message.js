var Model = require('backbone').Model;
var moment = require('moment');

module.exports = Model.extend({

    defaults: {
        id: undefined, // String, e.g. "christian☃Sat, 29 Mar 2014 13:12:13 GMT"
        time: undefined, // moment
        user: undefined, // String
        message: undefined // String
    },

    parse: function (data) {
        data.time = moment(data.time);
        return data;
    }
});
