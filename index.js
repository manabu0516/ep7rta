const run = async () => {

    const commands = process.argv.slice(2);

    const utility = require("./modules/utility");
    const configure = await require("./modules/configure")({
        "dir" : __dirname + '/configure'
    });

    const logger = utility.logger("rp7rta", configure.log.level);

    const func = {
        rawdata : persistenceLowData(configure, utility, logger),
        analyze : analyzebattleData(configure, utility, logger),
    };
    
    for (let idx = 0; idx < commands.length; idx++) {
        const cmd = commands[idx];
        const invoker = func[cmd];

        if(invoker === undefined) {
            logger.info("not found command :" + cmd);
            continue;
        }

        logger.info("invoke command :" + cmd + ' start.');
        await invoker();
        logger.info("finish command :" + cmd + ' end.');
    }
};

const analyzebattleData = ((configure, utility, logger) => {
    const PROCESS_SIZE = configure.analyzer.batchsize;
    return async () => {
        const analyzer = await require("./modules/analyzer")(configure, logger);

        const pageing = {offset : 0, limit : PROCESS_SIZE};
        const persistence = await require("./modules/presistence")(configure);
        
        const count = await persistence.recourdCount();
        logger.debug("analyze target size : " + count, {});

        logger.info("analyze start", {});
        while(pageing.offset < count) {
            logger.info("analyze data", pageing);
            const data = await persistence.resolveRecourd(pageing.limit, pageing.offset);
            const record_ids = data.map(d => d.battle_id);

            await analyzer.process1(data);
            await analyzer.process2(data);

            pageing.offset += PROCESS_SIZE;
            await persistence.markProcessed(record_ids);
            break;
        };

        await persistence.destroy();
        logger.info("analyze complete", {});
    };
});

const persistenceLowData = ((configure, utility, logger) => {
    const epicseven = require("./modules/epicseven");

    const instanceDataResolve = (users, epicseven, sleep, persistence, logger) => {
        return async () => {
            for (let i = 0; i < users.length; i++) {
                await sleep.start();
                const user = users[i];
                const message = ['process ',  '(' + (i+1) + '/' + users.length + ') '];
    
                try {
                    message.push(user.world_code +':' + user.nick_no + ' .... ');
                    const battle = await epicseven.resolveBattleInfo(user.world_code, user.nick_no);
                    await persistence.persist(battle);
                    message.push('complete = ' + battle.length);
                } catch(e) {
                    logger.error("handle error ." , e);
                    message.push("error = " + e);
                }
    
                logger.debug(message.join(''), {});
                await sleep.end();
            }
            await persistence.persist([], true);
            persistence.destroy();
        }
    };

    return async () => {
        logger.debug("configure :", configure.epicseven);
        
        logger.info("rsolve user list ...");
        const users_group_1 = await epicseven.resolveUsersInfo([
            epicseven.WORLD_CODE.world_jpn,
            epicseven.WORLD_CODE.world_kor,
            epicseven.WORLD_CODE.world_eu,
            epicseven.WORLD_CODE.world_asia,
            epicseven.WORLD_CODE.world_global
        ]);
        
        const batchSize = (users_group_1.length / configure.epicseven.thredsize)+1;
        const sleepSize = configure.epicseven.sleepSize;

        logger.info("  --- complete.", {});
        logger.debug("user size : " + users_group_1.length);

        logger.info("process mysql ddl ...", {});
        await (await require("./modules/presistence")(configure)).ddl();
        logger.info("  --- complete.", {});

        const resolverGroup = [];
        const user_group =  utility.sliceArray(users_group_1, batchSize);

        logger.info("process lowdata start ", {});
        for (let i = 0; i < user_group.length; i++) {
            const resolver = instanceDataResolve(user_group[i], epicseven, utility.sleepHandler(sleepSize), await require("./modules/presistence")(configure), logger);
                resolverGroup.push(resolver());
        }

        await Promise.all(resolverGroup);
        logger.info("process complete.", {});
    };
});

run();

