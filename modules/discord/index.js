/*
const { Client, ApplicationCommandOptionType } = require("discord.js");
const fs = require('fs').promises;

const commands = {};

commands ["ep7-rta-battle"] = {
    name : "ep7-rta-battle",
    description : "Search and display formations with a high number of wins and high win rate for the input formation.",
    description_localizations : {
        "en-US" : "Search and display formations with a high number of wins and high win rate for the input formation.",
        "zh-CN" : "Search and display formations with a high number of wins and high win rate for the input formation.",
        "ko" : "Search and display formations with a high number of wins and high win rate for the input formation.",
        "ja" : "入力された編成に対して勝利数、勝率が高い編成を検索して表示します。"
    },

    options : [
        {
            type: 3,
            name: "units",
            description: "Specify the organization you want to search.",
            description_localizations : {
                "en-US" : "Specify the organization you want to search.",
                "zh-CN" : "Specify the organization you want to search.",
                "ko" : "Specify the organization you want to search.",
                "ja" : "検索したい編成を指定します。(英雄ごとにコード値を4体分[:]区切りで指定します。)"
            },
            required : true
        },
        {
            type: 3,
            name: "rank",
            description: "Indicates the rank range of the target battle.",
            description_localizations : {
                "en-US" : "Indicates the rank range of the target battle.",
                "zh-CN" : "Indicates the rank range of the target battle.",
                "ko" : "Indicates the rank range of the target battle.",
                "ja" : "対象とするバトルのランク帯をしていします。"
            },
            required : false,
            choices: [
                { name: "legend", value: "legend" },
                { name: "emperor", value: "emperor" },
                { name: "champion", value: "champion" },
                { name: "challenger", value: "challenger" },
                { name: "master", value: "master" },
            ]
        },
        {
            type: 3,
            name: "count",
            description: "Specify the display block (1-10)",
            description_localizations : {
                "en-US" : "Specify the display block (1-10)",
                "zh-CN" : "Specify the display block (1-10)",
                "ko" : "Specify the display block (1-10)",
                "ja" : "表示件数を指定します(1-10まで)"
            },
            required : false
        },
        {
            type: 3,
            name: "exclude",
            description: "Specify the heroes you want to excel from the search results, separated by [:].",
            description_localizations : {
                "en-US" : "Specify the heroes you want to excel from the search results, separated by [:].",
                "zh-CN" : "Specify the heroes you want to excel from the search results, separated by [:].",
                "ko" : "Specify the heroes you want to excel from the search results, separated by [:].",
                "ja" : "検索結果から除外したい英雄を[:]区切りで指定します。"
            },
            required : false
        },
    ]
};

commands ["ep7-rta-pic"] = {
    name : "ep7-rta-pic",
    description : "Search for popular heroes in the following selections.",
    description_localizations : {
        "en-US" : "Search for popular heroes in the following selections.",
        "zh-CN" : "Search for popular heroes in the following selections.",
        "ko" : "Search for popular heroes in the following selections.",
        "ja" : "次の選択でよく選ばれている英雄を検索します。"
    },

    options : [
        {
            type: 3,
            name: "m_units",
            description: "Specify the selection state of your hero.",
            description_localizations : {
                "en-US" : "Specify the selection state of your hero.",
                "zh-CN" : "Specify the selection state of your hero.",
                "ko" : "Specify the selection state of your hero.",
                "ja" : "自身の英雄の選択状態を指定します。(英雄ごとにコード値を4体分まで[:]区切りで指定します。)"
            },
            required : true
        },
        {
            type: 3,
            name: "e_units",
            description: "Specifies the selection state of the opponent's hero.",
            description_localizations : {
                "en-US" : "Specifies the selection state of the opponent's hero.",
                "zh-CN" : "Specifies the selection state of the opponent's hero.",
                "ko" : "Specifies the selection state of the opponent's hero.",
                "ja" : "相手の英雄の選択状態を指定します。(英雄ごとにコード値を5体分まで[:]区切りで指定します。)"
            },
            required : true
        },
        {
            type: 3,
            name: "rank",
            description: "Indicates the rank range of the target battle.",
            description_localizations : {
                "en-US" : "Indicates the rank range of the target battle.",
                "zh-CN" : "Indicates the rank range of the target battle.",
                "ko" : "Indicates the rank range of the target battle.",
                "ja" : "対象とするバトルのランク帯をしていします。"
            },
            required : false,
            choices: [
                { name: "legend", value: "legend" },
                { name: "emperor", value: "emperor" },
                { name: "champion", value: "champion" },
                { name: "challenger", value: "challenger" },
                { name: "master", value: "master" },
            ]
        },
        {
            type: 3,
            name: "count",
            description: "Specify the display block (1-10)",
            description_localizations : {
                "en-US" : "Specify the display block (1-10)",
                "zh-CN" : "Specify the display block (1-10)",
                "ko" : "Specify the display block (1-10)",
                "ja" : "表示件数を指定します(1-10まで)"
            },
            required : false
        },
    ]
};

commands ["ep7-rta-code"] = {
    name : "ep7-rta-code",
    description : "A code corresponding to the entered hero name will be published.",
    description_localizations : {
        "en-US" : "A code corresponding to the entered hero name will be published.",
        "zh-CN" : "A code corresponding to the entered hero name will be published.",
        "ko" : "A code corresponding to the entered hero name will be published.",
        "ja" : "入力された英雄名に対応するコードを返却します。(部分一致)"
    },

    options : [
        {
            type: 3,
            name: "name",
            description: "Name of the hero whose code you want to check (partial match)",
            description_localizations : {
                "en-US" : "Name of the hero whose code you want to check (partial match)",
                "zh-CN" : "Name of the hero whose code you want to check (partial match)",
                "ko" : "Name of the hero whose code you want to check (partial match)",
                "ja" : "コードを調べたい英雄の名前(部分一致)"
            },
            required : true
        }
    ]
};

const run = async () => {
    const token = await fs.readFile('./discrod.token', 'utf8');
    const client = new Client({intents: 0});
    client.once("ready", async () => {
        console.log("ready");
        await client.application.commands.set([
            commands["ep7-rta-battle"],
            commands ["ep7-rta-pic"],
            commands ["ep7-rta-code"],
        ]);

        console.log("complete");
    });
    client.login(token);
};

run();

const fs = require('fs').promises;
const mysql = require("mysql2/promise");

const logger = (msg, parameter) => {
    console.log(msg + (parameter ? ' :' + JSON.stringify(parameter) : ''));
};

const initializeDiscord = (token) => {
    const Discord = require("discord.js");
    
    const client = new Discord.Client({
        intents: [Discord.GatewayIntentBits.Guilds], partials: [Discord.Partials.Channel]
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

            logger('initialize commadn ' + commandName, 
                [interaction.guild ? interaction.guild.name : '',
                interaction.member ? interaction.member.displayName : '']);
    
            const context = {
                embdedMessage : embdedMessage,
                author : interaction.member ? interaction.member.displayName : '',
                guild  : interaction.guild ? interaction.guild.name : '',
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
            await response(message, interaction);
        } catch(e) {
            logger('error', e);
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
    const mysqlConfig = (await fs.readFile('./mysql.configure', 'utf8')).split("\n").map(e => e.trim());
    const db = await mysql.createPool({
        connectionLimit : 5,
        user: mysqlConfig[0],
        host: mysqlConfig[1],
        password: mysqlConfig[2],
        database: mysqlConfig[3],
        port: parseInt(mysqlConfig[4]),
    });

    const heroData = JSON.parse(await fs.readFile('./database/heros.json', 'utf8'));

    const discordToken = (await fs.readFile('./discrod.token', 'utf8')).trim();
    const discordManager = await initializeDiscord(discordToken);

    discordManager.on('ep7-rta-code', async (context) => {
        const result = [];

        const nameParam = context.options.get("name");
        const searchValue = nameParam != null ? nameParam. value : '';

        logger('ep7-rta-code', [nameParam,searchValue]);

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
        const countParam = context.options.get("count");

        const unitsValue = unitsParam !== null ? unitsParam.value.trim() : '';
        const rankValue = rankParam !== null ? rankParam.value : '';
        const countValue = intValue(countParam !== null ? countParam.value : '3', 3, 10);
        
        logger('ep7-rta-battle', [unitsValue,rankValue,countValue]);

        await context.deffer();

        const searchCode = unitsValue.split(":").sort().join(':');
        const result = await do_ep7_rta_battle(db, heroData, searchCode, rankValue, countValue);
        
        return async (message) => {
            const result1 = await message('**[対象編成]**' + '\r\n' + result.seachParam.map(e => e.e_name).join(' : '));
            const thread = await result1.startThread({
                name: searchCode + ' result',
                autoArchiveDuration: 60
            });
            
            for (let i = 0; i < result.calcResult.length; i++) {
                const element = result.calcResult[i];

                // for slim
                element.result.forEach(e => {e.battle_id = '';});
                
                const battleResults = splitArray(element.result, 3);
                const text = ''
                    + '----------' + '\r\n'
                    + '**[勝利編成'+(i+1)+']**' + '\r\n'
                    + element.e1_name + ' : ' + element.e2_name + ' : ' + element.e3_name + ' : ' + element.e4_name + '\r\n'
                    + '[' + element.win_count + '/' + (element.win_count + element. lose_count) + 'win : rate:' + element.win_rate + '%]' + '\r\n'
                
                await thread.send(text);
                for (let l = 0; l < battleResults.length; l++) {
                    await thread.send('[詳細'+(l+1)+'](https://manabu0516.github.io/ep7rta/result.html?json=' + encodeURIComponent(JSON.stringify(battleResults[l]))+')');
                }
                await thread.send('----------');
            }

            await thread.send('fin');
        };
    });

    discordManager.on('ep7-rta-pic', async (context) => {
        const m_unitsParam = context.options.get("m_units");
        const e_unitsParam = context.options.get("e_units");
        const rankParam = context.options.get("rank");
        const countParam = context.options.get("count");

        const m_unitsValue = m_unitsParam !== null ? m_unitsParam.value.trim() : '';
        const e_unitsValue = e_unitsParam !== null ? e_unitsParam.value.trim() : '';

        const rankValue = rankParam !== null ? rankParam.value : '';
        const countValue = intValue(countParam !== null ? countParam.value : '3', 3, 10);

        logger('ep7-rta-pic', [m_unitsValue,e_unitsValue,rankValue,countValue]);

        await context.deffer();

        const entries1 = m_unitsValue.split(":");
        const entries2 = e_unitsValue.split(':');

        if(entries2.length < 1 || entries2 > 5 || entries1.length < 1 || entries1.length > 4
                || entries2.length < entries1.length || (entries2.length-entries1.length) > 1) {
            return async (message) => await message('パラメータ不正です');
        }

        const result = await do_ep7_rta_pic(db, heroData, entries1, entries2, rankValue, countValue);

        return async (message) => {
            
            const dataText = result.map(e => {
                const countText =  ( '    ' + e.count ).slice( -4 );
                return '* ' + countText + '回 : '+ heroData[e.code] + ' (' +(e.code) + ')';
            }).join('\r\n');

            const e1text = entries1.map(e => '* '+ heroData[e]).join("\r\n");
            const e2text = entries2.map(e => '* '+ heroData[e]).join("\r\n");
            
            const enbded = context.embdedMessage()
                .addFields({ name: 'next pic', value: dataText === '' ? 'not found' : dataText, inline: false })
                .addFields({ name: 'my pic', value: e1text, inline: true })
                .addFields({ name: 'enemy pic', value: e2text, inline: true })
            await message({ embeds: [enbded] });
        };
    });
};

const splitArray = (array, number) => {
    const length = Math.ceil(array.length / number);
    return new Array(length)
        .fill()
        .map((_, i) => array.slice(i * number, (i + 1) * number));
};

const intValue = (v, def, max) => {
    try {
        const ret = parseInt(v);
        return ret > 0 && ret <=max ? ret : def; 
    } catch(e) {
        return def;
    }
};

const do_ep7_rta_pic = async(db, heroData, entries1,entries2, rankValue, countValue) => {
    const RANK_TARGETS_DEFAULT= ['legend','emperor','champion','challenger','master','gold','silver','bronze'];
    const RANK_TARGETS_MAP = {
        'legend' : ['legend'],
        'emperor': ['legend','emperor'],
        'champion': ['legend','emperor','champion'],
        'challenger' : ['legend','emperor','champion','challenger'],
        'master' : ['legend','emperor','champion','challenger','master']
    };
    const rankFilter = RANK_TARGETS_MAP[rankValue] ? RANK_TARGETS_MAP[rankValue] : RANK_TARGETS_DEFAULT;

    const selectQuery = 'SELECT '
        + 'battle_id,season_code,grade_code,battle_result,my_dec_code,enemy_dec_code,first_pick,m_dec,e_dec,m_preban,e_preban,'
        + 'm_pic1,m_pic2,m_pic3,m_pic4,m_pic5,e_pic1,e_pic2,e_pic3,e_pic4,e_pic5 '
        + 'FROM battles WHERE ';

    const conditions = [];
    for (let i = 0; i < entries1.length; i++) {
        const e = entries1[i];
        const idx = i+1;
        conditions.push(' m_pic' + idx + '="' +e+ '" ' )
    }
    for (let i = 0; i < entries2.length; i++) {
        const e = entries2[i];
        const idx = i+1;
        conditions.push(' e_pic' + idx + '="' +e+ '" ' )
    }

    const [rows, fields] = await db.query(selectQuery + conditions.join(' AND '));

    const filterdData = rows.filter(e => {
        return rankFilter.indexOf(e.grade_code) !== -1;
    });

    const seachIndex = entries1.length+1;
    const resultMap = {};

    filterdData.forEach(data => {
        const code = data['m_pic' + seachIndex];
        if(code === undefined || code === null || code.trim() === '') {
            return;
        }
        if(resultMap[code] === undefined) {
            resultMap[code] = {code:code, count:0};
        }
        resultMap[code].count += 1;
    });

    const resultData = Object.keys(resultMap).map(k => resultMap[k]);
    resultData.sort((a, b) => {
        return b.count - a.count;
    });

    const size = resultData.length > countValue ? countValue : resultData.length;
    const splitData = resultData.slice(0, size);

    return splitData;
};

const do_ep7_rta_battle = async(db, heroData, unitsValue, rankValue, countValue) => {
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

    const size = winData.length > countValue ? countValue : winData.length;
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
*/