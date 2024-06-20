const fetch = require('node-fetch');

const processPickBanEntry = (data) => {
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

    const firstpick_win = data.first_pick === 1 && data.iswin === 1;

    return {code : f_pic[0], pick : targets, firstpick_win : firstpick_win};
};

const preparePickData = (pick, index, firstpick_win, entry) => {
    const code = pick[index];
    if(code === undefined) {
        return;
    }

    if(entry[code] === undefined) {
        entry[code] = {"_" : {win:0,lose:0,count:0}};
    }

    const pick_index = index+1;

    const target = entry[code];
    target["_"].count += 1;
    if(pick_index === 1 || pick_index === 4 || pick_index === 5 || pick_index === 8 || pick_index === 9) {
        target["_"].win += firstpick_win === true ? 1 : 0;
        target["_"].lose += firstpick_win === true ? 0 : 1;
    }
    if(pick_index === 2 || pick_index === 3 || pick_index === 6 || pick_index === 7 || pick_index === 10) {
        target["_"].win += firstpick_win === false ? 1 : 0;
        target["_"].lose += firstpick_win === false ? 0 : 1;
    }

    preparePickData(pick, index+1, firstpick_win, target);
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

const createConnector = (configure) => {

    const context = {};

    const buffer = Buffer.from(configure.user + ":" + configure.pass);
    const authString = "Basic " + buffer.toString("base64");
    const baseUrl = "http://127.0.0.1:5984/"

    context.buldDoc = async (dbname, parameter) => {
        const response = await fetch(baseUrl + dbname + "/_bulk_docs", {
            method: 'POST',
            body: JSON.stringify(parameter),
            headers: {'Content-Type': 'application/json', 'Authorization': authString}
        });

        return await response.json();
    };

    context.listDatabases = async () => {
        const response = await fetch(baseUrl + "_all_dbs", {
            method: 'GET',
            headers: {'Authorization': authString}
        });
        return await response.json();
    };

    context.createDatabase = async(dbname) => {
        const response = await fetch(baseUrl + dbname, {
            method: 'PUT',
            headers: {'Authorization': authString}
        });
        return await response.json();
    };

    context.get = async(dbname, id) => {
        const response = await fetch(baseUrl + dbname + '/' + id, {
            method: 'GET',
            headers: {'Authorization': authString}
        });
        const json = await response.json();
        return json["_id"] === undefined ? null : json;
    };

    return context;
};

module.exports = async (configure, logger) => {

    const context = {};

    const couch = createConnector({
        user: configure.couch.user,
        pass: configure.couch.password
    });


    context.tree = {};

    const dblist = await couch.listDatabases();

    if(dblist.indexOf("battle_analyze") === -1) {
        await couch.createDatabase("battle_analyze");
        logger.info("create analyze database [battle_analyze]");
    }
    if(dblist.indexOf("pickban_analyze") === -1) {
        await couch.createDatabase("pickban_analyze");
        logger.info("create analyze database [pickban_analyze]");
    }

    context.process1 = async (data) => {        
        const analyzed_data = data.map(processBattleEntry);
        const cache = {insert : {}, update : {}};

        for (let i = 0; i < analyzed_data.length; i++) {
            const element = analyzed_data[i];
            const entry = await resolveBattleEntry(couch, element.code, cache);
            entry.battles.push(element.battles);
        }

        logger.info("register battle analyzed data . ", {
            insert : Object.keys(cache.insert).length,
            update : Object.keys(cache.update).length
        });

        const parameter = {"docs": []};

        Object.keys(cache.insert).forEach(key => {
            parameter.docs.push(cache.insert[key]);
        });
        Object.keys(cache.update).forEach(key => {
            parameter.docs.push(cache.update[key]);
        });

        await couch.buldDoc("battle_analyze", parameter);
    };

    context.process2 = async (data) => {
        const analyzed_data = data.map(processPickBanEntry);
        const cache = {insert : {}, update : {}};

        for (let i = 0; i < analyzed_data.length; i++) {
            const element = analyzed_data[i];
            const entry = await resolvePickBanEntry(couch, element.code, cache);

            preparePickData(element.pick, 0, element.firstpick_win, entry);
        }

        logger.info("register pickban analyzed data . ", {
            insert : Object.keys(cache.insert).length,
            update : Object.keys(cache.update).length
        });

        const parameter = {"docs": []};
        
        Object.keys(cache.insert).forEach(key => {
            parameter.docs.push(cache.insert[key]);
        });
        Object.keys(cache.update).forEach(key => {
            parameter.docs.push(cache.update[key]);
        });

        await couch.buldDoc("pickban_analyze", parameter);
    };

    return context
};

const resolveBattleEntry = async (couch ,id, cache) => {
    return resolveEntry(couch,id,cache, "battle_analyze", (code) => {
        return {"_id": code, battles : []}; 
    });
};

const resolvePickBanEntry = async (couch ,id, cache) => {
    return resolveEntry(couch,id,cache, "pickban_analyze", (code) => {
        return {"_id": code}; 
    });
};

const resolveEntry = async (couch ,id, cache, dbname, factory) => {
    if(cache.insert[id] !== undefined) {
        return cache.insert[id];
    }

    if(cache.update[id] !== undefined) {
        return cache.update[id];
    }

    const entry = await couch.get(dbname, id);
    if(entry === null) {
        cache.insert[id] = factory(id);
        return cache.insert[id];
    } else {
        cache.update[id] = entry;
        return entry;
    }
  
};