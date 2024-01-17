const { Client, ApplicationCommandOptionType } = require("discord.js");
const fs = require('fs').promises;

const commands = {};

commands ["ep7-rta-battle"] = {
    name : "ep7-rta-battle",
    description : "Search and display formations with a high number of wins and high win rate for the input formation.",
    description_localizations : {
        "en-US" : "Search and display formations with a high number of wins and high win rate for the input formation.",
        "zh-CN" : "Search and display formations with a high number of wins and high win rate for the input formation.",
        "ko" : "Search and display formations with a high number of wins and high win rate for the input formation.",
        "ja" : "入力された編成に対して勝利数、勝率が高い編成を検索して表示します。"
    },

    options : [
        {
            type: 3,
            name: "units",
            description: "Specify the organization you want to search.",
            description_localizations : {
                "en-US" : "Specify the organization you want to search.",
                "zh-CN" : "Specify the organization you want to search.",
                "ko" : "Specify the organization you want to search.",
                "ja" : "検索したい編成を指定します。(英雄ごとにコード値を4体分[:]区切りで指定します。)"
            },
            required : true
        },
        {
            type: 3,
            name: "rank",
            description: "Indicates the rank range of the target battle.",
            description_localizations : {
                "en-US" : "Indicates the rank range of the target battle.",
                "zh-CN" : "Indicates the rank range of the target battle.",
                "ko" : "Indicates the rank range of the target battle.",
                "ja" : "対象とするバトルのランク帯をしていします。"
            },
            required : false,
            choices: [
                { name: "legend", value: "legend" },
                { name: "emperor", value: "emperor" },
                { name: "champion", value: "champion" },
                { name: "challenger", value: "challenger" },
                { name: "master", value: "master" },
            ]
        }
    ]
};

commands ["ep7-rta-code"] = {
    name : "ep7-rta-code",
    description : "A code corresponding to the entered hero name will be published.",
    description_localizations : {
        "en-US" : "A code corresponding to the entered hero name will be published.",
        "zh-CN" : "A code corresponding to the entered hero name will be published.",
        "ko" : "A code corresponding to the entered hero name will be published.",
        "ja" : "入力された英雄名に対応するコードを返却します。(部分一致)"
    },

    options : [
        {
            type: 3,
            name: "name",
            description: "Name of the hero whose code you want to check (partial match)",
            description_localizations : {
                "en-US" : "Name of the hero whose code you want to check (partial match)",
                "zh-CN" : "Name of the hero whose code you want to check (partial match)",
                "ko" : "Name of the hero whose code you want to check (partial match)",
                "ja" : "コードを調べたい英雄の名前(部分一致)"
            },
            required : true
        }
    ]
};

const run = async () => {
    const token = await fs.readFile('./discrod.token', 'utf8');
    const client = new Client({intents: 0});
    client.once("ready", async () => {
        console.log("ready");
        await client.application.commands.set([
            commands["ep7-rta-battle"],
            commands ["ep7-rta-code"]
        ]);

        console.log("complete");
    });
    client.login(token);
};

run();