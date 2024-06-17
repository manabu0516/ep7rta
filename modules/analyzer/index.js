const mysql = require("mysql2/promise");
const fs = require('fs').promises;
const NodeCouchDb = require('node-couchdb');

const PROCESS_SIZE = 500;

const createNode = (code) => {

    const data = {code : code,count: 0};
    return {"_" : data}
};

const processTree = (data, tree) => {

    const mpic = [
        data.m_pic1.split(":")[0],
        data.m_pic2.split(":")[0],
        data.m_pic3.split(":")[0],
        data.m_pic4.split(":")[0],
        data.m_pic5.split(":")[0]
    ];

    const epic = [
        data.e_pic1.split(":")[0],
        data.e_pic2.split(":")[0],
        data.e_pic3.split(":")[0],
        data.e_pic4.split(":")[0],
        data.e_pic5.split(":")[0]
    ];

    const firstpick = data.first_pick === 1;

    const f_pic = firstpick ? mpic : epic;
    const s_pic = firstpick ? epic : mpic;

    const targets = [
        f_pic[0],
        s_pic[0], s_pic[1],
        f_pic[1], f_pic[2],
        s_pic[2], s_pic[3],
        f_pic[3], f_pic[4],
        s_pic[4]
    ];

    let node = tree;
    targets.forEach(code => {
        if(node[code] === undefined) {
            node[code] = createNode(code);   
        }
        node = node[code];
        node["_"].count += 1;
    });
    
};


const processBattleEntry = (data) => {
    const mpic1 = data.m_pic1.split(":");
    const mpic2 = data.m_pic2.split(":");
    const mpic3 = data.m_pic3.split(":");
    const mpic4 = data.m_pic4.split(":");
    const mpic5 = data.m_pic5.split(":");

    const epic1 = data.e_pic1.split(":");
    const epic2 = data.e_pic2.split(":");
    const epic3 = data.e_pic3.split(":");
    const epic4 = data.e_pic4.split(":");
    const epic5 = data.e_pic5.split(":");

    const m_code = [mpic1[0],mpic2[0],mpic3[0],mpic4[0],mpic5[0]];
    const e_code = [epic1[0],epic2[0],epic3[0],epic4[0],epic5[0]];

    return {
        code : m_code.sort().join(":"),
        battles : {
            code : e_code.sort().join(":"),
            iswin : data.iswin,
            season_code : data.season_code,
            battle_id : data.battle_id,
            first_pick : data.first_pick,
            world_code : data.my_world_code,
            my_preban_list : [data.my_preban_list_1, data.my_preban_list_2].join(":"),
            enemy_preban_list : [data.enemy_preban_list_1, data.enemy_preban_list_2].join(":"),
            my_ban : [mpic1, mpic2, mpic3, mpic4, mpic5].filter(e => e[1] === "1").map(e => e[0]),
            enemy_ban : [epic1, epic2, epic3, epic4, epic5].filter(e => e[1] === "1").map(e => e[0]),
            my_dec : [mpic1, mpic2, mpic3, mpic4, mpic5].map(e => e[0]),
            enemy_dec : [epic1, epic2, epic3, epic4, epic5].map(e => e[0])
        }
    };
};

module.exports = async (configure, logger) => {

    const context = {};

    const couch = new NodeCouchDb({auth: {user: "admin",pass: "password"}});

    const db = await mysql.createPool({
        connectionLimit : 5,
        user: configure.mysql.user,
        host: configure.mysql.host,
        password: configure.mysql.password,
        database: configure.mysql.database,
        port: configure.mysql.port,
    });

    context.tree = {};

    const dblist = (await couch.listDatabases()).filter(e => e === "battle_analyze");
    if(dblist.length === 0) {
        await couch.createDatabase("battle_analyze");
        logger.info("create analyze database [battle_analyze]");
    }

    context.process = async () => {

        pageing = {offset : 0, limit : PROCESS_SIZE}
        const count = (await db.query("select count(battle_id) as cnt from battles where process_status = 0"))[0][0]["cnt"];
        
        while(pageing.offset < count) {
            logger.info("process analyze.", [pageing.offset, count]);
            const data = (await db.query("select * from battles where process_status = 0 limit ? offset ?", [pageing.limit, pageing.offset]))[0];
            //data.forEach(e => processTree(e, context.tree));

            const analyzed_data = data.map(processBattleEntry);

            for (let i = 0; i < analyzed_data.length; i++) {
                const element = analyzed_data[i];
                const entry = await resolveBattleEntry(couch, element.code);

                if(entry === null) {
                    //logger.info("insert document.", element.code);
                    await couch.insert("battle_analyze", {
                        _id: element.code,
                        battles : [element.battles]
                    });
                } else {
                    //logger.info("update document.", element.code);
                    entry.data.battles.push(element.battles);
                    await couch.update("battle_analyze", entry.data);
                    
                }
            }

            pageing.offset += PROCESS_SIZE;
        };
    };

    return context
};

const resolveBattleEntry = async (couch ,id) => {
    try {
        return await couch.get("battle_analyze", id);
    } catch (e) {
        if(e.message === "Document is not found") {
            return null;
        }
        throw e;
    }
    
}