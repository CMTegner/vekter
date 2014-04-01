var Collection = require('backbone').Collection;

module.exports = Collection.extend({
    model: require('./../models/User.js')
});
