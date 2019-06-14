
module.exports = {
    buildSchedule, 
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
