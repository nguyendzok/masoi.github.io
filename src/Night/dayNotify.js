const { roomChatAll, roomWolfChatAll } = require('../Chat/Utils');
const gameIsNotEndCheck = require('../MainGame/gameIsNotEndCheck');
const dayVoteCheck = require('../Day/dayVoteCheck');

module.exports = async (gamef, bot, userRoom, witchSaved) => {
    let deathID = parseInt(gamef.getRoom(userRoom).deathID);
    let deathTxt, deathRole;
    if (deathID != -1 && gamef.getRoom(userRoom).players[deathID]) {
        deathTxt = gamef.getRoom(userRoom).playersTxt[deathID];
        deathRole = gamef.roleTxt[gamef.getRoom(userRoom).getRoleByID(deathID)];
    }
    let dieCount = 0;
    let dieArr = [];

    let chatAllTxt = `\`\`\`\n🌞Trời sáng rồi mọi người dậy đi`;

    // THỢ SĂN
    if (gamef.getRoom(userRoom).fireKill) { // chủ động
        gamef.getRoom(userRoom).fireKillAction((hunterID, dieIDArray, firedWolf) => {
            dieIDArray.forEach(id => {
                let killID = parseInt(id);
                let deathUser = gamef.getRoom(userRoom).players[killID];
                let deathUserTxt = `${killID}: ${deathUser.first_name}`;
                if (hunterID != killID) { // killID không phải là thợ săn
                    if (!firedWolf) { // không giết được sói
                        gamef.getRoom(userRoom).newLog(`👻Thợ săn đã bắn nhầm ${gamef.roleTxt[gamef.getRoom(userRoom).getRoleByID(killID)]} *${deathUserTxt}*`);
                    } else { //giết được sói
                        gamef.getRoom(userRoom).newLog(`👻Thợ săn đã bắn trúng ${gamef.roleTxt[gamef.getRoom(userRoom).getRoleByID(killID)]} *${deathUserTxt}*`);
                    }
                } else {
                    if (!firedWolf) { // không giết được sói
                        gamef.getRoom(userRoom).newLog(`👻Thợ săn phải đền mạng!`);
                    }
                }
                if (dieArr.indexOf(killID) == -1) {
                    chatAllTxt += `\n👻 *${deathUserTxt}* đã CHẾT!`;
                    dieArr.push(killID);
                }
            });
        });
    }

    // SÓI CẮN
    if (!witchSaved && gamef.getRoom(userRoom).kill()) {
        dieCount++;
        dieArr.push(deathID);
        chatAllTxt += `\n👻 *${deathTxt}* đã CHẾT!`;
        gamef.getRoom(userRoom).newLog(`👻 *${deathTxt}* là ${deathRole} đã bị SÓI cắn!`);
        console.log(`$ ROOM ${userRoom + 1} > ${deathTxt} DIED!`);
        if (gamef.getRoom(userRoom).players[deathID] && gamef.getRoom(userRoom).players[deathID].role === 3) { //người chết là thợ săn
            let fireID = parseInt(gamef.getRoom(userRoom).fireID);
            if (fireID != -1) { //thợ săn không bắn lên trời
                let deathUser = gamef.getRoom(userRoom).players[fireID];
                let deathFireTxt = `${fireID}: ${deathUser.first_name}`;
                dieCount++;
                if (dieArr.indexOf(fireID) == -1) {
                    chatAllTxt += `\n👻 *${deathFireTxt}* đã CHẾT!`;
                    dieArr.push(fireID);
                }
                gamef.getRoom(userRoom).newLog(`👻Thợ săn chết đã ghim ${gamef.roleTxt[gamef.getRoom(userRoom).getRoleByID(fireID)]} *${deathFireTxt}*`);
                console.log(`$ ROOM ${userRoom + 1} > ${deathFireTxt} DIED!`);
            }
        }
    }
    // PHÙ THỦY giết
    if (gamef.getRoom(userRoom).witchKillID != undefined) {
        gamef.getRoom(userRoom).witchKillAction(async (witchKillID) => {
            dieCount++;
            let killID = parseInt(witchKillID);
            let deathUser = gamef.getRoom(userRoom).players[killID];
            let deathByMagicTxt = `${killID}: ${deathUser.first_name}`;
            if (dieArr.indexOf(killID) == -1) {
                chatAllTxt += `\n👻 *${deathByMagicTxt}* đã CHẾT!`;
                dieArr.push(killID);
            }
            gamef.getRoom(userRoom).newLog(`👻Phù thủy đã phù phép chết ${gamef.roleTxt[gamef.getRoom(userRoom).getRoleByID(witchKillID)]} *${deathByMagicTxt}*`);
            console.log(`$ ROOM ${userRoom + 1} > ${deathByMagicTxt} DIED by witch!`);
        });
    }


    // CẶP ĐÔI CHẾT:
    let cupidDieID = -1;
    dieArr.forEach(dieID => {
        if (gamef.getRoom(userRoom).players[dieID] && gamef.getRoom(userRoom).cupidsID.indexOf(gamef.getRoom(userRoom).players[dieID].joinID) != -1) {
            cupidDieID = dieID;
        }
    });
    if (cupidDieID != -1 && gamef.getRoom(userRoom).players[cupidDieID]) {
        dieCount++;
        let die1Index = gamef.getRoom(userRoom).cupidsID.indexOf(gamef.getRoom(userRoom).players[cupidDieID].joinID); // index trong mảng cupidsID
        let die2JoinID = gamef.getRoom(userRoom).cupidsID[die1Index == 1 ? 0 : 1];
        let die2User = gamef.getRoom(userRoom).getPlayer(die2JoinID);
        if (dieArr.indexOf(die2User.id) == -1) {
            chatAllTxt += `\n👻 *${die2User.id}: ${die2User.first_name}* đã CHẾT!`;
            dieArr.push(die2User.id);
        }
        gamef.getRoom(userRoom).newLog(`👻Do là cặp đôi, ${gamef.roleTxt[gamef.getRoom(userRoom).getRoleByID(die2User.id)]} *${die2User.id}: ${die2User.first_name}* cũng chết theo`);
        console.log(`$ ROOM ${userRoom + 1} > ${die2User.first_name} DIED!`);
    }

    if (deathID != -1 && gamef.getRoom(userRoom).players[deathID]) { // kẻ bị chết tồn tại và không chết :v
        //là BÁN SÓI
        if (gamef.getRoom(userRoom).players[deathID].role == -2) {
            let halfWolfjoinID = gamef.getRoom(userRoom).players[deathID].joinID;
            let halfWolfTxt = gamef.getRoom(userRoom).players[deathID].first_name;
            await bot.say(halfWolfjoinID, `\`\`\`\nBạn đã bị sói cắn!\nTừ giờ bạn là 🐺SÓI!\n\`\`\``);
            gamef.getRoom(userRoom).players[deathID].setRole(-1);
            gamef.getRoom(userRoom).newLog(`🐺BÁN SÓI *${halfWolfTxt}* bị cắn và trở thành 🐺SÓI`);
            console.log(`$ ROOM ${userRoom + 1} > HALF WOLF!`);
        }

        //là GIÀ LÀNG
        if (gamef.getRoom(userRoom).players[deathID].role == 6) {
            let oldManjoinID = gamef.getRoom(userRoom).players[deathID].joinID;
            let oldManTxt = gamef.getRoom(userRoom).players[deathID].first_name;
            if (gamef.getRoom(userRoom).oldManLive > 0) {
                await bot.say(oldManjoinID, `\`\`\`\nBạn đã bị SÓI cắn!\nBạn chỉ còn 1 mạng!\nHãy bảo trọng =))\n\`\`\``);
                gamef.getRoom(userRoom).newLog(`👴GIÀ LÀNG *${oldManTxt}* bị cắn lần 1!`);
            } else {
                await bot.say(oldManjoinID, `\`\`\`\nBạn đã bị SÓI cắn chết!\nVĩnh biệt =))\n\`\`\``);
                gamef.getRoom(userRoom).newLog(`👴GIÀ LÀNG *${oldManTxt}* đã CHẾT!`);
            }

            console.log(`$ ROOM ${userRoom + 1} > OLD MAN FIRST BLOOD!`);
        }

        //là kẻ bị sói nguyền
        if (gamef.getRoom(userRoom).nguyenID && gamef.getRoom(userRoom).players[deathID].joinID == gamef.getRoom(userRoom).nguyenID) {
            let nguyenJoinID = gamef.getRoom(userRoom).nguyenID;
            let nguyenName = gamef.getRoom(userRoom).playersTxt[gamef.getRoom(userRoom).getPlayer(nguyenJoinID).id];
            roomWolfChatAll(bot, gamef.getRoom(userRoom).wolfsID, nguyenJoinID, `\`\`\`\n🐺${nguyenName} đã bị nguyền và theo phe sói!\n\`\`\``);
            let wolfsListTxt = gamef.getRoom(userRoom).wolfsTxt.join(' / ');
            bot.say(nguyenJoinID, '```\n🐺Bạn đã bị nguyền\nBạn sẽ theo phe 🐺SÓI\nDanh sách phe sói:\n' + wolfsListTxt + '\n```');
            gamef.getRoom(userRoom).newLog(`🐺${nguyenName} đã bị nguyền và theo phe sói!`);
            console.log(`$ ROOM ${userRoom + 1} > SÓI ĐÃ NGUYỀN: ${nguyenName}!`);
        }
    }

    if (dieCount == 0) {
        console.log(`$ ROOM ${userRoom + 1} > NOBODY DIED!`);
        gamef.getRoom(userRoom).newLog(`${deathID != -1 ? `👻 *${deathTxt}* bị cắn nhưng không chết!\n` : `🎊Sói không thống nhất được số vote!\n`}🎊Đêm hôm đấy không ai chết cả!`);
        chatAllTxt += `\n🎊Đêm hôm qua không ai chết cả!`;
    }

    let aliveLeft = gamef.getRoom(userRoom).aliveCount();
    chatAllTxt += `\n⏰Mọi người có ${(aliveLeft <= 8 ? aliveLeft : 9)*40/60} phút thảo luận!`;

    chatAllTxt += `\n\`\`\``;
    roomChatAll(bot, gamef.getRoom(userRoom).players, 0, chatAllTxt);

    gameIsNotEndCheck(gamef, bot, userRoom, () => {
        gamef.getRoom(userRoom).dayNightSwitch();
        let time = new Date(Date.now() + (aliveLeft <= 8 ? aliveLeft : 9) * 40 * 1000);
        gamef.getRoom(userRoom).addSchedule(time, () => {
            roomChatAll(bot, gamef.getRoom(userRoom).players, 0, `\`\`\`\n⏰CÒN 1 PHÚT THẢO LUẬN\nCác bạn nên cân nhắc kĩ, tránh lan man, nhanh chóng tìm ra kẻ đáng nghi nhất!\n\`\`\``);
            console.log(`$ ROOM ${userRoom + 1} > 1 MINUTE REMAINING`);
            let time = new Date(Date.now() + 1 * 60 * 1000);
            gamef.getRoom(userRoom).addSchedule(time, () => {
                let playersInRoomTxt = gamef.getRoom(userRoom).playersTxt.join(' / ');
                roomChatAll(bot, gamef.getRoom(userRoom).players, 0, `\`\`\`\n⏰Hết giờ! Mọi người có 1 PHÚT để vote!\n"/vote <số id>" để treo cổ 1 người\n${playersInRoomTxt}\n\`\`\``);
                gamef.getRoom(userRoom).chatOFF();
                console.log(`$ ROOM ${userRoom + 1} > END OF DISCUSSION!`);
                // tự động vote:
                gamef.getRoom(userRoom).players.forEach((p, index, players) => {
                    if (p && gamef.getRoom(userRoom).alivePlayer[p.joinID] && !gamef.getRoom(userRoom).roleDone[p.joinID]) {
                        let time = new Date(Date.now() + 60 * 1000);
                        players[index].addSchedule(time, () => {
                            if (p && gamef.getRoom(userRoom).alivePlayer[p.joinID]) {
                                roomChatAll(bot, gamef.getRoom(userRoom).players, 0, `*✊${p.first_name} đã không kịp bỏ phiếu! (-10 uy tín)*`);
                                gamef.getRoom(userRoom).autoRole(p.joinID, p.role);
                                // kiểm tra đã VOTE XONG chưa?
                                gamef.func(dayVoteCheck, bot, userRoom);
                            }
                        });
                    }
                });
            });
        });
    });
}