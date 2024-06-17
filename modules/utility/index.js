
module.exports = {}

module.exports.sliceArray = (array, number) => {
    const length = Math.ceil(array.length / number)
    return new Array(length).fill().map((_, i) =>
        array.slice(i * number, (i + 1) * number));
};

module.exports.sleepHandler = (waitFor) => {
    const context = {
        start : Date.now(),
        waitFor : waitFor,
        timer : 0
    };

    return {
        start : async () => {
            context.start = Date.now();
            return context.timer;
        },

        end : async() => {
            const end = Date.now();
            const timer = context.waitFor - (end - context.start);
            context.timer = timer < 0 ? 0 :timer;

            await new Promise(resolve => setTimeout(resolve, context.timer));
        },
    };
};

module.exports.LOGLEVEL = {DEBUG : 0, INFO : 1, WARN : 2, ERROR : 3, FATAL : 4};

module.exports.logger = (label, level) => {
    const output = (message, level, parameter) => {
        const text = '['+(new Date()).toLocaleDateString() + ' ' + (new Date()).toLocaleTimeString() +  '] ['+level+'] [' + label + '] ' + message;
        console.log(text + (parameter ? ' :' + JSON.stringify(parameter) : ''));
    }

    return {
        debug : level <= 0 ? (m,p) => output(m,"DEBUG", p) : () => {},
        info  : level <= 1 ? (m,p) => output(m,"INFO", p) : () => {},
        warn  : level <= 2 ? (m,p) => output(m,"WARN", p) : () => {},
        error : level <= 3 ? (m,p) => output(m,"ERROR", p) : () => {},
        fatal : level <= 4 ? (m,p) => output(m,"FATAL", p) : () => {},
    };
}; 