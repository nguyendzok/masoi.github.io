module.exports = (gamef, bot, dbclient) => {
    const dbCallback = (payload, chat) => {
        let joinID = payload.sender.id;

        const askCMD = (convo) => {
            convo.ask(`[ADMIN DB] ENTER QUERY:`, (payload, convo) => {
                if (!payload.message) {
                    convo.say('Invalid query: null query!');
                    convo.end();
                    return;
                } else {
                    const chatTxt = payload.message.text;
                    dbclient.connect();
                    dbclient.query(chatTxt, (err, res) => {
                        if (err) throw err;
                        for (let row of res.rows) {
                            console.log(JSON.stringify(row));
                        } 
                        dbclient.end();
                    });
                }
            });
        }
        if (['2643770348982136'].indexOf(joinID) != -1) {
            console.log(`ADMIN ${joinID} (2643: DUY)!`);
            chat.conversation((convo) => {
                askCMD(convo);
            });
        } else {
            chat.say('```\nBạn không có quyền thực hiện yêu cầu này!\n```');
        }
    };
    // listen HELP button
    bot.hear('/dbadmin', dbCallback);
};