var Model = require('backbone').Model;
var moment = require('moment');

module.exports = Model.extend({

    defaults: {
        id: undefined, // String, e.g. "christian☃2014-03-30T10:46:51.747Z"
        time: undefined, // moment
        user: undefined, // String
        message: undefined // String
    },

    parse: function (data) {
        data.time = moment(data.time);
        return data;
    }
});
