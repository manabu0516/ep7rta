
const fetch = require('node-fetch');
const fs = require('fs').promises;

const run = async () => {

    const response = await fetch("https://static.smilegatemegaport.com/gameRecord/epic7/epic7_hero.json?_=1705381008195");
    const json = await response.json() 

    const collection = json.ja;
    const data = {};

    collection.forEach(e => {
        data[e.code] = e.name;
    });

    const output = JSON.stringify(data, null , "\t");
    await fs.writeFile('./database/heros.json', output);
};

run();