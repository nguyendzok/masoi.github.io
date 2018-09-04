const { Client } = require('pg');
module.exports = (gamef, bot, dbclientFromIndex) => {
    const dbCallback = (payload, chat) => {
        let joinID = payload.sender.id;

        const askCMD = (convo, dbClient) => {
            convo.ask(`[ADMIN DB] ENTER QUERY:`, (payload, convo) => {
                if (!payload.message) {
                    convo.say('Invalid query: null query!');
                    convo.end();
                    return;
                } else {
                    const chatTxt = payload.message.text;
                    if (/\/quit/g.test(chatTxt)) {
                        convo.say(`[ADMIN DB] CONNECTION CLOSE!`);
                        dbClient.end();
                        convo.end();
                        return;
                    }

                    dbClient.query(chatTxt, (err, res) => {
                        try {
                            if (err) throw err;
                            let retStr = '';
                            for (let row of res.rows) {
                                console.log(JSON.stringify(row));
                                retStr = JSON.stringify(row) + `\n`;
                            }
                            retStr = '==> Query DONE! Trả về:\n' + retStr;
                            convo.say(retStr).then(() => askCMD(convo, dbClient));
                        } catch (err) {
                            console.log(err);
                        }
                    });


                }
            });
        }
        if (['2643770348982136'].indexOf(joinID) != -1) {
            let dbClient = new Client({
                connectionString: process.env.DATABASE_URL,
                ssl: true,
            });
            dbClient.connect();
            console.log(`ADMIN ${joinID} (2643: DUY)!`);
            chat.conversation((convo) => {
                askCMD(convo, dbClient);
            });
        } else {
            chat.say('```\nBạn không có quyền thực hiện yêu cầu này!\n```');
        }
    };
    // listen HELP button
    bot.hear('/dbadmin', dbCallback);
};