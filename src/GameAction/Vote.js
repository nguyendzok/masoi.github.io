const { roomChatAll } = require('../Chat/Utils');
const { wolfVote, seerAction, saveAction, fireAction, dayVote } = require('./VoteAction');

module.exports = (gamef, bot) => {
    const voteConvo = (chat, askSeq) => {
        chat.conversation((convo) => {
            let len = askSeq.length;
            askSeq.forEach((askItem, index) => {
                convo.ask(askItem.qreply ? {
                    text: askItem.txt,
                    quickReplies: askItem.qreply,
                } : askItem.txt, (payload, convo) => {
                    let resTxt = payload.message ? payload.message.text : undefined;
                    if (resTxt) {
                        let result = askItem.callback(convo, index, resTxt);
                        if (ret) {
                            convo.set(`data[${index}]`, result);
                        } else {
                            convo.say(`Vui lòng thử lại!`);
                            convo.end();
                        }
                    } else {
                        convo.say(`Vui lòng thử lại!`);
                        convo.end();
                    }
                });
            });
            convo.end();
        });
    }
    const voteCallback = (payload, chat) => {
        let joinID = payload.sender.id;
        let userRoom = gamef.getUserRoom(joinID);
        if (userRoom != undefined && gamef.getRoom(userRoom).ingame) {
            let user = gamef.getRoom(userRoom).getPlayer(joinID);
            if (gamef.getRoom(userRoom).alivePlayer[joinID]) { // nếu còn sống
                let userRole = gamef.getRoom(userRoom).getRole(joinID);
                let playerList = gamef.getRoom(userRoom).getAlivePlayerList();
                if (gamef.getRoom(userRoom).isNight) { // ban đêm
                    if (userRole == -1 || userRole == -3) {// là SÓI / SÓI NGUYỀN
                        chat.say({
                            text: `Sói muốn cắn ai?`,
                            quickReplies: playerList,
                        });
                        // voteConvo(chat, playerList, `Sói muốn cắn ai?`, (convo, voteID) => {
                        //     wolfVote(gamef, bot, convo, userRoom, joinID, voteID);
                        // })
                    } else if (userRole == 1) { // là tiên tri
                        chat.say({
                            text: `Tiên tri muốn soi ai?`,
                            quickReplies: playerList,
                        });
                        // voteConvo(chat, playerList, `Tiên tri muốn soi ai?`, (convo, voteID) => {
                        //     seerAction(gamef, bot, convo, user, userRoom, joinID, voteID);
                        // });
                    } else if (userRole == 2) { // là bảo vệ
                        chat.say({
                            text: `Bảo vệ muốn bảo vệ ai?`,
                            quickReplies: playerList,
                        });
                        // voteConvo(chat, playerList, `Bảo vệ muốn bảo vệ ai?`, (convo, voteID) => {
                        //     saveAction(gamef, bot, convo, userRoom, joinID, voteID);
                        // });
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
                                if (/[0-9]:.+|-1/g.test(resTxt)) {
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
                    } else {
                        chat.say(`Tính năng này chưa được hỗ trợ! Vui lòng nhắn đúng cú pháp để thực hiện chức năng của mình`);
                    }
                } else { // BAN NGÀY
                    if (gamef.getRoom(userRoom).isMorning) { // giai đoạn nói chuyện và /vote
                        if (!gamef.getRoom(userRoom).roleDone[joinID]) {
                            chat.say({
                                text: `Bạn muốn treo cổ ai?`,
                                quickReplies: playerList,
                            });
                            // voteConvo(chat, playerList, `Bạn muốn treo cổ ai?`, (convo, voteID) => {
                            //     dayVote(gamef, bot, convo, user, userRoom, joinID, voteID);
                            // });
                        } else {
                            chat.say(`Bạn đã vote rồi!`);
                        }
                    } else { // giai đoạn /treo /tha
                        chat.say(`Tính năng này chưa được hỗ trợ! Vui lòng nhắn đúng cú pháp để thực hiện chức năng của mình`);
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
    bot.hear([/\/evote/g, /\/action/g], voteCallback);
};