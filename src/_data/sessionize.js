const fetch = require('node-fetch');
const scheduler = require('./scheduleBuilder');
const sessionizer = require('./sessionsBuilder');


module.exports = async function() {

    const response = await fetch('https://sessionize.com/api/v2/bm8zoh0m/view/all');
    const sessionize = await response.json();


    const {levels, formats} = buildCategories(sessionize.categories);
    const rooms = buildRooms(sessionize.rooms)
    const speakers = buildSpeakers(sessionize.speakers);
    const sessions = buildSessions(sessionize.sessions, levels, formats);


    const schedule = scheduler.buildSchedule(sessions, rooms, speakers)
    const sessionsByRoom = sessionizer.getSessionsByRoom(sessions)

    return {sessionize, levels, formats, speakers, sessions, schedule, sessionsByRoom};
};

function flattenArrayToObj(array) {
    let object = {};

    for (let item of array) {
        object[item.id] = item;
    }

    return object;
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
