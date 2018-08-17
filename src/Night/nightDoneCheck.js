const dayNotify = require('../Night/dayNotify');

module.exports = (gamef, bot, userRoom) => {
    gamef.getRoom(userRoom).roleIsDone((isDone) => {
        if (isDone) {
            gamef.getRoom(userRoom).findOutDeathID();
            let deathID = gamef.getRoom(userRoom).deathID;
            let deathTxt;
            if (deathID != -1) {
                deathTxt = gamef.getRoom(userRoom).playersTxt[deathID];
            }

            const askForSave = (convo) => {
                convo.ask({
                    text: `"Trả lời: "/yes" hay "/no" hoặc /kill <id ai đó>`,
                    quickReplies: ['/yes', '/no'],
                }, (payload, convo) => {
                    if (!payload.message || !(/(y|Y)es/g.test(payload.message.text) || /(n|N)o/g.test(payload.message.text) || /\/kill\s[0-9]+/g.test(payload.message.text))) {
                        convo.say(`\`\`\`\nKhông hợp lệ!\n\`\`\``);
                        askForSave(convo);
                        return;
                    } else {
                        gamef.getRoom(userRoom).cancelSchedule();
                        if (/(y|Y)es/g.test(payload.message.text)) { // cứu
                            if (gamef.getRoom(userRoom).witchSaveRemain) { // còn quyền cứu
                                gamef.getRoom(userRoom).witchUseSave();
                                convo.say(`🔮Bạn đã cứu *${deathTxt}* thành công!`);
                                gamef.getRoom(userRoom).newLog(`🔮Phù thủy *${gamef.getRoom(userRoom).getPlayer(gamef.getRoom(userRoom).witchID).first_name}* đã cứu *${deathTxt}*!`);
                                convo.end();
                                dayNotify(gamef, bot, userRoom, true);
                            } else {
                                convo.say('```\nBạn đã hết quyền cứu\n```');
                            }
                        } else if (/(n|N)o/g.test(payload.message.text)) { // không cứu
                            if (gamef.getRoom(userRoom).witchSaveRemain) { // còn quyền cứu
                                convo.end();
                                dayNotify(gamef, bot, userRoom, false);
                            } else {
                                convo.say('```\nBạn đã hết quyền cứu\n```');
                            }
                        } else { // kill
                            if (gamef.getRoom(userRoom).witchKillRemain) {
                                let voteID = chatTxt.match(/[0-9]+/g)[0];
                                if (!gamef.getRoom(userRoom).witchKillVote(voteID)) {
                                    convo.say(`\`\`\`\nBạn không thể giết người đã chết!\n\`\`\``);
                                } else {
                                    await convo.say(`⛔Bạn đã giết ${gamef.getRoom(userRoom).playersTxt[voteID]}!`);
                                    gamef.getRoom(userRoom).roleDoneBy(joinID);
                                    gamef.getRoom(userRoom).newLog(`⛔Phù thủy ${gamef.getRoom(userRoom).getPlayer(gamef.getRoom(userRoom).witchID).first_name} đã giết ${gamef.getRoom(userRoom).playersTxt[voteID]}!`)
                                }
                            } else {
                                convo.say('```\nBạn đã hết quyền giết\n```');
                            }
                        }
                    }
                });
            };

            //Call phù thủy khi: có người chết, người chết ko phải bán sói hay già làng, còn phù thủy
            if (deathID != -1 && gamef.getRoom(userRoom).players[deathID] && gamef.getRoom(userRoom).players[deathID].role != -2 && gamef.getRoom(userRoom).players[deathID].role != 6 && deathID != gamef.getRoom(userRoom).saveID && gamef.getRoom(userRoom).witchID != undefined) { //phù thủy còn quyền cứu, nạn nhân không phải bán sói
                bot.conversation(gamef.getRoom(userRoom).witchID, (convo) => {
                    let time = new Date(Date.now() + 45 * 1000);
                    if (gamef.getRoom(userRoom).witchSaveRemain || gamef.getRoom(userRoom).witchKillRemain) {
                        convo.say(`\`\`\`\n🔪Đêm hôm qua: *${deathTxt}* đã CHẾT!\nBạn có 45 giây để quyết định\n\`\`\``);
                        gamef.getRoom(userRoom).addSchedule(time, () => {
                            console.log(`$ ROOM ${userRoom + 1} > AUTO ROLE > WITCH`);
                            convo.say(`⏰Bạn đã ngủ quên, trời sáng mất rồi!\nBạn không còn cơ hội cứu nữa!`);
                            convo.end();
                            dayNotify(gamef, bot, userRoom, false);
                        });
                        askForSave(convo);
                    }
                });
            } else {
                dayNotify(gamef, bot, userRoom, false);
            }
        }
    });
}