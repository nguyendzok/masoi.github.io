
module.exports = (bot) => {
    const clanCallback = async (payload, chat) => {
        const openTemplateGoToWebView = (convo) => {
            convo.ask((convo) => {
                console.log("conversation object", convo.userId);
                convo.sendGenericTemplate([{
                    "title": "Ma sói Setup",
                    "image_url": `https://scontent.fhan2-1.fna.fbcdn.net/v/t1.0-9/41158199_504371260007690_7229233697872936960_n.png?_nc_cat=0&oh=c296ffad8c94ce15518bc1c8e8cac42b&oe=5C291C2B`,
                    "subtitle": "Webview beta",
                    "buttons": [{
                        "type": "web_url",
                        "url": "https://hoangngocnguyen.me/Web/maSoiBotSetup/",
                        "title": "Select date",
                        "webview_height_ratio": "compact",
                        "messenger_extensions": true,
                        "fallback_url": "https://hoangngocnguye.me/Web/maSoiBotSetup/?players=5&uid=" + convo.userId,
                        "webview_share_button": "hide"
                    }]
                }]);
            }, (payload, convo) => {
                console.log(">>>> RESPONSED");
                //When invoked the JS script(mentioned below) will close the webview and resume the conversation from here
                //It will all give the payload data back, which you can use to continue the conversation and any data you got as a response from the webview is in "payload" object
                if (typeof payload.postback.payload != "undefined" && payload.postback.payload) {
                    var message = payload.postback.payload;
                    console.log("RES value: " + message);
                }
            });
        };
        let joinID = payload.sender.id;
        chat.conversation((convo) => {
            openTemplateGoToWebView(convo);
        });
    };
    // listen /clan
    bot.hear(/^\/web$/, clanCallback);
};
