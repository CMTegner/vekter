var Model = require('backbone').Model; // TODO: backdash
var Message = require('./Message.js');

/**
 * @param {String} [attributes.id] the user id, e.g. 'christian'
 * @param {Message} [attributes.message] the last message to/from this user
 * @type {Model}
 */
module.exports = Model.extend({

    defaults: function() {
        return {
            message: new Message()
        };
    },

    parse: function() {
        var json = Model.prototype.parse.apply(this, arguments);
        json.message = new Message(json.message, { parse: true });
        return json;
    }
});
