const { roomChatAll } = require('../Chat/Utils');
const DBTask = require('../DBModule/DBTask');

module.exports = (gamef, bot) => {
    const infoCallback = (payload, chat) => {
        let joinID = payload.sender.id;
        let userRoom = gamef.getUserRoom(joinID);
        if (userRoom != undefined) {
            if (gamef.getRoom(userRoom).ingame) {
                let playersInRoomTxt = gamef.getRoom(userRoom).playersTxt.join('\n');
                let roleListTxt = gamef.getRoom(userRoom).roleListTxt;
                chat.say(`👨‍👩‍👦‍👦Danh sách người chơi phòng ${userRoom + 1}:\n${playersInRoomTxt}\n\nSET-UP: ${roleListTxt}`);
            } else {
                let roomView = gamef.getSimpleRoomPlayerView(userRoom);
                chat.say(roomView.join(`\n`));
            }
        } else {
            chat.say('```\nBạn chưa tham gia phòng chơi nào!\n```');
        }
    };

    const renameCallback = (payload, chat) => {
        let joinID = payload.sender.id;
        let userRoom = gamef.getUserRoom(joinID);
        if (userRoom == undefined) {
            chat.say('```\nBạn cần tham gia 1 phòng chơi trước khi đổi tên!\n```');
            return;
        }
        if (gamef.getRoom(userRoom).ingame) {
            chat.say('```\nBạn không thể đổi tên trong khi đang chơi!\n```');
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
                        if (gamef.getRoom(userRoom).ingame) {
                            convo.say('```\nBạn không thể đổi tên trong khi đang chơi!\n```');
                            return;
                        }
                        convo.say(`Bạn đã đổi tên thành ${chatTxt}!`);
                        roomChatAll(bot, gamef.getRoom(userRoom).players, joinID, `${user.first_name} đã đổi tên thành ${chatTxt}!`)
                        user.setFirstName(chatTxt);
                        convo.end();
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
    };

    const profileCallback = async (payload, chat) => {
        let joinID = payload.sender.id;
        chat.say('🔔 Đang xử lí...');
        let userData = await DBTask(`SELECT * FROM USERDATA WHERE joinID = '${joinID}';`);
        let chatTxt = '';
        if (userData) {
            let user = userData[0];
            chatTxt += `Xin chào ${user.fullname} (${user.id}),\nTên InGame: ${user.name}\nClan: ${user.clan}\n`;
            chatTxt += `Tỉ lệ SÓI / DÂN / PHE 3 : ${user.bewolf} / ${user.bevillager} / ${user.bethirdparty}\n`;
            chatTxt += `Tỉ lệ thắng SÓI / DÂN / PHE 3 : ${user.bewolf > 0 ? Math.floor(user.winbewolf / user.bewolf) : '0'}% / ${user.bevillager > 0 ? Math.floor(user.winbevillager / user.bevillager) : '0'}% / ${user.bethirdparty > 0 ? Math.floor(user.winbethirdparty / user.bethirdparty) : '0'}%\n`;
        }
        let userRoom = gamef.getUserRoom(joinID);
        if (userRoom != undefined) {
            let user = gamef.getRoom(userRoom).getPlayer(joinID);
            let uyTin = (60 - user.afkCount * 10);
            chatTxt += `Uy tín của bạn: ${uyTin}/60`;
        }
        chat.say(chatTxt);
    };

    // listen VIEW_PLAYER_IN_ROOM message
    bot.on('postback:VIEW_PLAYER_IN_ROOM', infoCallback);
    bot.hear(/^\/info$/, infoCallback);

    // listen USER_RENAME message
    bot.on('postback:USER_RENAME', renameCallback);
    bot.hear(/^\/rename$/, renameCallback);

    // listen USER_RENAME message
    bot.on('postback:USER_PROFILE', profileCallback);
    bot.hear(/^\/profile$/, profileCallback);
};