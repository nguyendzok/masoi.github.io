const { roomChatAll } = require('../Chat/Utils');

module.exports = (gamef, bot) => {
    // listen ADMIN_COMMAND message
    bot.on('postback:ADMIN_COMMAND', (payload, chat) => {
        let joinID = payload.sender.id;

        const askCMD = (convo) => {
            convo.ask(`Các lệnh cơ bản:\nĐể reset 2 phòng: /resetAll\nĐể kick người chơi: /kick <RoomID> <userID>\nHủy: /cancel`, (payload, convo) => {
                if (!payload.message) {
                    convo.say('```\nVui lòng nhập lệnh hợp lệ\n```');
                    convo.end();
                    return;
                } else {
                    const chatTxt = payload.message.text;
                    if (chatTxt.match(/\/resetAll/g)) {
                        gamef.resetAllRoom();
                        chat.say('Đã tạo lại các phòng chơi và xóa các người chơi!');
                        console.log('$ ROOM > RESET_ALL');
                        convo.end();
                    } else if (chatTxt.match(/\/kick.[0-9]+.[0-9]+/g)) {
                        let roomID = chatTxt.match(/[0-9]+/g)[0] - 1;
                        let userID = chatTxt.match(/[0-9]+/g)[1];
                        let leaveRole;
                        let player = gamef.getRoom(roomID).players[userID];
                        let playerJoinID = player.joinID;
                        if (!gamef.getRoom(roomID).ingame) {
                            gamef.getRoom(roomID).deletePlayerByID(userID);
                            gamef.setUserRoom(playerJoinID, undefined);
                            bot.say(playerJoinID, '```\nBạn đã bị kick ra khỏi phòng chơi do đã AFK quá lâu!\n```');
                            roomChatAll(bot, gamef.getRoom(roomID).players, playerJoinID, `\`\`\`\n${player.first_name} đã bị kick ra khỏi phòng chơi do đã AFK quá lâu!\n\`\`\``);
                        } else {
                            gamef.getRoom(roomID).killAction(player.id);
                            leaveRole = player.role;
                            bot.say(playerJoinID, '```\nBạn đã bị ADMIN sát hại do đã AFK quá lâu!\n```');
                            roomChatAll(bot, gamef.getRoom(roomID).players, playerJoinID, `\`\`\`\n${player.first_name} đã bị ADMIN sát hại (do AFK quá lâu) với vai trò là: ${leaveRole == -1 ? '🐺SÓI' : leaveRole == 1 ? '🔍TIÊN TRI' : leaveRole == 2 ? '🗿BẢO VỆ' : leaveRole == 3 ? '🔫THỢ SĂN' : '💩DÂN THƯỜNG'}\n\`\`\``);
                            gamef.getRoom(roomID).newLog(`\`\`\`\n${user.first_name} đã bị ADMIN sát hại (do AFK quá lâu) với vai trò là: ${leaveRole == -1 ? '🐺SÓI' : leaveRole == 1 ? '🔍TIÊN TRI' : leaveRole == 2 ? '🗿BẢO VỆ' : leaveRole == 3 ? '🔫THỢ SĂN' : '💩DÂN THƯỜNG'}\n\`\`\``);
                            if (gamef.getRoom(roomID).isNight) {
                                gamef.getRoom(roomID).roleIsDone((isDone) => {
                                    if (isDone) {
                                        nightDoneCheck(roomID);
                                    }
                                });
                            } else if (gamef.getRoom(roomID).isMorning) {
                                gamef.getRoom(roomID).roleIsDone((isDone) => {
                                    if (isDone) {
                                        dayVoteEnd(roomID);
                                    }
                                });
                            } else {
                                gamef.getRoom(roomID).roleIsDone((isDone) => {
                                    if (isDone) {
                                        yesNoVoteCheck(roomID);
                                    }
                                });
                            }
                        }
                        convo.say('Thành công!');
                        convo.end();
                        console.log(`$ ROOM ${roomID} > KICK PLAYER ${player.first_name}`);
                    } else {
                        convo.say(`Bạn đã hủy không thực hiện lệnh nào!`)
                        convo.end();
                    }
                }
            });
        };

        if (['2643770348982136', '2023444534356078', '2283562135018064'].indexOf(joinID) != -1) {
            console.log(`ADMIN ${joinID} (2643: DUY, 2023: LINH, 2283: TRƯỜNG)!`);
            chat.conversation((convo) => {
                askCMD(convo);
            });
        } else {
            chat.say('```\nBạn không có quyền thực hiện yêu cầu này!\n```');
        }
    });
};