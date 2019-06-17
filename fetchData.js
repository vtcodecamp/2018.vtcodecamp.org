const dotenv = require('dotenv');
const fetch = require('node-fetch');
const Octokit = require('@octokit/rest')

// pull in local .env variables
dotenv.config();

// create github client
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
})

// default params
const PARAMS = {
    owner: "vtcodecamp",
    repo: "2018.vtcodecamp.org",
    branch: "feature/fetch_sync",
    committer: {
      name: "sessionize-bot",
      email: "admin@vtcodecamp.org"
    }
  };
   
module.exports = fetchData();

async function fetchData()
{
    const response = await fetch('https://sessionize.com/api/v2/bm8zoh0m/view/all');
    const sessionize = await response.json();

    const [levels, formats] = parseCategories(sessionize.categories);
    const speakers = buildSpeakers(sessionize.speakers);
    const sessions = buildSessions(sessionize.sessions, levels, formats);

    await writeDataFile('sessions.json', sessions);
    await writeDataFile('speakers.json', speakers);
    await writeDataFile('rooms.json', sessionize.rooms);
}


function parseCategories(categories) {
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

    return [levels, formats]
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

    return speakersData
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
    return sessionsData;
}


async function writeDataFile(filename, array) {

    let data = flattenArrayToObj(array) 
    let filePath = `src/_data/${filename}`;
    let content = JSON.stringify(data, null, 4);

    const readFileParams = {
        ...PARAMS,
        path: filePath,
    }

    // READ file
    const file = await octokit.repos.getContents(readFileParams)

    const writeFileParams = {
        ...PARAMS,
        path: filePath,
        sha: file.data.sha || "",
        message: "Update sessionize data.",
        content: Buffer.from(content).toString('base64')
    }
    
    // WRITE file
    await octokit.repos.createOrUpdateFile(writeFileParams)

}

function flattenArrayToObj(array) {
    let object = {};

    for (let item of array) {
        object[item.id] = item;
    }

    return object;
}