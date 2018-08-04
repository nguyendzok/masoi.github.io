module.exports = (bot) => {
    // bot config
    bot.setGreetingText("Chào mừng bạn đến với Phạm Ngọc Duy GAME bot, hãy bắt đầu trò chơi :3")
    bot.setGetStartedButton((payload, chat) => {
        chat.say('🐺MA SÓI GAME').then(() => {
            chat.say({
                text: `Chào mừng bạn, để bắt đầu hãy chat 'help' hoặc 'trợ giúp' để được hướng dẫn cách chơi!'`,
                quickReplies: ['help', 'trợ giúp'],
            });
        })

    });
    const actionButtons = [
        {
            type: 'nested', title: 'Chơi...',
            call_to_actions: [
                { type: 'postback', title: 'Tham gia phòng /join', payload: 'JOIN_ROOM' },
                { type: 'postback', title: 'Sẵn sàng! /ready', payload: 'READY_ROOM' },
                { type: 'postback', title: 'Rời phòng/Tự sát /leave', payload: 'LEAVE_ROOM' },
            ]
        },
        {
            type: 'nested', title: 'Tiện ích...',
            call_to_actions: [
                {
                    type: 'nested', title: 'Tiện ích người chơi...',
                    call_to_actions: [
                        { type: 'postback', title: 'Đổi tên /rename', payload: 'USER_RENAME' },
                    ]
                },
                {
                    type: 'nested', title: 'Tiện ích phòng chơi...',
                    call_to_actions: [
                        { type: 'postback', title: 'Xem DS người chơi /info', payload: 'VIEW_PLAYER_IN_ROOM' },
                        { type: 'postback', title: 'Thêm phòng chơi /new', payload: 'NEW_ROOM' },
                    ]
                },
                { type: 'postback', title: 'ADMIN COMMAND /admin', payload: 'ADMIN_COMMAND' },
            ]
        },
        { type: 'postback', title: 'Trợ giúp /help', payload: 'HELP' },
    ];
    bot.setPersistentMenu(actionButtons, false);
};