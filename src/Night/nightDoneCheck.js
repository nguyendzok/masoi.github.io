const dayNotify = require('../Night/dayNotify');

function callWitch(deathID, deathTxt) {
    const askForSaveKill = (convo, qreply = true, askTxt = `Phù thủy cứu hay không?`) => {
        convo.ask(qreply ? {
            text: askTxt,
            quickReplies: ['/yes', '/no'],
        } : askTxt, async (payload, convo) => {
            if (!payload.message || !(/(y|Y)es/g.test(payload.message.text) || /(n|N)o/g.test(payload.message.text) || /skip/g.test(payload.message.text) || /\/kill\s[0-9]+/g.test(payload.message.text))) {
                convo.say(`\`\`\`\nKhông hợp lệ!\n\`\`\``);
                askForSaveKill(convo, qreply, askTxt);
                return;
            } else {
                gamef.getRoom(userRoom).cancelSchedule();
                if (/(y|Y)es/g.test(payload.message.text)) { // cứu
                    if (gamef.getRoom(userRoom).witchSaveRemain) { // còn quyền cứu
                        gamef.getRoom(userRoom).witchUseSave();
                        await convo.say(`🔮Bạn đã cứu *${deathTxt}* thành công!`);
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
                        if (/\/kill\s[0-9]+/g.test(payload.message.text)) {  //kill
                            let voteID = payload.message.text.match(/[0-9]+/g)[0];
                            if (!gamef.getRoom(userRoom).witchKillVote(voteID)) {
                                convo.say(`\`\`\`\nBạn không thể giết người đã chết!\n\`\`\``);
                                askForSaveKill(convo, qreply, askTxt);
                                return;
                            } else {
                                await convo.say(`⛔Bạn đã giết ${gamef.getRoom(userRoom).playersTxt[voteID]}!`);
                                gamef.getRoom(userRoom).newLog(`⛔Phù thủy ${gamef.getRoom(userRoom).getPlayer(gamef.getRoom(userRoom).witchID).first_name} đã giết ${gamef.getRoom(userRoom).playersTxt[voteID]}!`)
                            }
                        }
                        if (gamef.getRoom(userRoom).witchSaveRemain) {
                            askForSaveKill(convo, true, `Bạn có quyền cứu: "/yes" hay "/no" ?`);
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
        bot.conversation(gamef.getRoom(userRoom).witchID, async (convo) => {
            let time = new Date(Date.now() + 45 * 1000);
            if (gamef.getRoom(userRoom).witchSaveRemain || gamef.getRoom(userRoom).witchKillRemain) {
                await convo.say(`\`\`\`\n🔪*${deathTxt}* đã CHẾT!\nBạn có 45 giây để quyết định\n\`\`\``);
                gamef.getRoom(userRoom).addSchedule(time, () => {
                    console.log(`$ ROOM ${userRoom + 1} > AUTO ROLE > WITCH`);
                    convo.say(`⏰Bạn đã ngủ quên, trời sáng mất rồi!\nBạn không còn cơ hội cứu nữa!`);
                    convo.end();
                    dayNotify(gamef, bot, userRoom, false);
                });
                let askTxt, qreply;
                if (gamef.getRoom(userRoom).witchKillRemain) {
                    let playerListTxt = gamef.getRoom(userRoom).playersTxt.join(' / ');
                    askTxt = `Để dùng quyền giết: "/kill <số id>"\nNếu không giết ai: "/skip"\n${playerListTxt}`;
                    qreply = false;
                } else {
                    askTxt = `Bạn có quyền cứu: "/yes" hay "/no" ?`;
                    qreply = true;
                }
                askForSaveKill(convo, qreply, askTxt);
            } else {
                dayNotify(gamef, bot, userRoom, false);
            }
        });
    } else {
        dayNotify(gamef, bot, userRoom, false);
    }
}

module.exports = (gamef, bot, userRoom) => {
    gamef.getRoom(userRoom).roleIsDone((isDone) => {
        if (isDone) {
            gamef.getRoom(userRoom).findOutDeathID();
            let deathID = gamef.getRoom(userRoom).deathID;
            let deathTxt;
            if (deathID != -1) {
                deathTxt = gamef.getRoom(userRoom).playersTxt[deathID];
            }

            const askForNguyen = (convo) => {
                convo.ask({
                    text: `\`\`\`\n🔪*${deathTxt}* đã CHẾT!\nBạn 30 giây để quyết định nguyền hay không?\n\`\`\``,
                    quickReplies: ['/yes', '/no'],
                }, async (payload, convo) => {
                    if (!payload.message || !(/(y|Y)es/g.test(payload.message.text) || /(n|N)o/g.test(payload.message.text))) {
                        convo.say(`\`\`\`\nKhông hợp lệ!\n\`\`\``);
                        askForNguyen(convo);
                        return;
                    } else {
                        gamef.getRoom(userRoom).cancelSchedule();
                        if (/(y|Y)es/g.test(payload.message.text)) { // nguyền
                            gamef.getRoom(userRoom).nguyen(deathID);
                            convo.say(`Bạn đã nguyền thành công!`);
                        }
                        convo.end();
                        callWitch(deathID, deathTxt);
                    }
                });
            };
            //Call sói nguyền
            if (deathID != -1 && gamef.getRoom(userRoom).players[deathID] && gamef.getRoom(userRoom).players[deathID].role != -2 && gamef.getRoom(userRoom).players[deathID].role != 6 && deathID != gamef.getRoom(userRoom).saveID && gamef.getRoom(userRoom).soiNguyenID != undefined) {
                bot.conversation(gamef.getRoom(userRoom).soiNguyenID, async (convo) => {
                    let time = new Date(Date.now() + 30 * 1000);
                    gamef.getRoom(userRoom).addSchedule(time, () => {
                        console.log(`$ ROOM ${userRoom + 1} > AUTO ROLE > SÓI NGUYỀN`);
                        convo.say(`⏰Bạn đã ngủ quên, trời sáng mất rồi!\nBạn không còn cơ hội nguyền nữa!`);
                        convo.end();
                        callWitch(deathID, deathTxt);
                    });
                    askForNguyen(convo);
                });
            }
        }
    });
}