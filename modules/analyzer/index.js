const NodeCouchDb = require('node-couchdb');

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

    const couch = new NodeCouchDb({
        auth: {
            user: configure.couch.user,
            pass: configure.couch.password
        }
    });

    context.tree = {};

    const dblist = (await couch.listDatabases()).filter(e => e === "battle_analyze");
    if(dblist.length === 0) {
        await couch.createDatabase("battle_analyze");
        logger.info("create analyze database [battle_analyze]");
    }

    context.process = async (data) => {        
        const analyzed_data = data.map(processBattleEntry);
        const cache = {insert : {}, update : {}};

        for (let i = 0; i < analyzed_data.length; i++) {
            const element = analyzed_data[i];
            const entry = await resolveBattleEntry(couch, element.code, cache);
            entry.battles.push(element.battles);
        }
        
        const f1 = cache.insert.map(element => {
            return couch.insert("battle_analyze", element);
        });

        const f2 = cache.update.map(element => {
            return couch.update("battle_analyze", element);
        });

        Promise.all([f1, f2]);
    };

    return context
};

const resolveBattleEntry = async (couch ,id, cache) => {
    try {
        if(cache.insert[id] !== undefined) {
            return cache.insert[id];
        }
    
        if(cache.update[id] !== undefined) {
            return cache.update[id];
        }

        const entry = await couch.get("battle_analyze", id);
        cache.update[id] = entry.data;
        return entry.data;

    } catch (e) {
        if(e.message !== "Document is not found") {
            throw e;
        }

        cache.insert[id] = {_id: id,battles : []};
        return cache.insert[id];
    }
    
}