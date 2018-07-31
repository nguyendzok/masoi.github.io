async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}
async function roomChatAll(bot, players, sendID, content) {
    await asyncForEach(players, async (m) => {
        if (m && m.joinID != sendID) {
            await bot.say(m.joinID, content);
        }
    })
}
async function roomWolfChatAll(bot, wolfsID, sendID, content) {
    await asyncForEach(wolfsID, async (m) => {
      if (m != sendID) {
        await bot.say(m, content);
      }
    })
  }

module.exports = {
    asyncForEach,
    roomChatAll,
    roomWolfChatAll
}