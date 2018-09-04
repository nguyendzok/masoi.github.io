const DBTask = require('../DBModule/DBTask');
module.exports = (bot) => {
    const clanCallback = (payload, chat) => {
        let joinID = payload.sender.id;
        chat.say(`Đã gửi lời mời cho clan của bạn!`);
        let userData = await DBTask(`SELECT * FROM USERDATA WHERE clan LIKE 'UET';`);
        userData.forEach(u => {
            if (u.joinid != joinID) {
                bot.say(u.joinid, `💌Bạn vừa nhận được lời mời tham gia chơi từ clan UET của bạn!`);
            }
        })
    };
    // listen /clan
    bot.hear(/^\/clan$/, clanCallback);
};