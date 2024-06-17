const mysql = require("mysql2/promise");
const fs = require('fs').promises;

const insert_sql = "insert ignore into battles ("+
    "battle_id,season_code,my_grade_code,enemy_grade_code,"+
    "iswin,first_pick,battle_turn,my_world_code,enemy_world_code,"+
    "my_preban_list_1,my_preban_list_2,enemy_preban_list_1,enemy_preban_list_2,"+
    "m_pic1,m_pic2,m_pic3,m_pic4,m_pic5,e_pic1,e_pic2,e_pic3,e_pic4,e_pic5,"+
    "process_status,nock_no"+
    ") VALUES ?";

const emptyStr = (str => str === null || str === undefined ? '' : str);

const pickData = (pic, battle) => {
    return pic.code + ':' + pic.ban + ':' + battle.artifact + ':' + battle.equip.join('$');
};

const convertRow = (data) => {
    return [
        data.battle_id,
        data.season_code,
        data.grade_code.my,
        data.grade_code.enemy,
        data.iswin,
        data.firstPick,
        data.battle_turn,
        data.world_code.my,
        data.world_code.enemy,
        emptyStr(data.preban_list.my[0]),
        emptyStr(data.preban_list.my[1]),
        emptyStr(data.preban_list.enemy[0]),
        emptyStr(data.preban_list.enemy[1]),
        pickData(data.dec_list.my[0], data.battleInfo.my[0]),
        pickData(data.dec_list.my[1], data.battleInfo.my[1]),
        pickData(data.dec_list.my[2], data.battleInfo.my[2]),
        pickData(data.dec_list.my[3], data.battleInfo.my[3]),
        pickData(data.dec_list.my[4], data.battleInfo.my[4]),

        pickData(data.dec_list.enemy[0], data.battleInfo.enemy[0]),
        pickData(data.dec_list.enemy[1], data.battleInfo.enemy[1]),
        pickData(data.dec_list.enemy[2], data.battleInfo.enemy[2]),
        pickData(data.dec_list.enemy[3], data.battleInfo.enemy[3]),
        pickData(data.dec_list.enemy[4], data.battleInfo.enemy[4]),
        0,
        data.nick_no
    ]
}; 

module.exports = async (configure) => {
    const context = {rows : []};

    const db = await mysql.createPool({
        connectionLimit : 2,
        user: configure.mysql.user,
        host: configure.mysql.host,
        password: configure.mysql.password,
        database: configure.mysql.database,
        port: configure.mysql.port,
    });

    
    context.persist = async (entries, force) => {
        for (let i = 0; i < entries.length; i++) {
            context.rows.push(convertRow(entries[i]));
        };

        if( (context.rows.length > 1000) || (force && context.rows.length > 0) ) {
            await db.query(insert_sql, [context.rows]);
            context.rows.splice(0);
        }
    };
    context.ddl = async () => {
        const ddl_path = __dirname + '/mysql.ddl'; 
        const query = await fs.readFile(ddl_path, 'utf8')

        await db.query(query);
    };

    context.destroy = () => {
        db.end();
    };

    return context;
    
};