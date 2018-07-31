async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}
async function roomChatAll(bot, roomID, sendID, content) {
    await asyncForEach(gamef.getRoom(roomID).players, async (m) => {
        if (m && m.joinID != sendID) {
            await bot.say(m.joinID, content);
        }
    })
}

module.exports = {
    asyncForEach,
    roomChatAll
}