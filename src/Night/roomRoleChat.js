const { asyncForEach } = require('../Chat/Utils');

module.exports = async (gamef, bot, userRoom) => {
    await asyncForEach(gamef.getRoom(userRoom).players, (p) => {
        if (p && gamef.getRoom(userRoom).alivePlayer[p.joinID]) {
            console.log(`$ ROOM ${userRoom + 1} > ${gamef.roleTxt[p.role]} > ${p.first_name}`);
            let wolfList = gamef.getRoom(userRoom).wolfsTxt.join(' ; ');
            let villagersList = gamef.getRoom(userRoom).villagersTxt.join(' ; ');
            let playersList = gamef.getRoom(userRoom).playersTxt.join(' ; ');
            if (p.role == -1) {//SÓI
                return bot.say(p.joinID, [{
                    attachment: 'image',
                    url: 'http://hstatic.net/936/1000019936/10/2015/7-28/masoi.jpg'
                }, `🐺Sói ơi dậy đi! Đêm nay sói muốn cắn ai?\n/vote <id> để cắn 1 ai đó\n👨‍👩‍👦‍👦ID CẢ LÀNG:\n${playersList}\n🐺ID TEAM SÓI:\n${wolfList}\n💩ID TEAM DÂN:\n${villagersList}`]);
            } else if (p.role == 1) { // tiên tri
                return bot.say(p.joinID, [{
                    attachment: 'image',
                    url: 'http://hstatic.net/936/1000019936/10/2015/11-18/tien-tri.jpg'
                }, `🔍Tiên tri dậy đi! Tiên tri muốn kiểm tra ai?\n/see <id> để kiểm tra\n${playersList}`]);
            } else if (p.role == 2) { // Bảo vệ
                return bot.say(p.joinID, [{
                    attachment: 'image',
                    url: 'http://hstatic.net/936/1000019936/10/2015/7-28/baove.jpg'
                }, `🗿Bảo vệ dậy đi! Đêm nay bạn muốn bảo vệ ai?\n/save <id> để bảo vệ\n${playersList}`]);
            } else if (p.role == 3) { // Thợ săn
                return bot.say(p.joinID, [{
                    attachment: 'image',
                    url: 'http://hstatic.net/936/1000019936/10/2015/7-28/thosan.jpg'
                }, `🔫Thợ săn dậy đi! Đêm nay bạn muốn bắn ai?\n/fire <id> để ngắm bắn\n${playersList}`]);
            } else if (p.role == 4) { // Bán sói
                gamef.getRoom(userRoom).roleDoneBy(p.joinID);
                return bot.say(p.joinID, [{
                    attachment: 'image',
                    url: 'http://hstatic.net/936/1000019936/10/2015/7-28/phanboi.jpg'
                }, `🐺Bạn là BÁN SÓI!\nBạn vẫn còn là DÂN! Ngủ tiếp đi!\nID CẢ LÀNG:\n${playersList}`]);
            } else if (p.role == 5) { // Phù thủy
                let sayTxt;
                if (gamef.getRoom(userRoom).witchKillRemain) {
                    sayTxt = `🔮Bạn là Phù thủy!\n${gamef.getRoom(userRoom).witchSaveRemain ? '☑Bạn còn quyền cứu' : '⛔Bạn đã dùng quyền cứu!'}\n☑/kill <id> để giết\n☑/skip để bỏ qua\n${playersList}`;
                } else {
                    sayTxt = `🔮Bạn là Phù thủy!\n${gamef.getRoom(userRoom).witchSaveRemain ? '☑Bạn còn quyền cứu' : '⛔Bạn đã dùng quyền cứu!'}\n⛔Bạn đã dùng quyền giết!\n${playersList}`;
                    gamef.getRoom(userRoom).roleDoneBy(p.joinID);
                }
                return bot.say(p.joinID, [{
                    attachment: 'image',
                    url: 'http://hstatic.net/936/1000019936/10/2015/7-28/phuthuy.jpg'
                }, sayTxt]);
            } else { // DÂN
                gamef.getRoom(userRoom).roleDoneBy(p.joinID);
                return bot.say(p.joinID, [{
                    attachment: 'image',
                    url: 'http://hstatic.net/936/1000019936/10/2015/7-28/danlang.jpg'
                }, `💩Bạn là DÂN! Ngủ tiếp đi :))\n👨‍👩‍👦‍👦ID CẢ LÀNG:\n${playersList}`]);
                
            }
        } else {
            return bot.say(p.joinID, "Đêm nay bạn đã chết =))");
        }
    })
}