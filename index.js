const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const Cosmic = require('cosmicjs')
const BootBot = require('bootbot')
require('dotenv').config()
const chrono = require('chrono-node')
var schedule = require('node-schedule')
const EventEmitter = require('events').EventEmitter
// var async = require("async");
// var Q = require("q");
const { Game, Room, Player } = require('./src/Game.js');
var gamef = new Game();

const eventEmitter = new EventEmitter()

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
async function roomChatAll(roomID, sendID, content) {
  await asyncForEach(gamef.getRoom(roomID).players, async (m) => {
    if (m && m.joinID != sendID) {
      await bot.say(m.joinID, content)
    }
  })
}
async function roomWolfChatAll(roomID, sendID, content) {
  await asyncForEach(gamef.getRoom(roomID).wolfsID, async (m) => {
    if (m != sendID) {
      await bot.say(m, content)
    }
  })
}
async function roomRoleChat(roomID) {
  const start = async () => {
    await asyncForEach(gamef.getRoom(roomID).players, async (m) => {
      if (m && gamef.getRoom(roomID).alivePlayer[m.joinID]) {
        if (m.role == -1) {//SÓI
          bot.say(m.joinID, ['Sói ơi dậy đi! Đêm nay sói muốn cắn ai?', '/vote <id> để cắn 1 ai đó', 'ID của SÓI: ' + gamef.getRoom(roomID).wolfsTxt.join(' ; '), 'ID của DÂN: ' + gamef.getRoom(roomID).villagersTxt.join(' ; ')]);
        } else if (m.role == 1) { // tiên tri
          bot.say(m.joinID, ['Tiên tri dậy đi! Tiên tri muốn kiếm tra ai?', '/see <id> để kiểm tra', gamef.getRoom(roomID).playersTxt.join(' ; ')]);
        } else if (m.role == 2) { // Bảo vệ
          bot.say(m.joinID, ['Bảo vệ dậy đi! Đêm nay bạn muốn bảo vệ ai?', '/save <id> để bảo vệ', gamef.getRoom(roomID).playersTxt.join(' ; ')]);
        } else {
          bot.say(m.joinID, "Bạn là DÂN! Ngủ tiếp đi :))");
          let userRoom = gamef.getUserRoom(m.joinID);
          gamef.getRoom(userRoom).roleDoneBy(m.joinID);
        }
      } else {
        bot.say(m.joinID, "Bạn đã chết :))");
        gamef.getRoom(userRoom).roleDoneBy(m.joinID);
      }
    })
  }
  start();
}

app.set('port', (process.env.PORT || 5000))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', function (req, res) {
  res.send("Server MA SÓI đang chạy...")
})

app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
    return res.send(req.query['hub.challenge'])
  }
  res.send('wrong token')
})

app.listen(app.get('port'), function () {
  console.log('Started on port', app.get('port'))
})

const bot = new BootBot({
  accessToken: process.env.ACCESS_TOKEN,
  verifyToken: process.env.VERIFY_TOKEN,
  appSecret: process.env.APP_SECRET
})

// bot config
bot.setGreetingText("Chào mừng bạn đến với Phạm Ngọc Duy GAME bot, hãy bắt đầu trò chơi :3")
bot.setGetStartedButton((payload, chat) => {
  chat.say('MA SÓI GAME');
  chat.say('Hãy bắt đầu bằng cách tham gia 1 phòng chơi');
  userId = payload.sender.id;
});
const actionButtons = [
  {
    type: 'nested', title: 'Tham gia...',
    call_to_actions: [
      { type: 'postback', title: 'Tham gia phòng chơi', payload: 'JOIN_ROOM' },
      { type: 'postback', title: 'Sẵn sàng!', payload: 'READY_ROOM' },
      { type: 'postback', title: 'Rời phòng chơi', payload: 'LEAVE_ROOM' },
    ]
  },
  {
    type: 'nested', title: 'Chơi...',
    call_to_actions: [
      { type: 'postback', title: 'Xem danh sách người chơi', payload: 'VIEW_PLAYER_IN_ROOM' },
    ]
  },
  {
    type: 'nested', title: 'Quản trị',
    call_to_actions: [
      { type: 'postback', title: 'RESET các phòng chơi', payload: 'RESET_ROOM' },
    ]
  }
];
bot.setPersistentMenu(actionButtons, false);

