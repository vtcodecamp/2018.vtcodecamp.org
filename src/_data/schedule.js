
// module.exports = buildSchedule()

function buildSchedule()
{
    let sessionsByTimeSpace = getSessionsByTimeSpace();
    // return sessionsByTimeSpace;


    let speakers  = require('./speakers.json');
    let tracks = require('./tracks.json');
    let spaces = require('./spaces.json');
    let times = require('./timePeriods.json');

    let scheduleTable = {
        head: [],
        body: [],
    };
    scheduleTable.head.push({ title: 'Time', type: 'timespan' });
    for (let space of Object.values(spaces)) {
        let track = tracks[space.track];
        scheduleTable.head.push({
            title: track.title,
            subtitle: space.title,
            type: 'track',
        })
    }
    for (let [timeSlug, rowSessions] of Object.entries(sessionsByTimeSpace)) {
        let tableRow = [];
        let time = times[timeSlug];
        let startTime = getTimeString(time.start);
        let endTime = getTimeString(time.end);
        tableRow.push({
            type: 'timespan',
            title: startTime + "- " + endTime,
            timeSlug: timeSlug,
        })
        for (let session of Object.values(rowSessions)) {
            if (session.space == 'main-hall') {
                type = 'plenumSession';
                title_link = false;
            } else if (session.slug == false) {
                type = 'unscheduled';
                title_link = false;
            } else {
                type = 'session';
                title_link = `/sessions/#${session.slug}`;
            }
            tableCell = {
                type: type,
                title: session.title,
                title_link: title_link,
                speakers: [],
            };
            for (let speakerCode of session.speakers) {
                let speaker = speakers[speakerCode];
                tableCell.speakers.push({
                    name: speaker.firstName + " " + speaker.lastName,
                    link: `/speakers/#${speaker.slug}`,
                });
            }
            tableRow.push(tableCell);
        }
        scheduleTable.body.push(tableRow);
    }
    return scheduleTable;
}

function getSessionsByTimeSpace()
{
    let sessions = require('./sessions.json');
    let spaces = require('./spaces.json');
    
    let sessionsByTimeSpace = {};
    for (let session of Object.values(sessions)) {
        let timeSlug = session.timePeriod;
        let spaceSlug = session.space;
        if (!sessionsByTimeSpace[timeSlug]) {
            sessionsByTimeSpace[timeSlug] = {};
        }
        sessionsByTimeSpace[timeSlug][spaceSlug] = session;
    }

    for (let [timeSlug, timePeriod] of Object.entries(sessionsByTimeSpace)) {
        if (timePeriod['main-hall']) {
            continue;
        }
        for (let key of Object.keys(spaces)) {
            if (!timePeriod[key]) {
                timePeriod[key] = { slug: false, title: false, space: key, timePeriod: timeSlug, speakers: [] }
            }
        }
    }

    let sessionsByTimeSpaceSorted = {};
    for (let [timeCode, spaces] of Object.entries(sessionsByTimeSpace)) {
        let spacesSorted = {};
        Object.keys(spaces).sort().forEach(function (key) {
            spacesSorted[key] = spaces[key];
        });
        sessionsByTimeSpaceSorted[timeCode] = spacesSorted;
    }
    return sessionsByTimeSpaceSorted;
}

function getTimeString(timeString)
{
    let date = new Date(timeString);
    let time = date.toLocaleTimeString('en-US', {
        hour12: true,
        hour: 'numeric',
        minute: 'numeric',
    })
    time = time.replace(' AM', 'am').replace(' PM', 'pm');
    return time;
}