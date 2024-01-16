// https://discord.com/api/oauth2/authorize?client_id=1035058107899981854&permissions=3072&scope=bot

const fs = require('fs').promises;
const sqlite3 = require("sqlite3");

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
            const result = await commandInvoke(context);
            return interaction.replied || interaction.deferred ? await interaction.followUp(result) : interaction.reply(result);
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
    const db = new sqlite3.Database("./database/battles.db");

    const discordToken = await fs.readFile('./discrod.token', 'utf8');
    const discordManager = await initializeDiscord(discordToken);

    discordManager.on('ep7-rta-battle', async (context) => {
        const unitsParam = context.options.get("units");
        const rankParam = context.options.get("rank");

        const unitsValue = unitsParam != null ? unitsParam. value : '';
        const rankValue = rankParam != null ? rankParam. value : '';

        const searchCode = unitsValue.split(":").sort().join();
        const searchResult = searchData(searchCode, rankValue);
        const battleMap = getBattleData(searchResult);

        console.log(battleMap);

        return 'Todo Command';
    });
};

const getBattleData = (searchResult) => {
    const battleMap = {};
    for (let i = 0; i < searchResult.length; i++) {
        const r = searchResult[i];
        const key = r.my_dec_code;
        
        if(battleMap[key] == undefined) {
            battleMap[key] = {key : key, win : 0, lose : 0};
        }

        if(r.battle_result === 'win') {
            battleMap[key].win += 1;
        } else {
            battleMap[key].lose += 1;
        }
    }
    return battleMap;
};

const searchData = async(searchCode, rankValue, db) => {
    const defaultRankValue = '"legend","emperor","champion","challenger","master","gold","silver"';
    const rankValueQueryData = {
        'legend'    : 'legend',
        'emperor'   : '"legend","emperor"',
        'champion'  : '"legend","emperor","champion"',
        'challenger': '"legend","emperor","champion","challenger"',
        'master'    : '"legend","emperor","champion","challenger","master"'
    };
    const rankValueQuery = rankValueQueryData[rankValue] === undefined ? defaultRankValue : rankValueQueryData[rankValue];

    return new Promise((resolve, reject) => {
        const sql = 'SELECT '
            + 'battle_id,season_code,grade_code,battle_result,my_dec_code,enemy_dec_code,first_pick,m_dec,e_dec,m_preban,e_preban '
            + 'FROM battles WHERE '
            + 'enemy_dec_code = ? AND '+
            + 'grade_code in ('+rankValueQuery+')';

        db.all(sql, [searchCode], (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
};

run();
