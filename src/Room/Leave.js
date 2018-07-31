const { roomChatAll } = require('../Chat/Utils');
const nightDoneCheck = require('../Night/nightDoneCheck');
const dayVoteCheck = require('../Day/dayVoteCheck');
const yesNoVoteCheck = require('../Day/yesNoVoteCheck');

module.exports = (gamef, bot) => {
    // listen LEAVE ROOM message
    bot.on('postback:LEAVE_ROOM', (payload, chat) => {
        let joinID = payload.sender.id;
        const userRoom = gamef.getUserRoom(joinID);
        if (userRoom != undefined) {
            let user = gamef.getRoom(userRoom).getPlayer(joinID);
            let leaveRole;
            if (!gamef.getRoom(userRoom).ingame) {
                gamef.getRoom(userRoom).deletePlayer(joinID);
                gamef.setUserRoom(joinID, undefined);
                chat.say(`Bạn đã rời phòng chơi ${userRoom + 1}!`);
                roomChatAll(bot, gamef.getRoom(userRoom).players, joinID, `${user.first_name} đã rời phòng chơi ${userRoom + 1}!`);
            } else {
                gamef.getRoom(userRoom).killAction(user.id);
                leaveRole = user.role;
                chat.say(`\`\`\`\nBạn đã tự sát!\n\`\`\``);
                roomChatAll(bot, gamef.getRoom(userRoom).players, joinID, `\`\`\`\n${user.first_name} đã tự sát với vai trò là: ${leaveRole == -1 ? '🐺SÓI' : leaveRole == 1 ? '🔍TIÊN TRI' : leaveRole == 2 ? '🗿BẢO VỆ' : leaveRole == 3 ? '🔫THỢ SĂN' : '💩DÂN THƯỜNG'}\n\`\`\``);
                gamef.getRoom(userRoom).newLog(`\`\`\`\n${user.first_name} đã tự sát với vai trò là: ${leaveRole == -1 ? '🐺SÓI' : leaveRole == 1 ? '🔍TIÊN TRI' : leaveRole == 2 ? '🗿BẢO VỆ' : leaveRole == 3 ? '🔫THỢ SĂN' : '💩DÂN THƯỜNG'}\n\`\`\``);
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
            }
            console.log(`$ ROOM ${userRoom + 1} > LEAVE > ${joinID} : ${user.first_name}`);
        } else {
            chat.say('```\nBạn chưa tham gia phòng nào!\n```');
        }
    });
};