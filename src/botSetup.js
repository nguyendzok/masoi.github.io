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
            type: 'nested', title: 'Tham gia...',
            call_to_actions: [
                { type: 'postback', title: 'Tham gia phòng', payload: 'JOIN_ROOM' },
                { type: 'postback', title: 'Sẵn sàng!', payload: 'READY_ROOM' },
                { type: 'postback', title: 'Rời phòng/Tự sát', payload: 'LEAVE_ROOM' },
            ]
        },
        {
            type: 'nested', title: 'Tiện ích khi chơi...',
            call_to_actions: [
                { type: 'postback', title: 'Đổi tên', payload: 'USER_RENAME' },
                { type: 'postback', title: 'Xem DS dân làng', payload: 'VIEW_PLAYER_IN_ROOM' },
                { type: 'postback', title: '(ADMIN ONLY) COMMAND', payload: 'ADMIN_COMMAND' },
            ]
        },
        { type: 'postback', title: 'Trợ giúp', payload: 'HELP' },
    ];
    bot.setPersistentMenu(actionButtons, false);
};