const { roomChatAll } = require('../Chat/Utils');
const gameIsNotEndCheck = require('../MainGame/gameIsNotEndCheck');
const dayVoteCheck = require('../Day/dayVoteCheck');

module.exports = async (gamef, bot, userRoom, witchSaved) => {
    let deathID = gamef.getRoom(userRoom).deathID;
    let deathTxt, deathRole;
    if (deathID != -1) {
        deathTxt = gamef.getRoom(userRoom).playersTxt[deathID];
        deathRole = gamef.roleTxt[gamef.getRoom(userRoom).getRoleByID(deathID)];
    }
    let dieCount = 0;

    let chatAllTxt = `🌞Trời sáng rồi mọi người dậy đi\n`;

    // SÓI CẮN
    if (!witchSaved && gamef.getRoom(userRoom).kill()) {
        dieCount++;
        chatAllTxt += `🔪 *${deathTxt}* đã CHẾT!`;
        gamef.getRoom(userRoom).newLog(`🔪 *${deathTxt}* là ${deathRole} đã bị SÓI cắn!`);
        console.log(`$ ROOM ${userRoom + 1} > ${deathTxt} DIED!`);
        if (gamef.getRoom(userRoom).players[deathID].role === 3) { //người chết là thợ săn
            dieCount++;
            let fireID = gamef.getRoom(userRoom).fireID;
            let deathFireTxt = gamef.getRoom(userRoom).playersTxt[fireID];
            chatAllTxt += `\n🔪 *${deathFireTxt}* đã CHẾT!`;
            gamef.getRoom(userRoom).newLog(`🔪Thợ săn chết đã ghim ${gamef.roleTxt[gamef.getRoom(userRoom).getRoleByID(fireID)]} *${deathFireTxt}*`);
            console.log(`$ ROOM ${userRoom + 1} > ${deathFireTxt} DIED!`);
        }
        if (gamef.getRoom(userRoom).cupidsID.indexOf(gamef.getRoom(userRoom).players[deathID].joinID) != -1) { //người chết là cặp đôi
            dieCount++;
            let die1Index = gamef.getRoom(userRoom).cupidsID.indexOf(gamef.getRoom(userRoom).players[deathID].joinID); // index trong mảng cupidsID
            let die2JoinID = gamef.getRoom(userRoom).cupidsID[die1Index == 1 ? 0 : 1];
            let die2User = gamef.getRoom(userRoom).getPlayer(die2JoinID);
            chatAllTxt += `\n🔪 *${die2User.first_name}* đã CHẾT!`;
            gamef.getRoom(userRoom).newLog(`🔪Tình yêu đã giết chết ${gamef.roleTxt[gamef.getRoom(userRoom).getRoleByID(die2User.id)]} *${die2User.id}: ${die2User.first_name}*`);
            console.log(`$ ROOM ${userRoom + 1} > ${die2User.first_name} DIED!`);
        }
    }
    // PHÙ THỦY giết
    if (gamef.getRoom(userRoom).witchKillID != undefined) {
        let killID = gamef.getRoom(userRoom).witchKillID;
        let deathByMagicTxt = gamef.getRoom(userRoom).playersTxt[killID];
        gamef.getRoom(userRoom).witchKillAction(async (witchKillID) => {
            dieCount++;
            chatAllTxt += `\n🔪 *${deathByMagicTxt}* đã CHẾT!`;
            gamef.getRoom(userRoom).newLog(`🔪Phù thủy đã phù phép chết ${gamef.roleTxt[gamef.getRoom(userRoom).getRoleByID(witchKillID)]} *${deathByMagicTxt}*`);
            console.log(`$ ROOM ${userRoom + 1} > ${witchKillID}: ${deathByMagicTxt} DIED by witch!`);
        });
    }
    //là BÁN SÓI
    if (deathID != -1 && gamef.getRoom(userRoom).players[deathID].role == -2) {
        let halfWolfjoinID = gamef.getRoom(userRoom).players[deathID].joinID;
        let halfWolfTxt = gamef.getRoom(userRoom).players[deathID].first_name;
        await bot.say(halfWolfjoinID, `\`\`\`\nBạn đã bị sói cắn!\nTừ giờ bạn là 🐺SÓI!\n\`\`\``);
        gamef.getRoom(userRoom).players[deathID].setRole(-1);
        gamef.getRoom(userRoom).newLog(`🐺BÁN SÓI *${halfWolfTxt}* bị cắn và trở thành 🐺SÓI`);
        console.log(`$ ROOM ${userRoom + 1} > HALF WOLF!`);
    }

    //là GIÀ LÀNG
    if (deathID != -1 && gamef.getRoom(userRoom).players[deathID].role == 6) {
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

    if (dieCount == 0) {
        console.log(`$ ROOM ${userRoom + 1} > NOBODY DIED!`);
        gamef.getRoom(userRoom).newLog(`${deathID != -1 ? `🔪 *${deathTxt}* bị cắn nhưng không chết!\n` : `🎊Sói không thống nhất được số vote!\n`}🎊Đêm hôm đấy không ai chết cả!`);
        chatAllTxt += `🎊Đêm hôm qua không ai chết cả!`;
    }
    await roomChatAll(bot, gamef.getRoom(userRoom).players, 0, chatAllTxt);


    gameIsNotEndCheck(gamef, bot, userRoom, () => {
        let playersInRoomTxt = gamef.getRoom(userRoom).playersTxt.join(' ; ');
        roomChatAll(bot, gamef.getRoom(userRoom).players, 0, `⏰Mọi người có 6 phút thảo luận!`);
        gamef.getRoom(userRoom).dayNightSwitch();

        let time = new Date(Date.now() + 5 * 60 * 1000);
        gamef.getRoom(userRoom).addSchedule(time, () => {
            roomChatAll(bot, gamef.getRoom(userRoom).players, 0, `⏰CÒN 1 PHÚT THẢO LUẬN\nCác bạn nên cân nhắc kĩ, tránh lan man, nhanh chóng tìm ra kẻ đáng nghi nhất!`);
            console.log(`$ ROOM ${userRoom + 1} > 1 MINUTE REMAINING`);
            let time = new Date(Date.now() + 1 * 60 * 1000);
            gamef.getRoom(userRoom).addSchedule(time, () => {
                roomChatAll(bot, gamef.getRoom(userRoom).players, 0, `⏰Đã hết thời gian, mọi người có 1 PHÚT để vote một người để treo cổ!\n/vote <id> để treo cổ 1 người\n${playersInRoomTxt}`);
                gamef.getRoom(userRoom).chatOFF();
                console.log(`$ ROOM ${userRoom + 1} > END OF DISCUSSION!`);
                // tự động vote:
                gamef.getRoom(userRoom).players.forEach((p, index, players) => {
                    let time = new Date(Date.now() + 60 * 1000);
                    players[index].addSchedule(time, () => {
                        roomChatAll(bot, gamef.getRoom(userRoom).players, 0, `😈${p.first_name} đã không kịp bỏ phiếu!`);
                        gamef.getRoom(userRoom).vote(p.joinID, -1);
                        // kiểm tra đã VOTE XONG chưa?
                        gamef.func(dayVoteCheck, bot, userRoom);
                    });
                });
            });
        });
    });
}