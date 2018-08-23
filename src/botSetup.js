module.exports = (bot) => {
    const actionButtons = [
        {
            type: 'nested', title: '🎮Chơi...',
            call_to_actions: [
                { type: 'postback', title: '🌝Tham gia phòng /join', payload: 'JOIN_ROOM' },
                { type: 'postback', title: '🌟Sẵn sàng! /ready', payload: 'READY_ROOM' },
                { type: 'postback', title: '🌚Rời phòng/Tự sát /leave', payload: 'LEAVE_ROOM' },
            ]
        },
        {
            type: 'nested', title: '💡Tính năng/Trợ giúp...',
            call_to_actions: [
                { type: 'postback', title: '👑Easy Vote /evote', payload: 'VOTE' },
                { type: 'postback', title: '💡Trợ giúp /help', payload: 'HELP' },
            ]
        },
        {
            type: 'nested', title: '🔧Tiện ích...',
            call_to_actions: [
                {
                    type: 'nested', title: '👼Tiện ích người chơi...',
                    call_to_actions: [
                        { type: 'postback', title: '🃏Đổi tên /rename', payload: 'USER_RENAME' },
                        { type: 'postback', title: '👤Thông tin /profile', payload: 'USER_PROFILE' },
                    ]
                },
                {
                    type: 'nested', title: '🚪Tiện ích phòng chơi...',
                    call_to_actions: [
                        { type: 'postback', title: '👥Xem DS người chơi /info', payload: 'VIEW_PLAYER_IN_ROOM' },
                        { type: 'postback', title: '➕Thêm phòng chơi /new', payload: 'NEW_ROOM' },
                    ]
                },
                { type: 'postback', title: '👑ADMIN COMMAND /admin', payload: 'ADMIN_COMMAND' },
            ]
        },
    ];
    bot.setPersistentMenu(actionButtons, false);
};