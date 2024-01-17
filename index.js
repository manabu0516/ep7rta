// https://discord.com/api/oauth2/authorize?client_id=1035058107899981854&permissions=3072&scope=bot

const fs = require('fs').promises;
const mysql = require("mysql2/promise");

const initializeDiscord = (token) => {
    const Discord = require("discord.js");
    
    const client = new Discord.Client({
        intents: 0
    });

    const handler = {};
    const instance = {};

    instance.on = (command, hander) => {
        handler[command] = hander;
    };
    instance._client = client;

    const embdedMessage = () => new Discord.EmbedBuilder().setFooter({ text: "©️fmnb0516 | ep7rta"}).setTimestamp();

    client.on("interactionCreate", async (interaction) => {
        try {
            if (interaction.isCommand() === false) {
                return;
            }    
            const commandName = interaction.commandName;
            
            const commandInvoke =handler[commandName];
    
            const context = {
                embdedMessage : embdedMessage,
                author : interaction.member.displayName,
                guild  : "",
                options: interaction.options,
                locale : interaction.locale,
                deffer : async () => await interaction.deferReply()
            };
    
            if(commandInvoke === undefined) {
                interaction.reply("not found command");
                return;
            }
            const response = await commandInvoke(context);
            const message = interaction.replied || interaction.deferred ? async (msg, option) => await interaction.followUp(msg, option) : (msg, option) => interaction.reply(msg, option);
            await response(message);
        } catch(e) {
            return interaction.replied || interaction.deferred ? await interaction.followUp("error :" + e) : interaction.reply("error : "+e);
        }
        
    });
    
    client.login(token);

    return new Promise((resolve, reject) => {
        client.on("ready", () => {
            console.log("start.");
            resolve(instance);
        });
    });
};

const run = async () => {
    const mysqlConfig = (await fs.readFile('./mysql.configure', 'utf8')).split("\r\n");
    const db = await mysql.createConnection({
        user: mysqlConfig[0],
        host: mysqlConfig[1],
        password: mysqlConfig[2],
        database: mysqlConfig[3],
        port: parseInt(mysqlConfig[4]),
    });

    const heroData = JSON.parse(await fs.readFile('./database/heros.json', 'utf8'));

    //const searchCode = 'c2019:c2073:c2074:c2089';
    //const result = await do_ep7_rta_battle(db, heroData, searchCode, '');

    //select my_dec_code,enemy_dec_code, count(*) as cnt from battles group by my_dec_code,enemy_dec_code order by cnt desc limit 10;

    const discordToken = await fs.readFile('./discrod.token', 'utf8');
    const discordManager = await initializeDiscord(discordToken);

    discordManager.on('ep7-rta-code', async (context) => {
        const result = [];

        const nameParam = context.options.get("name");
        const searchValue = nameParam != null ? nameParam. value : '';

        const keys = Object.keys(heroData);
        keys.forEach(k => {
            const name = heroData[k];
            if(name.indexOf(searchValue) !== -1) {
                result.push('* ' + k + ' : ' + name);
            }
        });

        return async (message) => {
            const text = result.length === 0 ? 'not found' : result.join("\r\n");
            await message(text);
        }
    });

    discordManager.on('ep7-rta-battle', async (context) => {
        const unitsParam = context.options.get("units");
        const rankParam = context.options.get("rank");

        const unitsValue = unitsParam != null ? unitsParam. value : '';
        const rankValue = rankParam != null ? rankParam. value : '';

        await context.deffer();

        const searchCode = unitsValue.split(":").sort().join(':');
        const result = await do_ep7_rta_battle(db, heroData, searchCode, rankValue);
        
        return async (message) => {
            await message('**[対象編成]**' + '\r\n' + result.seachParam.map(e => e.e_name).join(' : '));

            const messages = [];
            for (let i = 0; i < result.calcResult.length; i++) {
                const element = result.calcResult[i];

                const text = ''
                    + '**[勝利編成]**' + '\r\n'
                    + element.e1_name + ' : ' + element.e2_name + ' : ' + element.e3_name + ' : ' + element.e4_name + '\r\n'
                    + '[' + element.win_count + '/' + (element.win_count + element. lose_count) + 'win : rate:' + element.win_rate + '%]' + ' '
                    + '[詳細](https://manabu0516.github.io/ep7rta/result.html?json=' + encodeURIComponent(JSON.stringify(element.result))+')';
                await message(text);
            }
        };
    });
};

