const fetch = require('node-fetch');

module.exports = async function() {

    const response = await fetch('https://sessionize.com/api/v2/bm8zoh0m/view/all');
    const sessionize = await response.json();


    const {levels, formats} = buildCategories(sessionize.categories);
    const rooms = buildRooms(sessionize.rooms)
    const speakers = buildSpeakers(sessionize.speakers);
    const sessions = buildSessions(sessionize.sessions, levels, formats);


    const schedule = buildSchedule(sessions, rooms, speakers)
    const sessionsByRoom = getSessionsByRoom(sessions)

    return {sessionize, levels, formats, speakers, sessions, schedule, sessionsByRoom};
};


function buildSchedule(sessions, rooms, speakers) {

    let timeSlots = getTimeSlots(sessions, rooms);

    let scheduleTable = {
        head: [],
        body: [],
    };
    scheduleTable.head.push({ title: 'Time', type: 'timespan' });

    for (let room of Object.values(rooms)) {
        if (room.id == 2324) {
            continue;
        }
        scheduleTable.head.push({
            title: room.name,
            subtitle: '',
            type: 'track',
        })
    }
    
    for (let [timeCode, timeSlot] of Object.entries(timeSlots)) {
        
        let startTime = getTimeString(timeSlot.info.startsAt);
        let endTime = getTimeString(timeSlot.info.endsAt);
        let tableRow = [];
        tableRow.push({
            type: 'timespan',
            title: startTime + "- " + endTime,
            timeSlug: timeCode,
        })
        let rowSessions = timeSlot.sessionsByRoom;
        for (let session of Object.values(rowSessions)) {
            if (session.isPlenumSession) {
                type = 'plenumSession';
                title_link = false;
            } else if (session.id == false) {
                type = 'unscheduled';
                title_link = false;
            } else {
                type = 'session';
                title_link = `/sessions/#${session.id}`;
            }
            tableCell = {
                type: type,
                title: session.title,
                title_link: title_link,
                speakers: [],
            };
            for (let speakerId of session.speakers) {
                let speaker = speakers[speakerId];
                tableCell.speakers.push({
                    name: speaker.fullName,
                    link: `/speakers/#${speaker.id}`,
                });
            }
            tableRow.push(tableCell);
        }
        scheduleTable.body.push(tableRow);
    }

    return scheduleTable;
}

function getTimeSlots(sessions, rooms) {
    let timeSlots = {};
    for (let session of Object.values(sessions)) {
        let timeCode = getTimeCode(session.startsAt);
        let roomId = session.roomId;
        if (!timeSlots[timeCode]) {
            timeSlots[timeCode] = {
                info: {
                    startsAt: session.startsAt,
                    endsAt: session.endsAt,
                },
                sessionsByRoom: {},
            };
        }
        timeSlots[timeCode].sessionsByRoom[roomId] = session;
    }

    /**
     * Add a blank entry for any missing rooms (unscheduled for given time period).
     * Skip time periods with sessions in the Main Hall (id 2324)
     * since all other rooms are unscheduled at those times.
     */
    for (let [timeCode, timeSlot] of Object.entries(timeSlots)) {
        let sessionsByRoom = timeSlot.sessionsByRoom
        if (sessionsByRoom['2324']) {
            continue;
        }
        for (let key of Object.keys(rooms)) {
            if (!sessionsByRoom[key] && key != 2324) {
                sessionsByRoom[key] = { id: false, title: false, roomId: key, startsAt: timeCode, speakers: [] }
            }
        }
    }

    return timeSlots;
}

function getTimeString(timeString) {
    let date = new Date(timeString);
    let time = date.toLocaleTimeString('en-US', {
        hour12: true,
        hour: 'numeric',
        minute: 'numeric',
    })
    time = time.replace(' AM', 'am').replace(' PM', 'pm');
    return time;
}

function getTimeCode(timeString) {
    let date = new Date(timeString);
    let time = date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
    });
    let id = time.replace(':','');
    return parseInt(id);
}


function buildRooms(roomsArray) {
    let rooms = flattenArrayToObj(roomsArray)
    return rooms
}

function buildCategories(categories) {
    var levels = {};
    var formats = {};

    for (let category of categories) {
        if (category.title == 'Level') {
            for (level of category.items) {
                levels[level.id] = level;
            }
        } else if (category.title == 'Session format') {
            for (format of category.items) {
                formats[format.id] = format;
            }
        }
    }

    return {levels, formats}
}

function buildSpeakers(speakersData) {
    for (let speaker of speakersData) {
        for (let link of speaker.links) {
            link.name = link.title;
            switch (link.linkType) {
                case 'Twitter':
                    link.name = '@' + link.url.replace(/https*:\/\/(www\.)*twitter.com\//gi, '')
                                              .replace(/\/?(\?.*)?$/, '');
                    break;
                case 'Blog':
                case 'Company_Website':
                    link.name = link.url.replace(/https*:\/\/(www\.)*/gi, '')
                                        .replace(/\/?(\?.*)?$/, '')
                                        .replace(/\/.*/, '');
                    break;       
            }
        }
    }

    return flattenArrayToObj(speakersData)
}


function buildSessions(sessionsData, levels, formats) {
    for (let session of sessionsData) {
        for (let categoryId of session.categoryItems) {
            if (categoryId in levels) {
                session.level = levels[categoryId].name;
            } else if (categoryId in formats) {
                session.format = formats[categoryId].name;
            }
        }
    }
    return flattenArrayToObj(sessionsData);
}


function getSessionsByRoom(sessions) {
    let sessionsByRoom = {};
    
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

function getTimeSlotId(timeString) {
    let date = new Date(timeString);
    let time = date.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
    });
    let id = time.replace(':','');
    return parseInt(id);
}

function flattenArrayToObj(array) {
    let object = {};

    for (let item of array) {
        object[item.id] = item;
    }

    return object;
}