// listen JOIN ROOM
bot.on('postback:JOIN_ROOM', (payload, chat) => {
  let joinID = payload.sender.id;
  console.log('$ JOIN > ' + joinID);
  let joinUser;
  let userRoom = gamef.getUserRoom(joinID);
  if (userRoom != undefined) {
    chat.say("Bạn đã tham gia phòng " + (userRoom + 1));
    return;
  }
  let roomListView = gamef.getRoomListView();

  const askRoom = (convo) => {
    convo.ask({
      text: 'Lựa chọn phòng',
      quickReplies: roomListView,
    }, (payload, convo) => {
      if (!(payload.message) || isNaN(parseInt(payload.message.text))) {
        convo.say(`Vui lòng nhập 1 phòng hợp lệ!`);
        convo.end();
        return;
      }
      let roomTxt = payload.message.text
      let roomID = parseInt(roomTxt) - 1;

      if (gamef.getRoom(roomID).ingame) {
        chat.say(`Phòng đã vào chơi rồi, vui lòng chọn phòng khác!`);
        return;
      } else {
        // save room number for user
        gamef.setUserRoom(joinID, roomID);
        // add new player to room
        gamef.getRoom(roomID).addPlayer(new Player({
          id: gamef.getRoom(roomID).newPlayerID(),
          joinID: joinID,
          last_name: joinUser.last_name,
          first_name: joinUser.first_name,
          avatar: joinUser.profile_pic
        }));
        // notice new player to everyone in room
        const start = async () => {
          let playerListView = gamef.getRoomPlayerView(roomID);
          await asyncForEach(gamef.getRoom(roomID).players, async (m) => {
            if (m) {
              await bot.sendGenericTemplate(m.joinID, playerListView).then(async () => {
                await bot.say(m.joinID, `${joinUser.first_name} đã tham gia phòng!`)
              })
            }
          })
          convo.end();
          console.log(`$ ROOM ${(roomID + 1)} > JOIN > ${joinID}`);
        }
        start();
      }
    });
  };

  chat.getUserProfile().then((user) => {
    joinUser = user;
    chat.conversation((convo) => {
      askRoom(convo);
    });
  })
});
//listen for READY
bot.on('postback:READY_ROOM', (payload, chat) => {
  const joinID = payload.sender.id;
  const userRoom = gamef.getUserRoom(joinID);
  if (userRoom != undefined) {
    console.log("$ ROOM " + (userRoom + 1) + " > READY > " + joinID);
    // set status READY
    joinUser = gamef.searchUserInRoom(joinID, userRoom);
    if (!joinUser.ready) {
      joinUser.getReady();
      // get UserName and sendGlobalMessage to ROOM
      chat.getUserProfile().then((user) => {
        //let playerListView = gamef.getRoomPlayerView(userRoom);
        const start = async () => {
          await asyncForEach(gamef.getRoom(userRoom).players, async (m) => {
            if (m) {
              //await bot.sendGenericTemplate(m.joinID, playerListView).then(async () => {
              await bot.say(m.joinID, `${user.first_name} đã sẵn sàng!`)
              //})
            }
          })
          gamef.gameIsReady(userRoom, (gameReady) => {
            if (gameReady && !gamef.getRoom(userRoom).ingame) {
              const gameStart = async () => {
                console.log(`$ ROOM ${userRoom + 1} > GAME_START`);
                gamef.getRoom(userRoom).setInGame();
                gamef.roleRandom(userRoom);
                await roomChatAll(userRoom, 0, "Tất cả mọi người đã sẵn sàng! Game sẽ bắt đầu...");
                //while(){
                gamef.getRoom(userRoom).dayNightSwitch();
                await roomChatAll(userRoom, 0, `Đêm thứ ${gamef.getRoom(userRoom).day}`);
                await roomRoleChat(userRoom);
                //}
              }
              gameStart();
            }
          });
        }
        start();
      })
    } else {
      chat.say("Bạn đã sẵn sàng rồi!");
    }
  } else {
    chat.say("Bạn chưa tham gia phòng nào!");
  }
});

