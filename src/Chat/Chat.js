const { roomChatAll, roomWolfChatAll } = require('../Chat/Utils');
const nightDoneCheck = require('../Night/nightDoneCheck');
const dayVoteCheck = require('../Day/dayVoteCheck');
const yesNoVoteCheck = require('../Day/yesNoVoteCheck');

module.exports = (gamef, bot) => {
    // listen for ROOM CHAT and VOTE
    bot.on('message', (payload, chat, data) => {
        if (data.captured) { return; }

        const joinID = payload.sender.id;
        const chatTxt = payload.message.text;
        const userRoom = gamef.getUserRoom(joinID);

        if (userRoom == undefined) {
            chat.say({
                text: `\`\`\`\nBạn chưa tham gia phòng chơi nào!\nChọn /join để tham gia 1 phòng chơi\nNếu chưa hiểu cách chơi, chọn /help\n\`\`\``,
                quickReplies: ['/join', '/help']
            });
            return;
        }
        const start = async () => {
            let user = gamef.getRoom(userRoom).getPlayer(joinID);
            if (gamef.getRoom(userRoom).alivePlayer[joinID]) { // nếu còn sống
                if (gamef.getRoom(userRoom).cupidsID.indexOf(joinID) != -1) { // cặp đôi
                    if (/\/p\s.+/g.test(chatTxt)) { //private chat
                        let newChatTxt = chatTxt.match(/(?<=\/p\s).*/g)
                        bot.sendAction(joinID, 'mark_seen');
                        return roomWolfChatAll(bot, gamef.getRoom(userRoom).cupidsID, joinID, '*' + user.first_name + '* (cặp đôi): ' + newChatTxt);
                    }
                }
                if (gamef.getRoom(userRoom).isNight) { // ban đêm
                    let userRole = gamef.getRoom(userRoom).getRole(joinID);

                    //KẺ PHẢN BỘI
                    if (gamef.getRoom(userRoom).nguyenID == joinID) {
                        if (/\/p\s.+/g.test(chatTxt)) { //private chat
                            let newChatTxt = chatTxt.match(/(?<=\/p\s).*/g)
                            bot.sendAction(joinID, 'mark_seen');
                            return roomWolfChatAll(bot, gamef.getRoom(userRoom).wolfsID, joinID, '*' + user.first_name + '* (kẻ phản bội): ' + newChatTxt);
                        } else if (/^\/vote\s-?[0-9]+$/.test(chatTxt)) {
                            if (gamef.getRoom(userRoom).wolfsCount == 1) { // còn một mình kẻ bị sói nguyền
                                let voteID = chatTxt.match(/-?[0-9]+/g)[0];
                                if (gamef.getRoom(userRoom).justVote(voteID)) {
                                    chat.say('```\nBạn đã cắn ' + gamef.getRoom(userRoom).playersTxt[voteID] + '\n```');
                                } else {
                                    chat.say('```\nBạn chỉ có thể cắn người còn sống!\n```');
                                }

                            } else {
                                chat.say('```\nBạn chỉ có thể cắn khi là con sói cuối cùng còn sống sót!\n```');
                            }
                        }
                    }

                    if (userRole == -1 || userRole == -3) {// là SÓI / SÓI NGUYỀN
                        if (!/^\/vote\s-?[0-9]+$/.test(chatTxt) && !/[0-9]:.+|-1/g.test(chatTxt)) {
                            if (gamef.getRoom(userRoom).chatON) {
                                roomWolfChatAll(bot, gamef.getRoom(userRoom).wolfsID, joinID, '*' + user.first_name + '*(sói): ' + chatTxt);
                                bot.sendAction(joinID, 'mark_seen');
                            }
                        } else {// SÓI VOTE
                            let voteID = chatTxt.match(/-?[0-9]+/g)[0];
                            let villagerList = gamef.getRoom(userRoom).getAliveVillagerList();
                            //vote
                            if (gamef.getRoom(userRoom).vote(joinID, voteID)) {
                                if (voteID == -1) { //ăn chay (phiếu trống)
                                    await chat.say(`🍴Bạn đã vote ăn chay!`);
                                    roomWolfChatAll(bot, gamef.getRoom(userRoom).wolfsID, joinID, {
                                        text: '🍴' + user.first_name + ' đã vote ăn chay!',
                                        quickReplies: villagerList,
                                    });
                                } else {
                                    let voteKill = gamef.getRoom(userRoom).playersTxt[voteID];
                                    await chat.say(`🍗Bạn đã vote cắn ${voteKill}`);
                                    roomWolfChatAll(bot, gamef.getRoom(userRoom).wolfsID, joinID, {
                                        text: '🍗' + user.first_name + ' đã vote cắn ' + voteKill,
                                        quickReplies: villagerList,
                                    });
                                }
                            } else {
                                chat.say("```\nBạn không thể thực hiện vote 2 lần hoặc vote người chơi đã chết!\n```");
                            }
                            // kiểm tra đã VOTE xong chưa?
                            gamef.func(nightDoneCheck, bot, userRoom);

                        }
                    } else if (userRole == 1) { // là tiên tri
                        if (chatTxt.match(/\/see.[0-9]+/g) || /[0-9]:.+/g.test(chatTxt)) {//see
                            let voteID = chatTxt.match(/[0-9]+/g)[0];
                            gamef.getRoom(userRoom).see(joinID, voteID, async (role) => {
                                await chat.say(`${voteID} là ${(role == -1) ? '🐺SÓI' : role == 1 ? '🔍TIÊN TRI, Bạn đùa tớ à :v' : '💩PHE DÂN'}`);
                                if (gamef.getRoom(userRoom).oldManID != undefined && gamef.getRoom(userRoom).oldManLive <= 0) { // già làng chết
                                    gamef.getRoom(userRoom).newLog(`🔍${user.first_name} soi *${gamef.getRoom(userRoom).playersTxt[voteID]}* ra 💩AUTO DÂN`);
                                } else {
                                    gamef.getRoom(userRoom).newLog(`🔍${user.first_name} soi *${gamef.getRoom(userRoom).playersTxt[voteID]}* ra ${(role == -1) ? '🐺SÓI' : role == 1 ? '🔍TỰ SOI MÌNH' : '💩PHE DÂN'}`);
                                }
                            }, (err) => {
                                chat.say('```\nBạn không thể soi 2 lần hoặc soi người chơi đã chết!\n```');
                            })
                            // kiểm tra đã hết đêm chưa?
                            gamef.func(nightDoneCheck, bot, userRoom);
                        } else {
                            if (gamef.getRoom(userRoom).nguyenID == joinID && /^\/vote\s-?[0-9]+$/.test(chatTxt)) {
                                return;
                            }
                            if (gamef.getRoom(userRoom).roleDone[joinID]) {
                                chat.say('```\nBạn không thể trò chuyện trong đêm!\n```');
                            } else {
                                chat.say('```\nCú pháp sai! Vui lòng thử lại!\nVD: "/see 1" để soi người chơi số 1\n```');
                            }
                        }
                    } else if (userRole == 2) { // là bảo vệ
                        if (chatTxt.match(/\/save.[0-9]+/g) || /[0-9]:.+/g.test(chatTxt)) {//save
                            let voteID = chatTxt.match(/[0-9]+/g)[0];
                            if (!gamef.getRoom(userRoom).save(joinID, voteID)) {
                                chat.say(`\`\`\`\nBạn không thể bảo vệ 1 người 2 đêm liên tiếp hoặc bảo vệ người chơi đã chết!\n\`\`\``);
                            } else {
                                await chat.say(`🗿Bạn đã bảo vệ ${gamef.getRoom(userRoom).playersTxt[voteID]}!`);
                                // kiểm tra đã hết đêm chưa?
                                gamef.func(nightDoneCheck, bot, userRoom);
                            }
                        } else {
                            if (gamef.getRoom(userRoom).nguyenID == joinID && /^\/vote\s-?[0-9]+$/.test(chatTxt)) {
                                return;
                            }
                            if (gamef.getRoom(userRoom).roleDone[joinID]) {
                                chat.say('```\nBạn không thể trò chuyện trong đêm!\n```');
                            } else {
                                chat.say('```\nCú pháp sai! Vui lòng thử lại!\nVD: "/save 1" để bảo vệ người chơi số 1\n```');
                            }
                        }
                    } else if (userRole == 3) { // là thợ săn
                        if (/\/fire\s-?[0-9]+/g.test(chatTxt) || /\/kill\s-?[0-9]+/g.test(chatTxt)) {//fire
                            let fireKill = false;
                            if (/\/kill\s-?[0-9]+/g.test(chatTxt)) {
                                fireKill = true;
                            }
                            let voteID = chatTxt.match(/-?[0-9]+/g)[0];
                            if (!gamef.getRoom(userRoom).fire(joinID, voteID, fireKill)) {
                                if (!fireKill) { // bị động
                                    chat.say(`\`\`\`\nBạn không thể ghim 1 người 2 đêm liên tiếp hoặc ghim người đã chết!\n\`\`\``);
                                } else { // chủ động
                                    chat.say(`\`\`\`\nBạn chỉ được giết người còn sống!\n\`\`\``);
                                }
                            } else {
                                if (voteID != -1) {
                                    await chat.say(`🔫Bạn đã ghim ${gamef.getRoom(userRoom).playersTxt[voteID]}!`);
                                    gamef.getRoom(userRoom).newLog(`🔫Thợ săn đã ghim *${gamef.getRoom(userRoom).playersTxt[voteID]}* !`);
                                } else {
                                    await chat.say(`🔫Bạn đã bắn lên trời (không ghim ai)!`);
                                    gamef.getRoom(userRoom).newLog(`🔫Thợ săn đã bắn lên trời (không ghim ai)!`)
                                }
                                // kiểm tra đã hết đêm chưa?
                                gamef.func(nightDoneCheck, bot, userRoom);
                            }
                        } else {
                            if (gamef.getRoom(userRoom).nguyenID == joinID && /^\/vote\s-?[0-9]+$/.test(chatTxt)) {
                                return;
                            }
                            if (gamef.getRoom(userRoom).roleDone[joinID]) {
                                chat.say('```\nBạn không thể trò chuyện trong đêm!\n```');
                            } else {
                                chat.say('```\nCú pháp sai! Vui lòng thử lại!\nVD: "/fire 1" để ghim người chơi số 1\n"/fire -1" để bắn lên trời\n```');
                            }
                        }
                    } else if (userRole == 5) { // là phù thủy
                        if (gamef.getRoom(userRoom).witchKillRemain) {
                            if (chatTxt.match(/\/kill.[0-9]+/g)) {// giết
                                let voteID = chatTxt.match(/[0-9]+/g)[0];
                                if (!gamef.getRoom(userRoom).witchKillVote(voteID)) {
                                    chat.say(`\`\`\`\nBạn không thể giết người chơi đã chết!\n\`\`\``);
                                } else {
                                    await chat.say(`⛔Bạn đã giết ${gamef.getRoom(userRoom).playersTxt[voteID]}!`);
                                    gamef.getRoom(userRoom).newLog(`⛔Phù thủy ${gamef.getRoom(userRoom).getPlayer(gamef.getRoom(userRoom).witchID).first_name} đã giết *${gamef.getRoom(userRoom).playersTxt[voteID]}* !`)
                                    // kiểm tra đã hết đêm chưa?
                                    gamef.func(nightDoneCheck, bot, userRoom);
                                }
                            } else if (chatTxt.match(/\/skip/g)) {
                                await chat.say('🎊Bạn bạn không cần phải skip!');
                            } else {
                                if (gamef.getRoom(userRoom).nguyenID == joinID && /^\/vote\s-?[0-9]+$/.test(chatTxt)) {
                                    return;
                                }
                                if (gamef.getRoom(userRoom).roleDone[joinID]) {
                                    chat.say('```\nBạn không thể trò chuyện trong đêm!\n```');
                                } else {
                                    chat.say('```\nCú pháp sai! Vui lòng thử lại!\nVD: "/kill 1" để giết người chơi số 1\n"/skip" để bỏ qua\n```');
                                }
                            }
                        } else {
                            chat.say('```\nBạn không thể trò chuyện trong đêm!\n```');
                        }
                    } else if (userRole == 7) { // là THẦN TÌNH YÊU cupid
                        if (chatTxt.match(/\/cupid.[0-9]+.[0-9]+/g)) {// ghép cặp
                            let voteID1 = parseInt(chatTxt.match(/[0-9]+/g)[0]);
                            let voteID2 = parseInt(chatTxt.match(/[0-9]+/g)[1]);
                            if (!gamef.getRoom(userRoom).cupid(joinID, voteID1, voteID2)) {
                                chat.say(`\`\`\`\nBạn chỉ được ghép đôi (1 lần duy nhất) 2 người tồn tại!\n\`\`\``);
                            } else {
                                await chat.say(`👼Bạn đã ghép cặp ${gamef.getRoom(userRoom).playersTxt[voteID1]} với ${gamef.getRoom(userRoom).playersTxt[voteID2]}!\nBạn đã hoàn thành nhiệm vụ và trở thành DÂN!`);
                                gamef.getRoom(userRoom).newLog(`👼CUPID đã ghép cặp *${gamef.getRoom(userRoom).playersTxt[voteID1]}* với *${gamef.getRoom(userRoom).playersTxt[voteID2]}* !`)
                                let user1 = gamef.getRoom(userRoom).players[voteID1];
                                let user2 = gamef.getRoom(userRoom).players[voteID2];
                                let thirdParty = ``;
                                if (gamef.getRoom(userRoom).cupidTeam) {
                                    thirdParty = `👼Bạn giờ thuộc phe thứ 3 CẶP ĐÔI`;
                                }
                                bot.say(user1.joinID, `\`\`\`\n${thirdParty}\n👼Bạn đã bị ghép đôi với ${user2.first_name}\n/p <nội dung> để chat riêng\n\`\`\``);
                                bot.say(user2.joinID, `\`\`\`\n${thirdParty}\n👼Bạn đã bị ghép đôi với ${user1.first_name}\n/p <nội dung> để chat riêng\n\`\`\``);

                                roomChatAll(bot, gamef.getRoom(userRoom).players, joinID, '```\n👼Thần tình yêu đã ghép đôi thành công\n```');
                                // kiểm tra đã hết đêm chưa?
                                gamef.func(nightDoneCheck, bot, userRoom);
                            }
                        } else {
                            if (gamef.getRoom(userRoom).nguyenID == joinID && /^\/vote\s-?[0-9]+$/.test(chatTxt)) {
                                return;
                            }
                            if (gamef.getRoom(userRoom).roleDone[joinID]) {
                                chat.say('```\nBạn không thể trò chuyện trong đêm!\n```');
                            } else {
                                chat.say('```\nCú pháp sai! Vui lòng thử lại!\nVD: "/cupid 1 2" để ghép đôi người chơi số 1 với số 2\n```');
                            }
                        }
                    }
                } else {// ban NGÀY, mọi người thảo luận
                    if (!/^\/vote\s-?[0-9]+$/.test(chatTxt) && !/[0-9]:.+|-1/g.test(chatTxt)) {
                        if (!chatTxt.match(/\/treo/g) && !chatTxt.match(/\/tha/g)) {
                            if (gamef.getRoom(userRoom).chatON || (gamef.getRoom(userRoom).deathID != -1 && gamef.getRoom(userRoom).deathID == gamef.getRoom(userRoom).getPlayer(joinID).id)) { //check xem còn bật chat không?
                                roomChatAll(bot, gamef.getRoom(userRoom).players, joinID, '*' + user.first_name + '*: ' + chatTxt);
                                bot.sendAction(joinID, 'mark_seen');
                            } else {
                                chat.say({
                                    text: '```\nĐã hết thời gian thảo luận!\nĐể vote bây giờ, chọn "/action"\n```',
                                    quickReplies: ["/action", "help"],
                                });
                            }
                        } else {  //VOTE YES?NO
                            if (gamef.getRoom(userRoom).deathID != -1 && !gamef.getRoom(userRoom).roleDone[joinID]) {
                                if (chatTxt.match(/\/treo/g)) { //vote treo cổ
                                    gamef.getRoom(userRoom).killOrSaveVote(joinID, true);
                                    await chat.say(`*👎Bạn đã vote treo! (${gamef.getRoom(userRoom).saveOrKill})*`);
                                    roomChatAll(bot, gamef.getRoom(userRoom).players, joinID, {
                                        text: `*👎${user.first_name} đã vote treo! (${gamef.getRoom(userRoom).saveOrKill})*`,
                                        quickReplies: ["/treo", "/tha"],
                                    });
                                } else { //vote tha
                                    gamef.getRoom(userRoom).killOrSaveVote(joinID, false);
                                    await chat.say(`*👍Bạn đã vote tha! (${gamef.getRoom(userRoom).saveOrKill})*`);
                                    roomChatAll(bot, gamef.getRoom(userRoom).players, joinID, {
                                        text: `*👍${user.first_name} đã vote tha! (${gamef.getRoom(userRoom).saveOrKill})*`,
                                        quickReplies: ["/treo", "/tha"],
                                    });
                                }
                                gamef.func(yesNoVoteCheck, bot, userRoom);
                            } else {
                                chat.say('```\nBạn đã bỏ phiếu rồi!\n```');
                            }
                        }
                    } else {
                        // VOTE TREO CỔ
                        let voteID = chatTxt.match(/-?[0-9]+/g)[0];
                        let playerList = gamef.getRoom(userRoom).getAlivePlayerList();
                        if (gamef.getRoom(userRoom).vote(joinID, voteID)) {
                            if (voteID == -1) {
                                await chat.say(`*✊Bạn đã từ chối bỏ phiếu!*`);
                                roomChatAll(bot, gamef.getRoom(userRoom).players, joinID, {
                                    text: `*✊${user.first_name} đã từ chối bỏ phiếu*`,
                                    quickReplies: playerList,
                                });
                            } else {
                                let voteKill = gamef.getRoom(userRoom).playersTxt[voteID];
                                await chat.say(`*✊Bạn đã vote treo cổ ${voteKill} (${gamef.getRoom(userRoom).voteList[voteID]} phiếu)*`);
                                roomChatAll(bot, gamef.getRoom(userRoom).players, joinID, {
                                    text: `*✊${user.first_name} đã vote treo cổ ${voteKill} (${gamef.getRoom(userRoom).voteList[voteID]} phiếu)*`,
                                    quickReplies: playerList,
                                });
                            }
                        } else {
                            chat.say('```\nKhông hợp lệ vì bạn đã vote lần 2 hoặc vote sai người!\n```');
                        }
                        // kiểm tra đã VOTE XONG chưa?
                        gamef.func(dayVoteCheck, bot, userRoom);

                    }
                }
            } else {
                chat.say('```\nBạn đã chết! Xin giữ im lặng! \n```')
            }
            console.log(`$ ROOM ${userRoom + 1} CHAT > ${user.first_name}: ${chatTxt}`);
        }
        start();
    });
};