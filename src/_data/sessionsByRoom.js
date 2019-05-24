
module.exports = getSessionsByRoom();

function getSessionsByRoom()
{
    let sessionsByRoom = {};
    let sessions = require('./sessions.json');
    for (let session of Object.values(sessions)) {
        if (session.isPlenumSession) {
            continue;
        }
        let roomId = session.roomId;
        if (!sessionsByRoom[roomId]) {
            sessionsByRoom[roomId] = {};
        }
        let timeCode = getTimeSlotId(session.startsAt);
        sessionsByRoom[roomId][timeCode] = session;
    }
    let sessionsByRoomSorted = {};
    Object.keys(sessionsByRoom).sort().forEach(function(key) {
        sessionsByRoomSorted[key] = sessionsByRoom[key];
    });    
    return sessionsByRoomSorted;
}

function getTimeSlotId(timeString)
{
    let date = new Date(timeString);
    let time = date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
    });
    let id = time.replace(':','');
    return parseInt(id);
}