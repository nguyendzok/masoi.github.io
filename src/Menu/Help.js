module.exports = (bot) => {
    const helpCallback = (payload, chat) => {
        chat.getUserProfile().then((user) => {
            chat.say(`Xin chào ${user.last_name + ' ' + user.first_name}! \n` +
                `Để bắt đầu, bạn hãy mở MENU (nút 3 dấu gạch ngang) bên dưới.\n` +
                `Chọn menu: Tham gia... > Tham gia phòng chơi\n` +
                `Chọn một phòng chơi từ danh sách để tham gia một phòng!\n` +
                `Sau khi tham gia thành công, bạn có thể chat với các người chơi khác trong phòng\n` +
                `Tham gia > 'Sẵn sàng!' để thể hiện bạn sẽ tham gia chơi, còn không, hãy chọn 'Rời phòng chơi' để tránh ảnh hưởng người chơi khác\n` +
                `Khi tất cả mọi người đã sẵn sàng (ít nhất 3 người), trò chơi sẽ bắt đầu! \n` +
                `Trong khi chơi, bạn sẽ vote bằng cách chat với nội dung: /vote <id>\n` +
                `VD: /vote 1 \n` +
                `Bạn có thể xem <id> người chơi từ menu: Tiện ích khi chơi... > Các người chơi cùng phòng `);
        })
    };
    // listen HELP button
    bot.on('postback:HELP', helpCallback);
    // listen to HELP
    bot.hear(['help', 'hướng dẫn', 'trợ giúp', 'giúp', /\/help/i], helpCallback);
};