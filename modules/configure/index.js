
const fs = require('fs').promises;

module.exports = async (context) => {
    const configure = {
        "dir" : process.cwd()
    };
    mergeObject(configure,context);

    const files = (await fs.readdir(configure.dir, {withFileTypes: true})).filter(d => d.isFile());

    const result = {};
    for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        const path = configure.dir + '/' +fileData.name;

        const json = JSON.parse(await fs.readFile(path, 'utf8'))
        mergeObject(result, json);
    }

    return result;
};

const mergeObject = (() => {
    const isObject = (obj) => {
        return obj && typeof obj === 'object' && Array.isArray(obj) == false;
    };

    const mergeValue = (target) => {
        if(isObject(target) === true) {
            const result = {};
            mergeObject(result, target);
            return result;
        }
    
        if(Array.isArray(target) == true) {
            return target.map(e => mergeValue(e)).join();
        }
    
        return target;
    };


    return (result, target) => {
        if(target === undefined || target === null) {
            return result;
        }
        const keys = Object.keys(target);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = target[key];
            result[key] = mergeValue(value);
        }
    };
})();
