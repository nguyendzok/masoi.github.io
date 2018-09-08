function startConvo(convo, askItem, index, askSeq) {
    convo.ask(askItem.qreply ? {
        text: askItem.txt,
        quickReplies: askItem.qreply,
    } : askItem.txt, (payload, convo) => {
        let resTxt = payload.message ? payload.message.text : undefined;
        if (resTxt) {
            let result = askItem.callback(convo, index, resTxt);
            if (result) {
                convo.set(`data[${index}]`, result);
                if (index + 1 < askSeq.length) {
                    startConvo(convo, askSeq[index + 1], index + 1, askSeq);
                }
            } else {
                convo.say(`Thao tác sai! Vui lòng thử lại!`);
                convo.end();
            }
        } else {
            convo.say(`Vui lòng thử lại!`);
            convo.end();
        }
    })
}
function voteConvo(chat, askSeq) {
    chat.conversation((convo) => {
        let len = askSeq.length;
        if (len <= 0) return;
        startConvo(convo, askSeq[0], 0, askSeq)

        // askSeq.reduce((promise, askItem, index) => {
        //     return promise.then(() => 

        // );
        // }, Promise.resolve());
        // convo.end();
    });
}

async function asyncForEach(array, mapCallback, /*callback*/) {
    // for (let index = 0; index < array.length; index++) {
    //     await callback(array[index], index, array)
    // }
    let each = array.map(mapCallback);
    each.forEach(async (action, index) => {
        try {
            await action
            // console.log('##  ROOM ROLE CHAT : ', index);
        } catch (e) {
            console.error('## ForEach ERR at Utils.js : ', e)
        }
    })
}
async function roomChatAll(bot, players, sendID, content) {
    let each = players.map(p => {
        if (p && p.joinID != sendID) {
            return bot.say(p.joinID, content)
        }
    });
    each.forEach(async (sendAction, index) => {
        try {
            await sendAction
            //console.log('## Messenger sent to ', players[index].first_name)
        } catch (e) {
            console.error('## Messenger ERR : ', e)
        }
    })
}
async function roomWolfChatAll(bot, wolfsID, sendID, content) {
    let each = wolfsID.map(wID => {
        if (wID != sendID) {
            return bot.say(wID, content)
        }
    });
    each.forEach(async (sendAction, index) => {
        try {
            await sendAction
            //console.log('## Messenger sent to ', index)
        } catch (e) {
            console.error('## Messenger ERR : ', e)
        }
    })
}

function sendImageCard(bot, joinID, imageURL, buttonTxt = "Ma sói card") {
    return bot.sendMessage(joinID, {
        attachment: {
            type: "template",
            payload: {
                template_type: "media",
                elements: [
                    {
                        media_type: "image",
                        url: imageURL,
                        buttons: [
                            {
                                type: "web_url",
                                url: imageURL,
                                title: buttonTxt,
                            }
                        ]
                    }
                ]
            }
        }
    });
}

module.exports = {
    voteConvo: voteConvo,
    asyncForEach: asyncForEach,
    roomChatAll: roomChatAll,
    roomWolfChatAll: roomWolfChatAll,
    sendImageCard: sendImageCard,
}

// async function roomChatAll(bot, players, sendID, content) {
//     await asyncForEach(players, async (m) => {
//         if (m && m.joinID != sendID) {
//             await bot.say(m.joinID, content);
//         }
//     })
// }
// async function roomWolfChatAll(bot, wolfsID, sendID, content) {
//     await asyncForEach(wolfsID, async (m) => {
//         if (m != sendID) {
//             await bot.say(m, content);
//         }
//     })
// }