// listen LEAVE ROOM message
bot.on('postback:LEAVE_ROOM', (payload, chat) => {
  let joinID = payload.sender.id;
  const userRoom = gamef.getUserRoom(joinID);
  if (userRoom) {
    gamef.setUserRoom(joinID, undefined);
    if (!gamef.getRoom(userRoom).ingame) {
      gamef.getRoom(userRoom).deletePlayer(joinID);
    }
  } else {
    chat.say(`Bạn chưa tham gia phòng nào!`);
  }
});

// listen RESET ROOM message
bot.on('postback:RESET_ROOM', (payload, chat) => {
  let userId = payload.sender.id;
  if (userId == 2643770348982136) {
    gamef.resetRoom();
    chat.say('Đã tạo lại 5 phòng chơi!');
    console.log('$ ROOM > RESET_ALL');
  } else {
    chat.say('Bạn không có quyền thực hiện yêu cầu này!');
  }
});
// listen for ROOM CHAT and VOTE
bot.on('message', (payload, chat) => {
  const joinID = payload.sender.id;
  const chatTxt = payload.message.text;
  const userRoom = gamef.getUserRoom(joinID);

  if (userRoom == undefined) {
    chat.say("Sử dụng menu để tham gia phòng!");
    return;
  }

  if (gamef.getRoom(userRoom).alivePlayer[joinID]) { // nếu còn sống
    chat.getUserProfile().then((user) => {
      if (gamef.getRoom(userRoom).isNight) { // ban đêm
        let userRole = gamef.getRoom(userRoom).getRole(joinID);
        if (userRole == -1) {// là SÓI
          if (!chatTxt.match(/\/vote.[0-9]+/g)) {//chat
            roomWolfChatAll(userRoom, joinID, user.first_name + ': ' + chatTxt);
          } else {// SÓI VOTE
            let voteID = chatTxt.match(/[0-9]+/g)[0];
            const start = async () => {
              let voteKill = gamef.getRoom(userRoom).playersTxt[voteID];
              await chat.say(`Bạn đã vote cắn ${voteKill}`);
              await roomWolfChatAll(userRoom, joinID, user.first_name + ' đã vote cắn ' + voteKill);
              await gamef.getRoom(userRoom).vote(joinID, voteID);
              // kiểm tra đã VOTE xong chưa?
              gamef.getRoom(userRoom).roleIsDone((isDone) => {
                if (isDone) {
                  roomChatAll(userRoom, 0, `Trời sáng rồi mọi người dậy đi`);
                  let deathID = gamef.getRoom(userRoom).deathID;
                  gamef.getRoom(userRoom).dayNightSwitch();
                  if (deathID != -1) {
                    let deathTxt = gamef.getRoom(userRoom).playersTxt[deathID];
                    gamef.getRoom(userRoom).kill();
                    roomChatAll(userRoom, 0, `Đêm hôm qua ${deathTxt} đã bị cắn! Mọi người có 5 phút thảo luận! /vote <id> để treo cổ 1 người`);
                  } else {
                    roomChatAll(userRoom, 0, `Đêm hôm qua không ai chết cả! Mọi người có 5 phút thảo luận! /vote <id> để treo cổ 1 người`);
                  }
                  let time = new Date(Date.now() + 5*60*1000);
                  var j = schedule.scheduleJob(time, function () {
                    roomChatAll(userRoom, 0, `Đã hết thời gian, mọi người vote một người để treo cổ!`);
                    console.log(`$ ROOM ${userRoom} > END OF DISCUSSION!`);
                  });
                }
              });
            }
            start();
          }
        } else if (userRole == 1) { // là tiên tri
          if (chatTxt.match(/\/see.[0-9]+/g)) {//see
            let voteID = chatTxt.match(/[0-9]+/g)[0];
            let role = gamef.getRoom(userRoom).getRoleByID(voteID);
            chat.say(`${voteID} là ${role == -1 ? 'SÓI' : role == 2 ? 'BẢO VỆ' : role == 0 ? 'DÂN' : role == 1 ? 'TIÊN TRI, Bạn đùa tớ à :v' : 'RoleErr: Lỗi rùi, ahuhu!!!'}`);
            gamef.getRoom(userRoom).roleDoneBy(joinID);
          } else {
            chat.say(`Bạn không thể trò chuyện trong đêm!`);
          }
        } else if (userRole == 2) { // là bảo vệ
          if (chatTxt.match(/\/save.[0-9]+/g)) {//save
            let voteID = chatTxt.match(/[0-9]+/g)[0];
            if (!gamef.getRoom(userRoom).save(voteID)) {
              chat.say(`Bạn không thể bảo vệ 1 người 2 đêm liên tiếp!`);
            } else {
              chat.say(`Bạn đã bảo vệ ${gamef.getRoom(userRoom).playersTxt[voteID]}!`);
              gamef.getRoom(userRoom).roleDoneBy(joinID);
            }
          } else {
            chat.say(`Bạn không thể trò chuyện trong đêm!`);
          }
        }
      } else {
        if (!gamef.getRoom(userRoom).isNight) {// ban NGÀY, mọi người thảo luận
          if (!chatTxt.match(/\/vote.[0-9]+/g)) {
            roomChatAll(userRoom, joinID, user.first_name + ': ' + chatTxt);
          } else {
            // VOTE TREO CỔ
            let voteID = chatTxt.match(/[0-9]+/g)[0];
            const start = async () => {
              let voteKill = gamef.getRoom(userRoom).playersTxt[voteID];
              await chat.say(`Bạn đã vote treo cổ ${voteKill}`);
              await roomChatAll(userRoom, joinID, user.first_name + ' đã vote treo cổ ' + voteKill);
              await gamef.getRoom(userRoom).vote(joinID, voteID);
              // kiểm tra đã VOTE XONG chưa?
              gamef.getRoom(userRoom).roleIsDone((isDone) => {
                if (isDone) {
                  let deathID = gamef.getRoom(userRoom).deathID;
                  if (deathID != -1) {
                    let deathTxt = gamef.getRoom(userRoom).playersTxt[deathID];
                    gamef.getRoom(userRoom).kill();
                    roomChatAll(userRoom, 0, `Đã treo cổ ${deathTxt}! Mọi người đi ngủ`);
                  } else {
                    roomChatAll(userRoom, 0, `Không ai bị treo cổ! Mọi người đi ngủ`);
                  }
                  const newNightStart = async () => {
                    gamef.getRoom(userRoom).dayNightSwitch();
                    await roomChatAll(userRoom, 0, `Đêm thứ ${gamef.getRoom(userRoom).day}`);
                    await roomRoleChat(userRoom);
                  }
                  newNightStart();
                }
              });
            }
            start();
          }
        }
      }
    })
  } else {
    chat.say(`Bạn đã chết! Xin giữ im lặng`)
  }
  console.log(`$ ROOM ${userRoom + 1} > ${joinID} chat: ${chatTxt}`);
});
// listen to show menu
bot.hear(['menu'], (payload, chat) => {
  chat.getUserProfile().then((user) => {
    chat.say(`MENU bên dưới đấy!!! Nút 3 dấu gạch ngang! :3`);
    // chat.say({
    //   text: `Chào ${user.first_name}, hãy bắt đầu trò chơi`,
    //   buttons: actionButtons,
    // });
  })
})

