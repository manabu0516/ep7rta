const fetch = require('node-fetch');
const crypto = require('crypto');

const generateWorldCode = (entries) => {
    const result = {};
    entries.forEach(code => {
        result[code] = {
            "code" : code,
            "users": "https://static.smilegatemegaport.com/gameRecord/epic7/epic7_user_" + code + '.json?'
        }
    });
    return result;
};

const convert_dec_data = (data) => {
    return {
        code : data.hero_code,
        ban  : data.ban
    }
};

const convert_battle_info = (data) => {
    const json = JSON.parse("{" + data + '}')["my_team"];
    
    return json.map(d => {
        return {
            code : d.hero_code,
            artifact :d.artifact,
            equip : d.equip
        }
    });
};

const convert_battle_id = (code) => {
    return crypto.createHash('sha256').update(code, 'utf8').digest('hex');
};

const resolveBattleInfo = async(world_code, nick_no) => {

    const url = "https://epic7.gg.onstove.com/gameApi/getBattleList?nick_no="+nick_no+"&world_code="+world_code+"&lang=ja&season_code=";
    
    const response = await fetch(url, {method:'POST',compress: true,redirect: 'follow'});
    const json = await response.json();
    const result = [];

    if(json.result_body.battle_list == null) {
        return result;
    }

    for (let i = 0; i < json.result_body.battle_list.length; i++) {
        const battle = json.result_body.battle_list[i];

        const dec_count = battle.my_deck.hero_list.length + battle.enemy_deck.hero_list.length;
        if(dec_count !== 10) {
            continue;
        }

        result.push({
            battle_id : convert_battle_id(battle.nicknameno + ':' + battle.battleCompletedate),
            nick_no : battle.nicknameno,
            completed : battle.battleCompletedate,
            season_code : battle.season_code,
            grade_code  : {
                my : battle.grade_code,
                enemy : battle.enemy_grade_code
            },
            iswin : battle.iswin,
            battle_turn : battle.turn,
            world_code : {
                my    : world_code,
                enemy : battle.enemy_world_code
            },
            preban_list : {
                my : battle.my_deck.preban_list,
                enemy : battle.enemy_deck.preban_list
            },
            dec_list : {
                my : battle.my_deck.hero_list.map(convert_dec_data),
                enemy : battle.enemy_deck.hero_list.map(convert_dec_data)
            },
            battleInfo : {
                my : convert_battle_info(battle.teamBettleInfo),
                enemy : convert_battle_info(battle.teamBettleInfoenemy)
            },
            firstPick : battle.my_deck.hero_list[0].first_pick
        });
    }

    return result;
};

const resolveUsersInfo = async (world_codes) => {
    const result = [];
    for (let i = 0; i < world_codes.length; i++) {
        const code = world_codes[i];
        (await search(code.users, code.code)).forEach(data => result.push(data));

    }
    return result;
};

const resolveHeroInfo = async() => {
    const response = await fetch("https://static.smilegatemegaport.com/gameRecord/epic7/epic7_hero.json");
    const json = await response.json() 

    const collection = json.ja;
    const data = {};

    collection.forEach(e => {
        data[e.code] = e.name;
    });

    return data;
};

const search = async(url, world_code) => {
    const response = await fetch(url);
    const json = await response.json() 
    const collection = json.users;
    return collection.map(e => {
        return {world_code : world_code, nick_no : e.nick_no};
    });
};

module.exports = {
    WORLD_CODE : generateWorldCode(["world_eu", "world_global", "world_kor", "world_asia", "world_jpn"]),
    resolveUsersInfo : resolveUsersInfo,
    resolveHeroInfo  : resolveHeroInfo,
    resolveBattleInfo: resolveBattleInfo
};
