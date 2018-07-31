const { roomChatAll, roomWolfChatAll } = require('../Chat/Utils');
const nightDoneCheck = require('../Night/nightDoneCheck');
const dayVoteCheck = require('../Day/dayVoteCheck');

module.exports = (gamef, bot) => {
    // listen for ROOM CHAT and VOTE
    bot.on('message', (payload, chat, data) => {
        if (data.captured) { return; }

        const joinID = payload.sender.id;
        const chatTxt = payload.message.text;
        const userRoom = gamef.getUserRoom(joinID);

        if (userRoom == undefined) {
            chat.say({
                text: `\`\`\`\nBạn chưa tham gia phòng chơi nào!\n\`\`\``,
                quickReplies: ['help', 'trợ giúp']
            });
            return;
        }
        let user = gamef.getRoom(userRoom).getPlayer(joinID);
        if (gamef.getRoom(userRoom).alivePlayer[joinID]) { // nếu còn sống
            if (gamef.getRoom(userRoom).isNight) { // ban đêm
                let userRole = gamef.getRoom(userRoom).getRole(joinID);
                if (userRole == -1) {// là SÓI
                    if (!chatTxt.match(/\/vote.-?[0-9]+/g)) {//chat
                        if (gamef.getRoom(userRoom).chatON) {
                            roomWolfChatAll(bot, gamef.getRoom(userRoom).players, joinID, '*' + user.first_name + '*: ' + chatTxt);
                        }
                    } else {// SÓI VOTE
                        let voteID = chatTxt.match(/-?[0-9]+/g)[0];
                        const start = async () => {
                            //vote
                            if (gamef.getRoom(userRoom).vote(joinID, voteID)) {
                                if (voteID == -1) { //ăn chay (phiếu trống)
                                    await chat.say(`🍴Bạn đã vote ăn chay!`);
                                    roomWolfChatAll(bot, gamef.getRoom(userRoom).players, joinID, '🍴' + user.first_name + ' đã vote ăn chay!');
                                } else {
                                    let voteKill = gamef.getRoom(userRoom).playersTxt[voteID];
                                    await chat.say(`🍗Bạn đã vote cắn ${voteKill}`);
                                    roomWolfChatAll(bot, gamef.getRoom(userRoom).players, joinID, '🍗' + user.first_name + ' đã vote cắn ' + voteKill);
                                }
                            } else {
                                chat.say("```\nBạn không thể thực hiện vote 2 lần hoặc vote người chơi đã chết!\n```");
                            }
                            // kiểm tra đã VOTE xong chưa?
                            gamef.func(nightDoneCheck, bot, userRoom);
                        }
                        start();
                    }
                } else if (userRole == 1) { // là tiên tri
                    if (chatTxt.match(/\/see.[0-9]+/g)) {//see
                        const startTT = async () => {
                            if (!gamef.getRoom(userRoom).roleDone[joinID]) { // chưa soi ai
                                let voteID = chatTxt.match(/[0-9]+/g)[0];
                                let role = gamef.getRoom(userRoom).getRoleByID(voteID);
                                await chat.say(`${voteID} là ${role == -1 ? '🐺SÓI' : role == 1 ? '🔍TIÊN TRI, Bạn đùa tớ à :v' : '💩PHE DÂN'}`);
                                gamef.getRoom(userRoom).newLog(`🔍${user.first_name} soi *${gamef.getRoom(userRoom).playersTxt[voteID]}* ra ${role == -1 ? '🐺SÓI' : role == 1 ? 'TỰ SOI MÌNH! GG' : '💩PHE DÂN'}`);
                                gamef.getRoom(userRoom).roleDoneBy(joinID);
                            } else {
                                chat.say('```\nBạn không thể soi 2 lần!\n```');
                            }
                            // kiểm tra đã hết đêm chưa?
                            gamef.func(nightDoneCheck, bot, userRoom);
                        }
                        startTT();
                    } else {
                        chat.say('```\nBạn không thể trò chuyện trong đêm!\n```');
                    }
                } else if (userRole == 2) { // là bảo vệ
                    if (chatTxt.match(/\/save.[0-9]+/g)) {//save
                        let voteID = chatTxt.match(/[0-9]+/g)[0];
                        if (!gamef.getRoom(userRoom).save(joinID, voteID)) {
                            chat.say(`\`\`\`\nBạn không thể bảo vệ 1 người 2 đêm liên tiếp hoặc bảo vệ người chơi đã chết!\n\`\`\``);
                        } else {
                            chat.say(`🗿Bạn đã bảo vệ ${gamef.getRoom(userRoom).playersTxt[voteID]}!`);
                            // kiểm tra đã hết đêm chưa?
                            gamef.func(nightDoneCheck, bot, userRoom);
                        }
                    } else {
                        chat.say('```\nBạn không thể trò chuyện trong đêm!\n```');
                    }
                } else if (userRole == 3) { // là thợ săn
                    if (chatTxt.match(/\/fire.-?[0-9]+/g)) {//fire
                        let voteID = chatTxt.match(/-?[0-9]+/g)[0];
                        if (!gamef.getRoom(userRoom).fire(joinID, voteID)) {
                            chat.say(`\`\`\`\nBạn không thể ngắm bắn 1 người 2 đêm liên tiếp hoặc người chơi đã chết!\n\`\`\``);
                        } else {
                            if (voteID != -1) {
                                chat.say(`🔫Bạn đã ngắm bắn ${gamef.getRoom(userRoom).playersTxt[voteID]}!`);
                                gamef.getRoom(userRoom).newLog(`🔫Thợ săn đã ngắm bắn ${gamef.getRoom(userRoom).playersTxt[voteID]}!`);
                            } else {
                                chat.say(`🔫Bạn đã ngắm bắn lên trời!`);
                                gamef.getRoom(userRoom).newLog(`🔫Thợ săn đã ngắm bắn lên trời!`)
                            }

                            // kiểm tra đã hết đêm chưa?
                            gamef.func(nightDoneCheck, bot, userRoom);
                        }
                    } else {
                        chat.say('```\nBạn không thể trò chuyện trong đêm!\n```');
                    }
                } else if (userRole == 5) { // là phù thủy
                    if (gamef.getRoom(userRoom).witchKillRemain) {
                        if (chatTxt.match(/\/kill.[0-9]+/g)) {// giết
                            let voteID = chatTxt.match(/[0-9]+/g)[0];
                            if (!gamef.getRoom(userRoom).witchKillVote(voteID)) {
                                chat.say(`\`\`\`\nBạn không thể giết người chơi đã chết!\n\`\`\``);
                            } else {
                                chat.say(`⛔Bạn đã giết ${gamef.getRoom(userRoom).playersTxt[voteID]}!`);
                                gamef.getRoom(userRoom).roleDoneBy(joinID);
                                gamef.getRoom(userRoom).newLog(`⛔Phù thủy ${gamef.getRoom(userRoom).getPlayer(gamef.getRoom(userRoom).witchID).first_name} đã giết ${gamef.getRoom(userRoom).playersTxt[voteID]}!`)
                                // kiểm tra đã hết đêm chưa?
                                gamef.func(nightDoneCheck, bot, userRoom);
                            }
                        } else if (chatTxt.match(/\/skip/g)) {
                            chat.say('🎊Bạn đã không giết ai!');
                            gamef.getRoom(userRoom).roleDoneBy(joinID);
                            // kiểm tra đã hết đêm chưa?
                            gamef.func(nightDoneCheck, bot, userRoom);
                        } else {
                            chat.say('```\nBạn không thể trò chuyện trong đêm!\n```');
                        }
                    } else {
                        chat.say('```\nBạn không thể trò chuyện trong đêm!\n```');
                    }
                }
            } else {
                if (!gamef.getRoom(userRoom).isNight) {// ban NGÀY, mọi người thảo luận
                    if (!chatTxt.match(/\/vote.-?[0-9]+/g)) {
                        if (!chatTxt.match(/\/yes/g) && !chatTxt.match(/\/no/g)) {
                            if (gamef.getRoom(userRoom).chatON || (gamef.getRoom(userRoom).deathID != -1 && gamef.getRoom(userRoom).deathID === gamef.getRoom(userRoom).getPlayer(joinID).id)) { //check xem còn bật chat không?
                                roomChatAll(bot, gamef.getRoom(userRoom).players, joinID, '*' + user.first_name + '*: ' + chatTxt);
                            } else {
                                chat.say('```\nBạn không thể trò chuyện\n```');
                            }
                        } else {  //VOTE YES?NO
                            if (gamef.getRoom(userRoom).deathID != -1) {
                                if (chatTxt.match(/\/yes/g)) { //vote treo cổ
                                    gamef.getRoom(userRoom).killOrSaveVote(joinID, true);
                                    chat.say(`👎Bạn đã vote treo! (${gamef.getRoom(userRoom).saveOrKill})`);
                                    roomChatAll(bot, gamef.getRoom(userRoom).players, joinID, `👎${user.first_name} đã vote treo! (${gamef.getRoom(userRoom).saveOrKill})`);
                                } else { //vote tha
                                    gamef.getRoom(userRoom).killOrSaveVote(joinID, false);
                                    chat.say(`👍Bạn đã vote tha! (${gamef.getRoom(userRoom).saveOrKill})`);
                                    roomChatAll(bot, gamef.getRoom(userRoom).players, joinID, `👍${user.first_name} đã vote tha! (${gamef.getRoom(userRoom).saveOrKill})`);
                                }
                                gamef.func(yesNoVoteCheck, bot, userRoom);
                            }
                        }
                    } else {
                        // VOTE TREO CỔ
                        let voteID = chatTxt.match(/-?[0-9]+/g)[0];
                        const start = async () => {
                            if (gamef.getRoom(userRoom).vote(joinID, voteID)) {
                                if (voteID == -1) {
                                    await chat.say(`Bạn đã từ chối bỏ phiếu!`);
                                    await roomChatAll(bot, gamef.getRoom(userRoom).players, joinID, `${user.first_name} đã từ chối bỏ phiếu (${gamef.getRoom(userRoom).voteList[voteID]} phiếu)`);
                                } else {
                                    let voteKill = gamef.getRoom(userRoom).playersTxt[voteID];
                                    await chat.say(`😈Bạn đã vote treo cổ ${voteKill} (${gamef.getRoom(userRoom).voteList[voteID]} phiếu)`);
                                    await roomChatAll(bot, gamef.getRoom(userRoom).players, joinID, `😈${user.first_name} đã vote treo cổ ${voteKill} (${gamef.getRoom(userRoom).voteList[voteID]} phiếu)`);
                                }
                            } else {
                                chat.say('```\nBạn không thể vote 2 lần hoặc vote người chơi đã chết!\n```');
                            }
                            // kiểm tra đã VOTE XONG chưa?
                            gamef.getRoom(userRoom).roleIsDone((isDone) => {
                                if (isDone) {
                                    gamef.func(dayVoteCheck, bot, userRoom);
                                }
                            });
                        }
                        start();
                    }
                }
            }
        } else {
            chat.say('```\nBạn đã chết! Xin giữ im lặng! \n```')
        }
        console.log(`$ ROOM ${userRoom + 1} CHAT > ${user.first_name}: ${chatTxt}`);
    });
};