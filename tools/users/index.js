const fetch = require('node-fetch');
const pathUtil = require('path');
const fs = require('fs').promises;

const user_urls = [
    'https://static.smilegatemegaport.com/gameRecord/epic7/epic7_user_world_eu.json?_=1705375766818',
    'https://static.smilegatemegaport.com/gameRecord/epic7/epic7_user_world_global.json?_=1705375766818',
    'https://static.smilegatemegaport.com/gameRecord/epic7/epic7_user_world_kor.json?_=1705375766818',
    'https://static.smilegatemegaport.com/gameRecord/epic7/epic7_user_world_asia.json?_=1705375766818',
    'https://static.smilegatemegaport.com/gameRecord/epic7/epic7_user_world_jpn.json?_=1705375766818'
];

const run = async () => {
    let results = [];
    for (let i = 0; i < user_urls.length; i++) {
        const u = user_urls[i];
        const d = divcode(u);
        const collection = await search(u, d);
        results = results.concat(collection);
    }

    const output = JSON.stringify(results, null , "\t");
    await fs.writeFile('./database/users.json', output);
};

const divcode = (u) => {
    const name1 = pathUtil.basename(u);
    const name2 = name1.substring(0, name1.indexOf('?'));
    const name3 = name2.replaceAll('epic7_user_', '');
    const name4 = name3.replaceAll('.json', '');
    return name4;
};

const search = async(url, world_code) => {
    const response = await fetch(url);
    const json = await response.json() 
    const collection = json.users;
    return collection.map(e => {
        return {world_code : world_code, nick_no : e.nick_no};
    });
};

run();