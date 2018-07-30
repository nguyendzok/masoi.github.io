const gamef = require('../Game.js');
var gamef = new Game();

module.exports = (bot) => {
    // listen USER_RENAME message
    bot.on('postback:USER_RENAME', (payload, chat) => {
        let joinID = payload.sender.id;
        let userRoom = gamef.getUserRoom(joinID);
        if (userRoom == undefined) {
            chat.say('```\nBạn cần tham gia 1 phòng chơi trước khi đổi tên!\n```');
            return;
        }
        let user = gamef.getRoom(userRoom).getPlayer(joinID);

        const askName = (convo) => {
            convo.ask(`Tên hiện tại của bạn: ${user.first_name}\nĐể hủy đổi tên: /cancel\nNhập tên bạn muốn đổi thành:`, (payload, convo) => {
                if (!payload.message) {
                    convo.say('```\nVui lòng nhập tên hợp lệ\n```');
                    convo.end();
                    return;
                } else {
                    const chatTxt = payload.message.text;
                    if (!chatTxt.match(/\/cancel/g)) {
                        const startR = async () => {
                            await convo.say(`Đã đổi tên thành công!`);
                            await roomChatAll(userRoom, joinID, `${user.first_name} đã đổi tên thành ${chatTxt}!`)
                            user.setFirstName(chatTxt);
                            convo.end();
                        }
                        startR();
                    } else {
                        convo.say(`Bạn đã hủy không đổi tên!`)
                        convo.end();
                    }
                }
            });
        };
        chat.conversation((convo) => {
            askName(convo);
        });
    });
};