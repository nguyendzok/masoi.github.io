const { gamef } = require('../Game.js');

module.exports = (gamef, bot) => {
    // listen VIEW_PLAYER_IN_ROOM message
    bot.on('postback:VIEW_PLAYER_IN_ROOM', (payload, chat) => {
        let joinID = payload.sender.id;
        let userRoom = gamef.getUserRoom(joinID);
        if (userRoom != undefined) {
            if (gamef.getRoom(userRoom).ingame) {
                let playersInRoomTxt = gamef.getRoom(userRoom).playersTxt.join(' ; ');
                chat.say(`👨‍👩‍👦‍👦Danh sách dân và sói làng ${userRoom + 1}: \n${playersInRoomTxt}`);
            } else {
                chat.say('```\nTrò chơi chưa bắt đầu!\n```');
            }
        } else {
            chat.say('```\nBạn chưa tham gia phòng chơi nào!\n```');
        }
    });
};