// bot.hear(['help'], (payload, chat) => {
//   // Send a text message with buttons
//   chat.say({
//     text: 'What do you need help with?',
//     buttons: [
//       { type: 'postback', title: 'Settings', payload: 'HELP_SETTINGS' },
//       { type: 'postback', title: 'FAQ', payload: 'HELP_FAQ' },
//       { type: 'postback', title: 'Talk to a human', payload: 'HELP_HUMAN' }
//     ]
//   });
// });
// bot.hear('setup', (payload, chat) => {
//   const getBucketSlug = (convo) => {
//     convo.ask("What's your Bucket's slug?", (payload, convo) => {
//       var slug = payload.message.text;
//       convo.set('slug', slug)
//       convo.say("setting slug as "+slug).then(() => getBucketReadKey(convo));
//     })
//   }
//   const getBucketReadKey = (convo) => {
//     convo.ask("What's your Bucket's read key?", (payload, convo) => {
//       var readkey = payload.message.text;
//       convo.set('read_key', readkey)
//       convo.say('setting read_key as '+readkey).then(() => getBucketWriteKey(convo))
//     })
//   }
//   const getBucketWriteKey = (convo) => {
//     convo.ask("What's your Bucket's write key?", (payload, convo) => {
//       var writekey = payload.message.text
//       convo.set('write_key', writekey)
//       convo.say('setting write_key as '+writekey).then(() => finishing(convo))
//     })
//   }
//   const finishing = (convo) => {
//     var newConfigInfo = {
//       slug: convo.get('slug'),
//       read_key: convo.get('read_key'),
//       write_key: convo.get('write_key')
//     }
//     config.bucket = newConfigInfo
//     convo.say('All set :)')
//     convo.end();
//   }

