const { asyncForEach } = require('../Chat/Utils');

module.exports = async (gamef, bot, roomID) => {
    await asyncForEach(gamef.getRoom(roomID).players, async (m) => {
        if (m && gamef.getRoom(roomID).alivePlayer[m.joinID]) {
            console.log(`$ ROOM ${roomID + 1} > ${gamef.roleTxt[m.role]} > ${m.first_name}`);
            let wolfList = gamef.getRoom(roomID).wolfsTxt.join(' ; ');
            let villagersList = gamef.getRoom(roomID).villagersTxt.join(' ; ');
            let playersList = gamef.getRoom(roomID).playersTxt.join(' ; ');
            if (m.role == -1) {//SÓI
                bot.say(m.joinID, [{
                    attachment: 'image',
                    url: 'http://hstatic.net/936/1000019936/10/2015/7-28/masoi.jpg'
                }, `🐺Sói ơi dậy đi! Đêm nay sói muốn cắn ai?\n/vote <id> để cắn 1 ai đó\n👨‍👩‍👦‍👦ID CẢ LÀNG:\n${playersList}\n🐺ID TEAM SÓI:\n${wolfList}\n💩ID TEAM DÂN:\n${villagersList}`]);
            } else if (m.role == 1) { // tiên tri
                bot.say(m.joinID, [{
                    attachment: 'image',
                    url: 'http://hstatic.net/936/1000019936/10/2015/11-18/tien-tri.jpg'
                }, `🔍Tiên tri dậy đi! Tiên tri muốn kiểm tra ai?\n/see <id> để kiểm tra\n${playersList}`]);
            } else if (m.role == 2) { // Bảo vệ
                bot.say(m.joinID, [{
                    attachment: 'image',
                    url: 'http://hstatic.net/936/1000019936/10/2015/7-28/baove.jpg'
                }, `🗿Bảo vệ dậy đi! Đêm nay bạn muốn bảo vệ ai?\n/save <id> để bảo vệ\n${playersList}`]);
            } else if (m.role == 3) { // Thợ săn
                bot.say(m.joinID, [{
                    attachment: 'image',
                    url: 'http://hstatic.net/936/1000019936/10/2015/7-28/thosan.jpg'
                }, `🔫Thợ săn dậy đi! Đêm nay bạn muốn bắn ai?\n/fire <id> để ngắm bắn\n${playersList}`]);
            } else if (m.role == 4) { // Bán sói
                bot.say(m.joinID, [{
                    attachment: 'image',
                    url: 'http://hstatic.net/936/1000019936/10/2015/7-28/phanboi.jpg'
                }, `🐺Bạn là BÁN SÓI!\nBạn vẫn còn là DÂN! Ngủ tiếp đi!\nID CẢ LÀNG:\n${playersList}`]);
                gamef.getRoom(roomID).roleDoneBy(m.joinID);
            } else if (m.role == 5) { // Phù thủy
                let sayTxt;
                if (gamef.getRoom(roomID).witchKillRemain) {
                    sayTxt = `🔮Bạn là Phù thủy!\n${gamef.getRoom(roomID).witchSaveRemain ? '☑Bạn còn quyền cứu' : '⛔Bạn đã dùng quyền cứu!'}\n☑/kill <id> để giết\n☑/skip để bỏ qua\n${playersList}`;
                } else {
                    sayTxt = `🔮Bạn là Phù thủy!\n${gamef.getRoom(roomID).witchSaveRemain ? '☑Bạn còn quyền cứu' : '⛔Bạn đã dùng quyền cứu!'}\n⛔Bạn đã dùng quyền giết!\n${playersList}`;
                    gamef.getRoom(roomID).roleDoneBy(m.joinID);
                }
                bot.say(m.joinID, [{
                    attachment: 'image',
                    url: 'http://hstatic.net/936/1000019936/10/2015/7-28/phuthuy.jpg'
                }, sayTxt]);
            } else {
                bot.say(m.joinID, [{
                    attachment: 'image',
                    url: 'http://hstatic.net/936/1000019936/10/2015/7-28/danlang.jpg'
                }, `💩Bạn là DÂN! Ngủ tiếp đi :))\n👨‍👩‍👦‍👦ID CẢ LÀNG:\n${playersList}`]);
                gamef.getRoom(roomID).roleDoneBy(m.joinID);
            }
        } else {
            bot.say(m.joinID, "Đêm nay bạn đã chết =))");
        }
    })
}