var Model = require('backbone').Model;
var moment = require('moment');

/**
 * @param {String} [attributes.id] the message id, e.g. 'christian☃2014-03-30T10:46:51.747Z'
 * @param {String} [attributes.direction] the message direction, {sent,received}
 * @param {moment} [attributes.time] the time the message was sent/received
 * @param {String} [attributes.to] the receiver of the message
 * @param {String} [attributes.from] the sender of the message
 * @param {String} [attributes.message] the message body
 * @type {Model} TODO
 */
module.exports = Model.extend({

    defaults: function() {
        return {
            time: moment()
        };
    },

    parse: function() {
        var data = Model.prototype.parse.apply(this, arguments);
        data.time = moment(data.time);
        return data;
    },

    toJSON: function() {
        var json = Model.prototype.toJSON.apply(this, arguments);
        json.time = json.time.toISOString();
        return json;
    }
});