//   chat.conversation((convo) => {
//     getBucketSlug(convo)
//   })
// })

// bot.hear('config', (payload, chat) => {
//   if(JSON.stringify(config.bucket) === undefined){
//     chat.say("No config found :/ Be sure to run 'setup' to add your bucket details")
//   }
//   chat.say("A config has been found :) "+ JSON.stringify(config.bucket))
// })

// bot.hear('create', (payload, chat) => {
//   chat.conversation((convo) => {
//     convo.ask("What would you like your reminder to be? etc 'I have an appointment tomorrow from 10 to 11 AM' the information will be added automatically", (payload, convo) => {
//       datetime = chrono.parseDate(payload.message.text)
//       var params = {
//         write_key: config.bucket.write_key,
//         type_slug: 'reminders',
//         title: payload.message.text,
//         metafields: [
//          {
//            key: 'date',
//            type: 'text',
//            value: datetime
//          }
//         ]
//       }
//       Cosmic.addObject(config, params, function(error, response){
//         if(!error){
//           eventEmitter.emit('new', response.object.slug, datetime)
//           convo.say("reminder added correctly :)")
//           convo.end()
//         } else {
//           convo.say("there seems to be a problem. . .")
//           convo.end()
//         }
//       })
//     })
//   })
// })

// bot.hear('help', (payload, chat) => {
//   chat.say('Here are the following commands for use.')
//   chat.say("'create': add a new reminder")
//   chat.say("'setup': add your bucket info such as slug and write key")
//   chat.say("'config': lists your current bucket config")
// })

// eventEmitter.on('new', function(itemSlug, time) {
//   schedule.scheduleJob(time, function(){
//     Cosmic.getObject(config, {slug: itemSlug}, function(error, response){
//       if(response.object.metadata.date == new Date(time).toISOString()){
//         bot.say(BotUserId, response.object.title)
//         console.log('firing reminder')
//       } else {
//         eventEmitter.emit('new', response.object.slug, response.object.metafield.date.value)
//         console.log('times do not match checking again at '+response.object.metadata.date)
//       }
//     })
//   })
// })

bot.start()
