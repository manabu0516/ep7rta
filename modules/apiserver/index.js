
const express = require('express');
const bodyParser = require('body-parser');

const registerApiModules = (application) => {

    application.get('/api/v1/battles/:codeset',function(req,res){
        res.json({
            message:"Hello,world"
        });
    });

    application.get('/api/v1/pick/:codeset',function(req,res){
        res.json({
            message:"Hello,world"
        });
    });

};

module.exports = async (configure) => {
    const context = {};

    const application = express();

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    const port = app.listen(configure.apiserver.port);

    context._server = null;

    context.start = () => {
        if(context._server !== undefined) {
            return;
        }
        context._server = application.listen(port);
    };

    context.stop = () => {
        if(context._server === undefined) {
            return;
        }
        context._server.close(() => {});
        context._server = undefined;
    };

    registerApiModules(application);

    return context;
};