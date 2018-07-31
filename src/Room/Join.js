const { asyncForEach } = require('../Chat/Utils');
const { Player } = require('../Game');

module.exports = (gamef, bot) => {
    // listen JOIN ROOM
    bot.on('postback:JOIN_ROOM', (payload, chat) => {
        let joinID = payload.sender.id;
        let userRoom = gamef.getUserRoom(joinID);
        if (userRoom != undefined) {
            chat.say(`\`\`\`\nBạn đã tham gia phòng ${(userRoom + 1)} rồi!\nĐể rời phòng chơi, chọn menu Tham gia > Rời phòng chơi!\n\`\`\``);
            return;
        }
        let joinUser;
        let roomListView = gamef.getRoomListView();

        const askRoom = (convo) => {
            convo.ask({
                text: 'Lựa chọn phòng',
                quickReplies: roomListView,
            }, (payload, convo) => {
                if (!(payload.message) || isNaN(parseInt(payload.message.text))) {
                    convo.say(`\`\`\`\nVui lòng nhập 1 phòng hợp lệ!\n\`\`\``);
                    convo.end();
                    return;
                }
                let roomTxt = payload.message.text
                let roomID = parseInt(roomTxt) - 1;

                if (gamef.getRoom(roomID).ingame) {
                    convo.say(`\`\`\`\nPhòng đã vào chơi rồi! Bạn sẽ được thông báo khi trò chơi kết thúc!\n\`\`\``);
                    gamef.getRoom(roomID).subscribe(joinID);
                    convo.end();
                    return;
                } else {
                    // save room number for user
                    gamef.setUserRoom(joinID, roomID);
                    // add new player to room
                    gamef.getRoom(roomID).addPlayer(new Player({
                        id: gamef.getRoom(roomID).newPlayerID(),
                        joinID: joinID,
                        last_name: joinUser.last_name,
                        first_name: joinUser.first_name,
                        avatar: joinUser.profile_pic
                    }));
                    // notice new player to everyone in room
                    const start = async () => {
                        let playerListView = gamef.getRoomPlayerView(roomID);
                        await asyncForEach(gamef.getRoom(roomID).players, async (m) => {
                            if (m) {
                                await bot.sendGenericTemplate(m.joinID, playerListView).then(async () => {
                                    await bot.say(m.joinID, `${joinUser.first_name} đã tham gia phòng!`);
                                })
                            }
                        })
                        convo.end();
                        console.log(`$ ROOM ${(roomID + 1)} > JOIN > ${joinID}`);
                    }
                    start();
                }
            });
        };

        chat.getUserProfile().then((user) => {
            console.log(`$ JOIN > ${joinID} : ${user.last_name + ' ' + user.first_name}`);
            joinUser = user;
            chat.conversation((convo) => {
                askRoom(convo);
            });
        })
    });
};