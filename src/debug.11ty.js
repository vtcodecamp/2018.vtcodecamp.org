"use strict";

module.exports = function(data) {
    var stringify = JSON.stringify({
        schedule: data.schedule,
        sessions: data.sessions,
        sessionsByRoom: data.sessionsByRoom,
        speakers: data.speakers,
        rooms: data.rooms,
    }, null, 2)
    return `<pre>${stringify}</pre>`;
};