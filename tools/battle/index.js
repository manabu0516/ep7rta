

const fetch = require('node-fetch');
const sqlite3 = require("sqlite3");
const pathUtil = require('path');
const crypto = require('crypto');
const fs = require('fs').promises;

const searchData = async (world_code, nick_no) => {
    const result = [];

    const url = "https://epic7.gg.onstove.com/gameApi/getBattleList?nick_no="+nick_no+"&world_code="+world_code+"&lang=ja&season_code=";
    const response = await fetch(url, {method:'POST'});
    const json = await response.json() 

    if(json.result_body.battle_list == null) {
        return result;
    }

    for (let i = 0; i < json.result_body.battle_list.length; i++) {
        const battle = json.result_body.battle_list[i];

        const data = {
            season_code         : battle.season_code,
            grade_code          : battle.grade_code,
            battle_id           : battle_id(battle.nicknameno + ':' + battle.battle_day),
            battle_result       : battle.iswin === 1 ? 'win' : 'loose',
            my_dec_code         : dec_code(battle.my_deck.hero_list),
            enemy_dec_code      : dec_code(battle.enemy_deck.hero_list),
            first_pick          : first_pick(battle.my_deck.hero_list),
            m_dec               : dec_data(battle.my_deck.hero_list),
            e_dec               : dec_data(battle.enemy_deck.hero_list),
            m_preban            : battle.my_deck.preban_list.join(':'),
            e_preban            : battle.enemy_deck.preban_list.join(':')
        };

        result.push(data);
    }

    return result;
};

const battle_id = (code) => {
    return crypto.createHash('sha256').update(code, 'utf8').digest('hex');
};

const first_pick = (dec) => {
    return dec.filter(e => e.first_pick).length == 1;
}

const dec_code =(dec) => {
    return dec.filter(e => e.ban === 0).map(e => e.hero_code).sort().join(':');
};

const dec_data = (dec) => {
    return dec.map(e => e.hero_code).join(':');
};

const battleToQuery = (battle) => {
    return ""
        + "("
        + "'" +battle.battle_id+ "'" + ","
        + "'" +battle.season_code+ "'" + ","
        + "'" +battle.grade_code+ "'" + ","
        + "'" +battle.battle_result+ "'" + ","
        + "'" +battle.my_dec_code+ "'" + ","
        + "'" +battle.enemy_dec_code+ "'" + ","
        + "'" +battle.first_pick+ "'" + ","
        + "'" +battle.m_dec+ "'" + ","
        + "'" +battle.e_dec+ "'" + ","
        + "'" +battle.m_preban+ "'" + ","
        + "'" +battle.e_preban+ "'"
        + ")"; 
};

const run = async() => {
    const targets = JSON.parse(await fs.readFile('./database/users.json', 'utf8'));

    const db = new sqlite3.Database("./database/battles.db");
    db.serialize(() => {
        db.run("drop table if exists battles");
        db.run("create table if not exists battles(battle_id text primary key,season_code,grade_code,battle_result,my_dec_code,enemy_dec_code,first_pick,m_dec,e_dec,m_preban,e_preban)");
    });


    for (let i = 0; i < targets.length; i++) {
        const user = targets[i];
        console.log(user.world_code + ':' + user.nick_no + '('+i+'/'+targets.length+')' );
        
        const collection = await searchData(user.world_code, user.nick_no);
        db.serialize(() => {
            for (let l = 0; l < collection.length; l++) {
                const battle = collection[l];
                const query = battleToQuery(battle);
                db.run("insert into battles (battle_id,season_code,grade_code,battle_result,my_dec_code,enemy_dec_code,first_pick,m_dec,e_dec,m_preban,e_preban) values " + query + 'on conflict (battle_id) do nothing;');
            }
        });
    }

    db.close();
};

run();