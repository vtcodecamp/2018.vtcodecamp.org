"use strict";

module.exports = function(data) {
    var stringify = JSON.stringify(data.sessionize, null, 2)
    return `<pre>${stringify}</pre>`;
};