const { roomChatAll } = require('../Chat/Utils');
const { wolfVote, seerAction, saveAction, dayVote } = require('./VoteAction');

module.exports = (gamef, bot) => {
    const voteConvo = (chat, playerListTxt, askTxt, actionCallback) => {
        chat.conversation((convo) => {
            convo.ask({
                text: askTxt,
                quickReplies: playerListTxt,
            }, (payload, convo) => {
                let resTxt = payload.message ? payload.message.text.match(/[0-9]+/g) : undefined;
                if (resTxt && resTxt[0]) {
                    let voteID = resTxt[0];
                    actionCallback(convo, voteID);
                    convo.end();
                } else {
                    convo.say(`Vui lòng thử lại!`);
                    convo.end();
                }
            });
        });
    }
    const voteCallback = (payload, chat) => {
        let joinID = payload.sender.id;
        let userRoom = gamef.getUserRoom(joinID);
        if (userRoom != undefined && gamef.getRoom(userRoom).ingame) {
            let user = gamef.getRoom(userRoom).getPlayer(joinID);
            if (gamef.getRoom(userRoom).alivePlayer[joinID]) { // nếu còn sống
                let userRole = gamef.getRoom(userRoom).getRole(joinID);
                let counter = 0;
                let playerListTxt = gamef.getRoom(userRoom).playersTxt.filter((e) => {
                    if (counter < 11 && e[0] != '💀'[0]) {
                        counter++;
                        return true;
                    }
                    return false;
                });
                if (gamef.getRoom(userRoom).isNight) { // ban đêm
                    if (userRole == -1 || userRole == -3) {// là SÓI / SÓI NGUYỀN
                        voteConvo(chat, playerListTxt, `Sói muốn cắn ai?`, (convo, voteID) => {
                            wolfVote(gamef, bot, convo, userRoom, joinID, voteID);
                        })
                    } else if (userRole == 1) { // là tiên tri
                        voteConvo(chat, playerListTxt, `Tiên tri muốn soi ai?`, (convo, voteID) => {
                            seerAction(gamef, bot, convo, user, userRoom, joinID, voteID);
                        });
                    } else if (userRole == 2) { // là bảo vệ
                        voteConvo(chat, playerListTxt, `Bảo vệ muốn bảo vệ ai?`, (convo, voteID) => {
                            saveAction(gamef, bot, convo, userRoom, joinID, voteID);
                        });
                    } else {
                        chat.say(`Tính năng này chưa được hỗ trợ! Vui lòng nhắn đúng cú pháp để thực hiện chức năng của mình`);
                    }
                } else { // BAN NGÀY
                    if (gamef.getRoom(userRoom).isMorning) { // giai đoạn nói chuyện và /vote
                        if (!gamef.getRoom(userRoom).roleDone[joinID]) {
                            voteConvo(chat, playerListTxt, `Bạn muốn treo cổ ai?`, (convo, voteID) => {
                                dayVote(gamef, bot, convo, user, userRoom, joinID, voteID);
                            });
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