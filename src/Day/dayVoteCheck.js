const { roomChatAll } = require('../Chat/Utils');
const roomRoleChat = require('../Night/roomRoleChat');

module.exports = (gamef, bot, userRoom) => {
    const newStart = async () => {
      gamef.getRoom(userRoom).findOutDeathID();
      gamef.getRoom(userRoom).cancelSchedule();
      let deathID = gamef.getRoom(userRoom).deathID;
      if (deathID != -1 && gamef.getRoom(userRoom).alivePlayer[gamef.getRoom(userRoom).players[deathID].joinID]) { // mời 1 người lên giá treo cổ
        gamef.getRoom(userRoom).resetRoleDone();
        gamef.getRoom(userRoom).setMorning(false);
        let deathTxt = gamef.getRoom(userRoom).playersTxt[deathID];
        roomChatAll(bot, gamef.getRoom(userRoom).players, 0, `😈Mời ${deathTxt} lên giá treo cổ !!!\n⏰Bạn có 1 phút để trăn trối\n1 PHÚT bắt đầu!`);
        // 1 phút trăn trối
        let time = new Date(Date.now() + 1 * 60 * 1000);
        gamef.getRoom(userRoom).addSchedule(time, () => {
          roomChatAll(bot, gamef.getRoom(userRoom).players, 0, `⏰Đã hết thời gian, mọi người vote nào!\n👎TREO CỔ hay 👍CỨU?\n/yes hoặc /no`);
          console.log(`$ ROOM ${userRoom + 1} > END OF TRĂN TRỐI :))`);
        });
      } else {
        await roomChatAll(bot, gamef.getRoom(userRoom).players, 0, `😇Không ai bị treo cổ do có số vote bằng nhau hoặc người bị treo đã tự sát! Mọi người đi ngủ`);
        gamef.getRoom(userRoom).newLog(`😇Không ai bị treo cổ do có số vote bằng nhau hoặc người bị treo đã tự sát!`);
        gameIsNotEndCheck(userRoom, async () => {
          // Đêm tiếp theo
          gamef.getRoom(userRoom).dayNightSwitch();
          roomChatAll(bot, gamef.getRoom(userRoom).players, 0, `🌛Đêm thứ ${gamef.getRoom(userRoom).day}🌛`);
          gamef.getRoom(userRoom).newLog(`🌛Đêm thứ ${gamef.getRoom(userRoom).day}🌛++++++++++`);
          gamef.func(roomRoleChat, bot, userRoom);
        });
      }
    }
    newStart();
  }