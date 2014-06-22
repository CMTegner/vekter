/**
 * Create a message entry key.
 *
 * @param {String} user the remote user id
 * @param {String} [date] ISO timestamp, the current time will be used if omitted
 * @returns {String} the key, e.g. 'christian☃2014-03-30T10:46:51.747Z'
 */
module.exports = function(user, date) {
    date = date || new Date().toISOString();
    return user + '☃' + date;
};
