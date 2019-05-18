
module.exports = getSessionsBySpace();

function getSessionsBySpace()
{
    let sessionsBySpace = {};
    let sessions = require('./sessions.json');
    for (let session of Object.values(sessions)) {
        if (!session.track) {
            continue;
        }
        let spaceId = session.space;
        if (!sessionsBySpace[spaceId]) {
            sessionsBySpace[spaceId] = {};
        }
        let timeCode = parseInt(session.timePeriod);
        sessionsBySpace[spaceId][timeCode] = session;
    }
    let sessionsBySpaceSorted = {};
    Object.keys(sessionsBySpace).sort().forEach(function(key) {
        sessionsBySpaceSorted[key] = sessionsBySpace[key];
    });    
    return sessionsBySpaceSorted;
}
