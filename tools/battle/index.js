

const fetch = require('node-fetch');
const mysql = require("mysql2/promise");
const crypto = require('crypto');
const fs = require('fs').promises;

const searchData = async (world_code, nick_no) => {
    const result = [];

    const url = "https://epic7.gg.onstove.com/gameApi/getBattleList?nick_no="+nick_no+"&world_code="+world_code+"&lang=ja&season_code=";
    const json = await callRequest(url, {method:'POST'});

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

const callRequest = async (url ,opt) => {
    const errors = [];
    for (let i = 0; i < 5; i++) {
        try {
            const response = await fetch(url, {method:'POST'});
            return await response.json();
        } catch(e) {
            errors.push(e);
        }
    }
    throw e;
}

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

const emptyValue = (v) => {
    return v === undefined || v === null ? '' : v.trim();
};

const battleToQuery = (battle) => {
    const m_entries = battle.m_dec.split(':');
    const e_entries = battle.e_dec.split(':');

    return [
        battle.battle_id,
        battle.season_code,
        battle.grade_code,
        battle.battle_result,
        battle.my_dec_code,
        battle.enemy_dec_code,
        battle.first_pick ? 1: 0,
        battle.m_dec,
        battle.e_dec,
        battle.m_preban,
        battle.e_preban,
        emptyValue(m_entries[0]),
        emptyValue(m_entries[1]),
        emptyValue(m_entries[2]),
        emptyValue(m_entries[3]),
        emptyValue(m_entries[4]),
        emptyValue(e_entries[0]),
        emptyValue(e_entries[1]),
        emptyValue(e_entries[2]),
        emptyValue(e_entries[3]),
        emptyValue(e_entries[4]),
    ];
};

const run = async() => {
    const targets = JSON.parse(await fs.readFile('./database/users.json', 'utf8'));
    const mysqlConfig = (await fs.readFile('./mysql.configure', 'utf8')).split("\r\n");

    const db = await mysql.createConnection({
        user: mysqlConfig[0],
        host: mysqlConfig[1],
        password: mysqlConfig[2],
        database: mysqlConfig[3],
        port: parseInt(mysqlConfig[4]),
    });

    const skip = skipHandler('');

    for (let i = 0; i < targets.length; i++) {
        const user = targets[i];

        console.log(user.world_code + ':' + user.nick_no + '('+i+'/'+targets.length+')' );

        if(skip(user.nick_no) === false) {
            continue;
        }
        
        const collection = await searchData(user.world_code, user.nick_no);
        for (let l = 0; l < collection.length; l++) {
            const battle = collection[l];
            const values = battleToQuery(battle);
            await db.query('insert ignore into battles'
                + '(battle_id,season_code,grade_code,battle_result,my_dec_code,enemy_dec_code,first_pick,m_dec,e_dec,m_preban,e_preban,m_pic1,m_pic2,m_pic3,m_pic4,m_pic5,e_pic1,e_pic2,e_pic3,e_pic4,e_pic5)'
                + ' values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', values,);
        }
    }
};

const skipHandler = (nickno) => {
    const context = {target:nickno, check : false};
    return nickno === '' ? () => true : (code) => {
        if(context.check === true) {
            return true;
        }
        if(code === context.target) {
            context.check = true;
            return true;
        }
        return false;
    };
};

run();