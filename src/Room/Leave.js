const { roomChatAll } = require('../Chat/Utils');
const roomRoleChat = require('../Night/roomRoleChat');
const nightDoneCheck = require('../Night/nightDoneCheck');
const dayVoteCheck = require('../Day/dayVoteCheck');
const yesNoVoteCheck = require('../Day/yesNoVoteCheck');

module.exports = (gamef, bot) => {
    const leaveCallback = (payload, chat) => {
        let joinID = payload.sender.id;
        const userRoom = gamef.getUserRoom(joinID);
        if (userRoom != undefined) {
            let user = gamef.getRoom(userRoom).getPlayer(joinID);
            let leaveRole;
            if (!gamef.getRoom(userRoom).ingame) {
                gamef.getRoom(userRoom).deletePlayer(joinID);
                gamef.setUserRoom(joinID, undefined);

                chat.say(`Bạn đã rời phòng chơi ${userRoom + 1}!`);
                // notice new player to everyone in room
                let playerListView = gamef.getRoomPlayerView(userRoom);
                roomChatAll(bot, gamef.getRoom(userRoom).players, 0, [{
                    cards: playerListView
                }, `${user.first_name} đã rời phòng chơi!`]);

                gamef.gameIsReady(userRoom, async (gameReady) => {
                    if (gameReady && !gamef.getRoom(userRoom).ingame) {
                        console.log(`$ ROOM ${userRoom + 1} > GAME_START`);
                        gamef.getRoom(userRoom).setInGame();
                        let roleListTxt = gamef.roleRandom(userRoom);
                        gamef.getRoom(userRoom).dayNightSwitch();
                        await roomChatAll(bot, gamef.getRoom(userRoom).players, 0, `Tất cả mọi người đã sẵn sàng! Game sẽ bắt đầu...\n${roleListTxt}\n🌛Đêm thứ ${gamef.getRoom(userRoom).day}🌛`);
                        gamef.getRoom(userRoom).newLog(`\n🌛Đêm thứ ${gamef.getRoom(userRoom).day}🌛\n`);
                        gamef.func(roomRoleChat, bot, userRoom);
                    }
                });
            } else if (gamef.getRoom(userRoom).alivePlayer[joinID]) {
                user.cancelSchedule();
                gamef.getRoom(userRoom).killAction(user.id);
                leaveRole = user.role;
                chat.say(`\`\`\`\nBạn đã tự sát!\n\`\`\``);
                roomChatAll(bot, gamef.getRoom(userRoom).players, joinID, `\`\`\`\n${user.first_name} đã tự sát với vai trò là: ${gamef.roleTxt[leaveRole]}\n\`\`\``);
                gamef.getRoom(userRoom).newLog(`\`\`\`\n${user.first_name} đã tự sát với vai trò là: ${gamef.roleTxt[leaveRole]}\n\`\`\``);
                if (gamef.getRoom(userRoom).isNight) {
                    gamef.getRoom(userRoom).roleIsDone((isDone) => {
                        if (isDone) {
                            gamef.func(nightDoneCheck, bot, userRoom);
                        }
                    });
                } else if (gamef.getRoom(userRoom).isMorning) {
                    gamef.getRoom(userRoom).roleIsDone((isDone) => {
                        if (isDone) {
                            gamef.func(dayVoteCheck, bot, userRoom);
                        }
                    });
                } else {
                    gamef.getRoom(userRoom).roleIsDone((isDone) => {
                        if (isDone) {
                            gamef.func(yesNoVoteCheck, bot, userRoom);
                        }
                    });
                }
            } else { // người chơi đã chết có quyền rời phòng chơi
                // gamef.getRoom(userRoom).justDeletePlayer(user.id);
                // gamef.setUserRoom(joinID, undefined);

                // chat.say(`\`\`\`\nBạn đã rời phòng chơi ${userRoom + 1}!\n\`\`\``);
                // roomChatAll(bot, gamef.getRoom(userRoom).players, joinID, `\`\`\`\n${user.first_name} đã rời phòng chơi!\n\`\`\``);
            }
            console.log(`$ ROOM ${userRoom + 1} > LEAVE > ${joinID} : ${user.first_name}`);
        } else {
            chat.say('```\nBạn chưa tham gia phòng nào!\n```');
        }
    };
    // listen LEAVE ROOM message
    bot.on('postback:LEAVE_ROOM', leaveCallback);
    bot.hear(/\/leave/i, leaveCallback);
};