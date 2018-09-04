const { roomChatAll } = require('../Chat/Utils');
const { Player } = require('../MainGame/Game');
const DBTask = require('../DBModule/DBTask');

module.exports = (gamef, bot) => {
    const joinCallback = (payload, chat) => {
        let joinID = payload.sender.id;
        let userRoom = gamef.getUserRoom(joinID);
        if (userRoom != undefined) {
            chat.say(`\`\`\`\n⚠️Bạn đã tham gia phòng ${(userRoom + 1)} rồi!\nℹ️ Để rời phòng chơi, chọn menu Tham gia > Rời phòng chơi!\n\`\`\``);
            return;
        }
        let joinUser;
        let page = 0;
        let roomListView = gamef.getRoomListView(page);
        let enableGreetingTxt = true;

        const askRoom = (convo) => {
            convo.ask({
                text: enableGreetingTxt ? 'MA SÓI BOT BETA\n🚫: phòng quá tải\n🔥: phòng hot\n👥: phòng đủ người\n👤: phòng ít người\n🎮: phòng đang chơi\n\nDanh sách phòng chơi:' : 'Chọn phòng:',
                quickReplies: roomListView,
            }, async (payload, convo) => {
                if (payload.message && payload.message.text.match(/\<|\>/g)) {
                    enableGreetingTxt = false;
                    if (payload.message.text.match(/\>/g)) { //next page
                        page += 3;
                    } else { // prev page
                        page -= 3;
                    }
                    roomListView = gamef.getRoomListView(page);
                    askRoom(convo);
                    return;
                }
                let roomIDTxt = payload.message ? payload.message.text.match(/[0-9]+/g) : [];
                if (!(payload.message) || !roomIDTxt || isNaN(parseInt(roomIDTxt[0])) || !gamef.room[parseInt(roomIDTxt[0]) - 1]) {
                    convo.say(`\`\`\`\n🚫Phòng bạn vừa nhập không hợp lệ!\n\`\`\``);
                    convo.end();
                    return;
                }
                let roomID = parseInt(roomIDTxt[0]) - 1;

                if (gamef.getRoom(roomID).ingame) {
                    convo.say(`\`\`\`\n🎮 Phòng đã vào chơi rồi! 🔔Bạn sẽ được thông báo khi trò chơi kết thúc!\n\`\`\``);
                    gamef.getRoom(roomID).subscribe(joinID);
                    convo.end();
                    return;
                } if (gamef.getRoom(roomID).players.length >= 11) {
                    convo.say(`\`\`\`\n🚫Phòng chơi đã quá tải, vui lòng chơi phòng chơi khác!\n\`\`\``);
                    console.log(`$ ROOM ${roomID + 1} > ROOM TOO CROWDED  ...`)
                    convo.end();
                    return;
                } else {
                    convo.say('🔔 Đang xử lí...');
                    let userData = await DBTask(`SELECT * FROM USERDATA WHERE joinID = '${joinID}';`);
                    console.log(JSON.stringify(userData));
                    if (userData) {
                        convo.say('ĐÃ ĐĂNG NHẬP!');
                    } else {
                        await DBTask(`INSERT INTO USERDATA (joinID, fullName, name, avatar, clan) VALUES ('${joinID}', '${joinUser.last_name+' '+joinUser.first_name}', '${joinUser.first_name}', '${joinUser.profile_pic}', 'UET');`)
                        convo.say('Bạn đã ĐĂNG KÍ THÀNH CÔNG!');
                    }

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
                    // let playerListView = gamef.getRoomPlayerView(roomID, 0, 3);
                    playerListView = [];
                    playerListView.unshift({
                        title: `Quản trò Ma Sói BOT`,
                        image_url: `https://scontent.fhan5-5.fna.fbcdn.net/v/t1.0-9/37812890_1872137736415276_2253761986674294784_n.png?_nc_cat=0&oh=c66c9db1a9e5d72edb88931cadeff204&oe=5C07D275`,
                        subtitle: `Bot sẽ quản trò cho các bạn! Chúc các bạn chơi vui vẻ trên Quản trò Ma sói Bot.\n-Dev by Phạm Ngọc Duy-`,
                        buttons: [
                            { type: 'postback', title: '📤Thoát', payload: 'LEAVE_ROOM' }
                        ]
                    });
                    playerListView.push({
                        title: `Phòng ${roomID + 1}`,
                        subtitle: `👥Tổng số người chơi: ${gamef.getRoom(roomID).players.length}\n🌟Sẵn sàng: ${gamef.getRoom(roomID).readyCount}/${gamef.getRoom(roomID).players.length}`,
                    });
                    let simplePlayerListView = undefined;
                    // if (gamef.getRoom(roomID).players.length > 3) {
                    // simplePlayerListView = gamef.getSimpleRoomPlayerView(roomID, 3).join('\n');
                    // }
                    simplePlayerListView = gamef.getSimpleRoomPlayerView(roomID).join('\n');
                    roomChatAll(bot, gamef.getRoom(roomID).players, 0, [{
                        elements: playerListView,
                        buttons: [
                            { type: 'postback', title: '🌟Sẵn sàng!', payload: 'READY_ROOM' },
                        ]
                    }, (simplePlayerListView ? `${simplePlayerListView}\n` : ``) + `\n📥${joinUser.first_name} đã tham gia phòng!`]);

                    convo.end();
                    console.log(`$ ROOM ${(roomID + 1)} > JOIN > ${joinUser.first_name} > ${joinID}`);
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
    };
    // listen JOIN ROOM
    bot.on('postback:JOIN_ROOM', joinCallback);
    bot.hear(/^\/join$/, joinCallback);
};