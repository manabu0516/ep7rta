const run = async () => {

    const commands = process.argv.slice(2);

    const utility = require("./modules/utility");
    const configure = await require("./modules/configure")({
        "dir" : process.cwd() + '/configure'
    });

    const logger = utility.logger("rp7rta", configure.log.level);

    const func = {
        rawdata : persistenceLowData(configure, utility, logger)
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

    /*
    const analyzer = await require("./modules/analyzer")(configure, logger);
    await analyzer.process();
    */

};

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
        await (await require("./modules/presistence")(configure)).ddl();

        const users_group_1 = await epicseven.resolveUsersInfo([
            epicseven.WORLD_CODE.world_jpn,
            epicseven.WORLD_CODE.world_kor,
            epicseven.WORLD_CODE.world_eu,
            epicseven.WORLD_CODE.world_asia,
            epicseven.WORLD_CODE.world_global
        ]);


        const batchSize = (users_group_1.length / configure.epicseven.thredsize)+1;
        const sleepSize = configure.epicseven.sleepSize;

        const resolverGroup = [];
        const user_group =  utility.sliceArray(users_group_1, batchSize);

        for (let i = 0; i < user_group.length; i++) {
            const resolver = instanceDataResolve(user_group[i], epicseven, utility.sleepHandler(sleepSize), await require("./modules/presistence")(configure), logger);
                resolverGroup.push(resolver());
        }

        await Promise.all(resolverGroup)
    };
});

run();