const do_ep7_rta_battle = async(db, heroData, unitsValue, rankValue) => {
    const RANK_TARGETS_DEFAULT= ['legend','emperor','champion','challenger','master','gold','silver','bronze'];
    const RANK_TARGETS_MAP = {
        'legend' : ['legend'],
        'emperor': ['legend','emperor'],
        'champion': ['legend','emperor','champion'],
        'challenger' : ['legend','emperor','champion','challenger'],
        'master' : ['legend','emperor','champion','challenger','master']
    };
    const rankFilter = RANK_TARGETS_MAP[rankValue] ? RANK_TARGETS_MAP[rankValue] : RANK_TARGETS_DEFAULT;
    const searchResult = (await searchData(unitsValue, '', db)).filter(e => {
        return rankFilter.indexOf(e.grade_code) !== -1;
    });

    const battleMap = getBattleData(searchResult);

    const winData = Object.keys(battleMap).map(k => battleMap[k]).filter(e => e.win > 0);
    winData.sort(sortBattleData);

    const size = winData.length > 5 ? 5 : winData.length;
    const splitData = winData.slice(0, size);

    const calcResult = splitData.map(e => {
        const entry = e.key.split(':');

        return {
            e1_code : entry[0],
            e1_name : heroData[entry[0]],
            e2_code : entry[1],
            e2_name : heroData[entry[1]],
            e3_code : entry[2],
            e3_name : heroData[entry[2]],
            e4_code : entry[3],
            e4_name : heroData[entry[3]],
            win_count : e.win,
            lose_count: e.lose,
            win_rate: Math.floor(e.win / (e.win + e.lose) * 100),
            result  : e.result,
        };
    });

    const seachParam = unitsValue.split(':').map(e => {
        return {e_code : e, e_name : heroData[e]}; 
    });

    return {seachParam:seachParam, calcResult:calcResult};
};

const sortBattleData = (a, b) => {
    const diffWin = b.win - a.win;

    const aRate = Math.floor(a.win / (a.win + a.lose) * 100);
    const bRate = Math.floor(b.win / (b.win + b.lose) * 100);

    const aGame = a.win + a.lose;
    const bGame = b.win + b.lose;

    const diffRate = bRate - aRate;
    const gameDiff = bGame - aGame; 

    return diffWin !== 0 ? diffWin : (diffRate !== 0 ? diffRate : gameDiff);
};

const getBattleData = (searchResult) => {
    const battleMap = {};
    for (let i = 0; i < searchResult.length; i++) {
        const r = searchResult[i];
        const key = r.my_dec_code;
        
        if(battleMap[key] == undefined) {
            battleMap[key] = {key : key, win : 0, lose : 0, result : []};
        }

        if(r.battle_result === 'win') {
            battleMap[key].win += 1;
        } else {
            battleMap[key].lose += 1;
        }
        battleMap[key].result.push(r);
    }
    return battleMap;
};

const searchData = async(searchCode, rankValue, db) => {
    const query = 'SELECT '
            + 'battle_id,season_code,grade_code,battle_result,my_dec_code,enemy_dec_code,first_pick,m_dec,e_dec,m_preban,e_preban '
            + 'FROM battles WHERE '
            + 'enemy_dec_code = ?';
    const [rows, fields] = await db.query(query, searchCode);

    return rows;
};

run();
