const { voteConvo } = require('../Chat/Utils');
const { fireAction, cupidAction } = require('./VoteAction');

module.exports = (gamef, bot) => {
    const voteCallback = (payload, chat) => {
        let joinID = payload.sender.id;
        let userRoom = gamef.getUserRoom(joinID);
        if (userRoom != undefined && gamef.getRoom(userRoom).ingame) {
            let user = gamef.getRoom(userRoom).getPlayer(joinID);
            if (gamef.getRoom(userRoom).alivePlayer[joinID]) { // nếu còn sống
                let userRole = gamef.getRoom(userRoom).getRole(joinID);
                let playerList = gamef.getRoom(userRoom).getAlivePlayerList();
                if (gamef.getRoom(userRoom).isNight) { // ban đêm
                    if (gamef.getRoom(userRoom).nguyenID == joinID && gamef.getRoom(userRoom).wolfsCount == 1 && Object.keys(gamef.getRoom(userRoom).voteList).length == 0) { // kẻ bị sói nguyền
                        chat.say({
                            text: `Bạn phải chọn người muốn cắn trước!\nSói cuối cùng muốn cắn ai?`,
                            quickReplies: playerList,
                        });
                    } else if (userRole == -1 || userRole == -3) {// là SÓI / SÓI NGUYỀN
                        chat.say({
                            text: `Sói muốn cắn ai?`,
                            quickReplies: playerList,
                        });
                    } else if (userRole == 1) { // là tiên tri
                        chat.say({
                            text: `Tiên tri muốn soi ai?`,
                            quickReplies: playerList,
                        });
                    } else if (userRole == 2) { // là bảo vệ
                        chat.say({
                            text: `Bảo vệ muốn bảo vệ ai?`,
                            quickReplies: playerList,
                        });
                    } else if (userRole == 3) { // là thợ săn
                        voteConvo(chat, [{
                            txt: "Bạn muốn ghim hãy bắn chết luôn?",
                            qreply: ["ghim", "giết"],
                            callback: (convo, index, resTxt) => {
                                if (/^ghim$/.test(resTxt)) {
                                    return 1;
                                } else if (/^giết$/.test(resTxt)) {
                                    return 2;
                                } else {
                                    return null;
                                }
                            }
                        }, {
                            txt: "Bạn muốn ghim ai?",
                            qreply: playerList,
                            callback: (convo, index, resTxt) => {
                                let type = convo.get(`data[${index - 1}]`);
                                let voteID;
                                if (/[0-9]+:.+|-1/g.test(resTxt)) {
                                    voteID = resTxt.match(/-?[0-9]+/g)[0];
                                } else {
                                    return null;
                                }
                                if (type == 1) { // ghim
                                    fireAction(gamef, bot, chat, userRoom, joinID, voteID, false);
                                    return true;
                                } else if (type == 2) { // bắn
                                    fireAction(gamef, bot, chat, userRoom, joinID, voteID, true);
                                    return true;
                                } else {
                                    return null;
                                }
                            }
                        }])
                    } else if (userRole == 5) { // là phù thủy
                        chat.say({
                            text: `Bạn muốn giết ai?`,
                            quickReplies: playerList,
                        });
                    } else if (userRole == 7) { // là thần tình yêu
                        voteConvo(chat, [{
                            txt: "Chọn người thứ nhất:",
                            qreply: playerList,
                            callback: (convo, index, resTxt) => {
                                if (/[0-9]+:.+/g.test(resTxt)) {
                                    return resTxt.match(/[0-9]+/g)[0];
                                } else {
                                    return null;
                                }
                            }
                        }, {
                            txt: "Chọn người thứ hai:",
                            qreply: playerList,
                            callback: (convo, index, resTxt) => {
                                let user1ID = convo.get(`data[${index - 1}]`);
                                if (!user1ID) {
                                    return null;
                                }
                                let user2ID;
                                if (/[0-9]+:.+/g.test(resTxt)) {
                                    user2ID = resTxt.match(/[0-9]+/g)[0];
                                    cupidAction(gamef, bot, chat, userRoom, joinID, user1ID, user2ID);
                                    return true;
                                } else {
                                    return null;
                                }

                            }
                        }])
                    } else {
                        chat.say(`Bạn không có chức năng gì để thực hiện!`);
                    }
                } else { // BAN NGÀY
                    if (gamef.getRoom(userRoom).isMorning) { // giai đoạn nói chuyện và /vote
                        if (!gamef.getRoom(userRoom).roleDone[joinID]) {
                            chat.say({
                                text: `Bạn muốn treo cổ ai?`,
                                quickReplies: playerList,
                            });
                        } else {
                            chat.say(`Bạn đã vote rồi!`);
                        }
                    } else { // giai đoạn /treo /tha
                        chat.say({
                            text: `Treo hay tha?`,
                            quickReplies: ["/treo", "/tha"],
                        });
                    }
                }
            } else {
                chat.say('```\nBạn đã chết!\n```');
            }
        } else {
            chat.say('```\nBạn chỉ được dùng chức năng này khi đang chơi!\n```');
        }
    };

    // listen USER_RENAME message
    bot.on('postback:VOTE', voteCallback);
    bot.hear(/^\/evote$/, voteCallback);
};