const { roomChatAll } = require('../Chat/Utils');
const roomRoleChat = require('../Night/roomRoleChat');
const gameIsNotEndCheck = require('../MainGame/gameIsNotEndCheck');

module.exports = async (gamef, bot, userRoom) => {
    gamef.getRoom(userRoom).roleIsDone(async () => {
        gamef.getRoom(userRoom).cancelSchedule();
        let deathID = gamef.getRoom(userRoom).deathID;
        let deathTxt = gamef.getRoom(userRoom).playersTxt[deathID];
        if (gamef.getRoom(userRoom).saveOrKill < 0) {
            gamef.getRoom(userRoom).kill();
            roomChatAll(bot, gamef.getRoom(userRoom).players, 0, `👻Đã treo cổ ${deathTxt}! Mọi người đi ngủ`);
            gamef.getRoom(userRoom).newLog(`👻Mọi người đã treo cổ *${deathTxt}* với ${(gamef.getRoom(userRoom).aliveCount() + 1 + gamef.getRoom(userRoom).saveOrKill) / 2} tha/${(gamef.getRoom(userRoom).aliveCount() + 1 - gamef.getRoom(userRoom).saveOrKill) / 2} treo`);
        } else {
            roomChatAll(bot, gamef.getRoom(userRoom).players, 0, `😇Đã tha chết cho ${deathTxt}! Mọi người đi ngủ`);
            gamef.getRoom(userRoom).newLog(`😇Mọi người tha chết cho *${deathTxt}* với ${(gamef.getRoom(userRoom).aliveCount() + gamef.getRoom(userRoom).saveOrKill) / 2} tha/${(gamef.getRoom(userRoom).aliveCount() - gamef.getRoom(userRoom).saveOrKill) / 2} treo`);
        }
        gameIsNotEndCheck(gamef, bot, userRoom, () => {
            // Đêm tiếp theo
            gamef.getRoom(userRoom).dayNightSwitch();
            roomChatAll(bot, gamef.getRoom(userRoom).players, 0, `🌛Đêm thứ ${gamef.getRoom(userRoom).day}🌛`);
            gamef.getRoom(userRoom).newLog(`🌛Đêm thứ ${gamef.getRoom(userRoom).day}🌛++++++++++`);
            gamef.func(roomRoleChat, bot, userRoom);
        });
    })
}