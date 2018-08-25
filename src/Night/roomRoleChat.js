const { asyncForEach, roomChatAll, sendImageCard } = require('../Chat/Utils');
const gameIsNotEndCheck = require('../MainGame/gameIsNotEndCheck');

module.exports = async function (gamef, bot, userRoom) {

    // đếm giờ ban đêm
    gamef.getRoom(userRoom).players.every((p, index, players) => {
        if (p && p.afkCount >= 6) {
            gamef.getRoom(userRoom).killAction(p.id);
            roomChatAll(bot, gamef.getRoom(userRoom).players, 0, `\`\`\`\n👻 *${p.first_name}* đã bị giết (uy tín < 0)\n\`\`\``);
            gamef.getRoom(userRoom).newLog(`👻 *${p.first_name}* đã bị giết (uy tín < 0)`);
            return gameIsNotEndCheck(gamef, bot, userRoom, () => { });
        }

        if (p && gamef.getRoom(userRoom).alivePlayer[p.joinID]) {
            if (p.role == -2 || p.role == 4 || p.role == 6 || p.role == 5) { //BÁN SÓI / DÂN / GIÀ LÀNG / PHÙ THỦY
                return true;
            }
            if (p.role == -1 || p.role == -3) { // SÓI có 1 phút 30 giây
                let time = new Date(Date.now() + 60 * 1000);
                players[index].addSchedule(time, () => {
                    let time = new Date(Date.now() + 30 * 1000);
                    bot.say(p.joinID, `\`\`\`\n⏰Trời sắp sáng rồi! Còn 30 giây...\n\`\`\``);
                    console.log(`$ ROOM ${userRoom + 1} > TIMER > WOLF > 30 SECONDS REMAINING`);
                    players[index].addSchedule(time, () => {
                        console.log(`$ ROOM ${userRoom + 1} > AUTO ROLE > WOLF`);
                        bot.say(p.joinID, '```\n⏰Bạn đã ngủ quên mà không cắn ai! (-50 uy tín)\n```');
                        gamef.getRoom(userRoom).autoRole(p.joinID, p.role);
                        gamef.func(nightDoneCheck, bot, userRoom);
                    });
                });
            } else {
                let time;
                if (p.role == 7) { // CUPID có 35 giây
                    time = new Date(Date.now() + 20 * 1000);
                } else { // còn lại: Tiên tri, bảo vệ, thợ săn, phù thủy có 60 giây
                    time = new Date(Date.now() + 45 * 1000);
                }
                players[index].addSchedule(time, () => {
                    bot.say(p.joinID, `⏰Bạn còn 15 giây để thực hiện...`);
                    console.log(`$ ROOM ${userRoom + 1} > TIMER > 15 SECONDS REMAINING`);
                    let time = new Date(Date.now() + 15 * 1000);
                    players[index].addSchedule(time, () => {
                        bot.say(p.joinID, '```\n⏰Hết giờ! Bạn đã mất quyền năng! (-50 uy tín)\n```');
                        gamef.getRoom(userRoom).autoRole(p.joinID, p.role);
                        console.log(`$ ROOM ${userRoom + 1} > AUTO ROLE > ${p.first_name} > ${p.role}`);
                        gamef.func(nightDoneCheck, bot, userRoom);
                    });
                });
            }
        }
        return true;
    });

    let wolfList = gamef.getRoom(userRoom).wolfsTxt.join(' ; ');
    let villagersList = gamef.getRoom(userRoom).villagersTxt.join(' ; ');
    let playersList = gamef.getRoom(userRoom).playersTxt.join(' ; ');

    await asyncForEach(gamef.getRoom(userRoom).players, (p) => {
        if (p && gamef.getRoom(userRoom).alivePlayer[p.joinID]) {
            console.log(`$ ROOM ${userRoom + 1} > ${gamef.roleTxt[p.role]} > ${p.first_name}`);

            let isCupidTxt = ``;

            if (gamef.getRoom(userRoom).cupidsID.indexOf(p.joinID) != -1) {
                if (gamef.getRoom(userRoom).cupidTeam) {
                    isCupidTxt += `👼Bạn thuộc PHE CẶP ĐÔI (thứ 3)!\n👼Bảo vệ tình yêu của mình và tiêu diệt các người chơi khác để dành chiến thắng!\n`;
                }
                isCupidTxt += `💞ID CẶP ĐÔI:\n${gamef.getRoom(userRoom).cupidsTxt.join(' ; ')}\n\n`;
            }

            isCupidTxt += `Uy tín của bạn là: ${(6 - p.afkCount) * 10}/60\n\n`;

            if (gamef.getRoom(userRoom).nguyenID == p.joinID) {
                if (gamef.getRoom(userRoom).wolfsCount == 1) { // còn một mình kẻ bị sói nguyền
                    isCupidTxt += `🐺Bạn là con SÓI cuối cùng!\n"/vote <số id>" để cắn\n${playersList}\n\n`;
                } else {
                    isCupidTxt += `🐺ID TEAM SÓI:\n${wolfList}\n🐺Bạn đã bị nguyền và theo phe SÓI!\n"/p <nội dung>" để chat với phe sói\n\n`;
                }
            }

            if (p.role == -1) {//SÓI
                return sendImageCard(bot, p.joinID, 'https://www.facebook.com/masoigame/photos/pcb.1889279921367724/1889278418034541', 'Ma sói')
                    .then(() => {
                        bot.say(p.joinID, isCupidTxt + `🐺Sói ơi dậy đi! Đêm nay sói muốn cắn ai?\n"/vote <số ID>" để cắn ai đó\nVD: "/vote 1" để cắn ${gamef.getRoom(userRoom).players[1].first_name}\n👨‍👩‍👦‍👦ID CẢ LÀNG:\n${playersList}\n🐺ID TEAM SÓI:\n${wolfList}\n💩ID TEAM DÂN:\n${villagersList}`);
                    });
            } else if (p.role == -3) {//SÓI NGUYỀN
                let nguyenTxt;
                if (gamef.getRoom(userRoom).soiNguyen) {
                    nguyenTxt = `🐺Sói nguyền dậy đi!`;
                } else {
                    nguyenTxt = `🐺Sói ơi dậy đi!`;
                }
                return sendImageCard(bot, p.joinID, 'https://www.facebook.com/masoigame/photos/pcb.1889279921367724/1897745170521199', 'Sói nguyền')
                    .then(() => {
                        bot.say(p.joinID, isCupidTxt + nguyenTxt + `Đêm nay sói muốn cắn ai?\n"/vote <số ID>" để cắn ai đó\nVD: "/vote 1" để cắn ${gamef.getRoom(userRoom).players[1].first_name}\n👨‍👩‍👦‍👦ID CẢ LÀNG:\n${playersList}\n🐺ID TEAM SÓI:\n${wolfList}\n💩ID TEAM DÂN:\n${villagersList}`);
                    });
            } else if (p.role == 1) { // tiên tri
                return sendImageCard(bot, p.joinID, 'https://www.facebook.com/masoigame/photos/pcb.1889279921367724/1889278528034530', 'Tiên tri')
                    .then(() => {
                        bot.say(p.joinID, isCupidTxt + `🔍Tiên tri dậy đi! Tiên tri muốn kiểm tra ai?\n"/see <số ID>" để kiểm tra\n${playersList}`);
                    });
            } else if (p.role == 2) { // Bảo vệ
                return sendImageCard(bot, p.joinID, 'https://www.facebook.com/masoigame/photos/pcb.1889279921367724/1889278331367883', 'Bảo vệ')
                    .then(() => {
                        bot.say(p.joinID, isCupidTxt + `🗿Bảo vệ dậy đi! Đêm nay bạn muốn bảo vệ ai?\n"/save <số ID>" để bảo vệ\n${playersList}`);
                    });
            } else if (p.role == 3) { // Thợ săn
                return sendImageCard(bot, p.joinID, 'https://www.facebook.com/masoigame/photos/pcb.1889279921367724/1889278518034531', 'Thợ săn')
                    .then(() => {
                        bot.say(p.joinID, isCupidTxt + `🔫Thợ săn dậy đi! Đêm nay bạn muốn bắn ai?\n"/fire <số ID>" để ghim\n"/kill <số ID>" để bắn chết luôn\n${playersList}`);
                    });
            } else if (p.role == -2) { // Bán sói
                gamef.getRoom(userRoom).roleDoneBy(p.joinID, false, true);
                return sendImageCard(bot, p.joinID, 'https://www.facebook.com/masoigame/photos/pcb.1889279921367724/1889278411367875', 'Bán sói')
                    .then(() => {
                        bot.say(p.joinID, isCupidTxt + `🐺Bạn là BÁN SÓI!\nBạn vẫn còn là DÂN nhưng theo phe SÓI\nID CẢ LÀNG:\n${playersList}`);
                    });
            } else if (p.role == 5) { // Phù thủy
                let sayTxt;
                if (gamef.getRoom(userRoom).witchKillRemain) {
                    sayTxt = `🔮Bạn là Phù thủy!\n${gamef.getRoom(userRoom).witchSaveRemain ? '☑Bạn còn quyền cứu' : '⛔Bạn đã dùng quyền cứu!'}\n☑Bạn còn quyền giết\n(Bạn vẫn có thể sử dụng lệnh /kill)\n${playersList}`;
                } else {
                    sayTxt = `🔮Bạn là Phù thủy!\n${gamef.getRoom(userRoom).witchSaveRemain ? '☑Bạn còn quyền cứu' : '⛔Bạn đã dùng quyền cứu!'}\n⛔Bạn đã dùng quyền giết!\n${playersList}`;
                }
                gamef.getRoom(userRoom).roleDoneBy(p.joinID, false, true);
                return sendImageCard(bot, p.joinID, 'https://www.facebook.com/masoigame/photos/pcb.1889279921367724/1889278464701203', 'Phù thủy')
                    .then(() => {
                        bot.say(p.joinID, isCupidTxt + sayTxt);
                    });
            } else if (p.role == 6) { // GIÀ LÀNG
                gamef.getRoom(userRoom).roleDoneBy(p.joinID, false, true);
                return sendImageCard(bot, p.joinID, 'https://www.facebook.com/masoigame/photos/pcb.1889279921367724/1889278381367878', 'Già làng')
                    .then(() => {
                        bot.say(p.joinID, isCupidTxt + `👴Bạn là Già làng! Bảo trọng =))\n👨‍👩‍👦‍👦ID CẢ LÀNG:\n${playersList}`);
                    });
            } else if (p.role == 7) { // THẦN TÌNH YÊU
                return sendImageCard(bot, p.joinID, 'https://www.facebook.com/masoigame/photos/pcb.1889279921367724/1889278324701217', 'Thần tình yêu')
                    .then(() => {
                        bot.say(p.joinID, isCupidTxt + `👼Bạn là THẦN TÌNH YÊU!\n/cupid <id1> <id2> để ghép đôi\n${playersList}`);
                    });
            } else if (p.role == 8) { // NGƯỜI HÓA SÓI
                gamef.getRoom(userRoom).roleDoneBy(p.joinID, false, true);
                return sendImageCard(bot, p.joinID, 'https://www.facebook.com/masoigame/photos/pcb.1889279921367724/1891874781108238', 'Người hóa sói')
                    .then(() => {
                        bot.say(p.joinID, isCupidTxt + `😸Yên tâm, bạn là DÂN tuy nhiên tiên tri thì không nghĩ vậy :v`);
                    });
            } else { // DÂN
                gamef.getRoom(userRoom).roleDoneBy(p.joinID, false, true);
                return sendImageCard(bot, p.joinID, 'https://www.facebook.com/masoigame/photos/pcb.1889279921367724/1889278298034553', 'Dân thường')
                    .then(() => {
                        bot.say(p.joinID, isCupidTxt + `💩Bạn là thường dân! Ngủ tiếp đi :))\n👨‍👩‍👦‍👦ID CẢ LÀNG:\n${playersList}`);
                    });
            }
        } else {
            return sendImageCard(bot, p.joinID, 'https://www.facebook.com/masoigame/photos/pcb.1889279921367724/1898943877067995', 'Bạn đã chết')
                .then(() => {
                    bot.say(p.joinID, `👻Đêm nay bạn đã chết =))\n👨‍👩‍👦‍👦ID CẢ LÀNG:\n${playersList}`);
                });
        }
    })
}
const nightDoneCheck = require('../Night/nightDoneCheck');