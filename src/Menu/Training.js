const { sendImageCard } = require('../Chat/Utils');

module.exports = (bot) => {
    var askAction = (convo, askMsg, answerTxt) => {
        convo.ask(askMsg, (payload, convo) => {
            let resTxt = payload.message ? payload.message.text : undefined;
            if (resTxt) {
                if (resTxt == answerTxt) {
                    convo.say(`☑Thao tác đúng!`)
                }
            } else {
                convo.say(`⛔Vui lòng thử lại!`);
                askAction(convo, askMsg, answerTxt);
            }
        });
    }
    const trainCallBack = async (payload, chat) => {
        // let thisUser;
        const joinID = payload.sender.id;
        // chat.getUserProfile().then((user) => {
        //     thisUser = user;
        // });
        await chat.say(`Xin chào, \n` +
            `Hãy chắc chắc bạn đã đọc kĩ hướng dẫn (để tham gia phòng và sẵn sàng) trước khi bắt đầu!\n` +
            `Tôi sẽ hướng dẫn bạn cách chơi khi trò chơi bắt đầu!\n` +
            `\n` +
            `SETUP: 1 tiên tri, 1 bảo vệ, 1 sói, 1 dân\n` +
            `Có 4 người chơi tên là: Duy, Ngân, Hà và Nam` +
            `\n` +
            `Mỗi đêm, quản trò (bot) sẽ phát bài cho bạn và cho biết chức năng của bạn là gì cũng như cách thực hiện chức năng của mình\n` +
            `Hãy thực hiện chính xác cú pháp theo hướng dẫn\n` +
            `\n` +
            `OK! Hãy thử trở thành tiên tri nào...
            `);
        playersList = "0: Duy / 1: Ngân / 2: Hà / 3: Nam";
        await sendImageCard(bot, joinID, 'https://www.facebook.com/masoigame/photos/pcb.1889279921367724/1889278528034530', 'Tiên tri')
            .then(() => {
                chat.say(joinID, `🔍Tiên tri dậy đi! Tiên tri muốn kiểm tra ai?\n"/see <số ID>" để kiểm tra\n${playersList}`, { typing: true });
            });
        chat.conversation((convo) => {
            askAction(convo,
                `OK, để tôi chỉ dẫn nè! Bạn nhìn thấy mỗi người chơi đều có 1 mã số riêng của họ\n` +
                `VD: Duy mã số 0, Nam mã số 3\n` +
                `Nếu bạn muốn soi Duy hãy trả lời với nội dung: "/see 0"\n` +
                `/see 0\n` +
                `Nếu bạn đã hiểu thì hãy soi thử Nam nhé`, '/see 3'
            );
        });
    };
    // listen HELP button
    bot.on('postback:TRAINING', trainCallBack);
    bot.hear(/\/train/i, trainCallBack);
};