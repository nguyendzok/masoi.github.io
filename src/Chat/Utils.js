async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array)
    }
}
// async function roomChatAll(bot, players, sendID, content) {
//     await asyncForEach(players, async (m) => {
//         if (m && m.joinID != sendID) {
//             await bot.say(m.joinID, content);
//         }
//     })
// }
async function roomChatAll(bot, players, sendID, content) {
    let each = players.map(p => {
        if (p.joinID != sendID) {
            return bot.say(p.joinID, content)
        }
    });
    each.forEach(async (sendAction, index) => {
        try {
            await sendAction
            console.log('## Messenger sent to ', players[index].first_name)
        } catch (e) {
            console.error('## Messenger ERR : ', e)
        }
    })
}
// async function roomWolfChatAll(bot, wolfsID, sendID, content) {
//     await asyncForEach(wolfsID, async (m) => {
//         if (m != sendID) {
//             await bot.say(m, content);
//         }
//     })
// }
async function roomWolfChatAll(bot, wolfsID, sendID, content) {
    let each = wolfsID.map(wID => {
        if (wID != sendID) {
            return bot.say(wID, content)
        }
    });
    each.forEach(async (sendAction, index) => {
        try {
            await sendAction
            console.log('## Messenger sent to ', index)
        } catch (e) {
            console.error('## Messenger ERR : ', e)
        }
    })
}

module.exports = {
    asyncForEach: asyncForEach,
    roomChatAll: roomChatAll,
    roomWolfChatAll: roomWolfChatAll,
}