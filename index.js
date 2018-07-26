const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
// const app = express()
// const Cosmic = require('cosmicjs')
const BootBot = require('bootbot')
require('dotenv').config()
// const chrono = require('chrono-node')
var schedule = require('node-schedule')
// const EventEmitter = require('events').EventEmitter
// var async = require("async");
// var Q = require("q");
const { Game, Room, Player } = require('./src/Game.js');
var gamef = new Game();

// const eventEmitter = new EventEmitter()

async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}
async function roomChatAll(roomID, sendID, content) {
  await asyncForEach(gamef.getRoom(roomID).players, async (m) => {
    if (m && m.joinID != sendID) {
      await bot.say(m.joinID, content);
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

  await asyncForEach(gamef.getRoom(roomID).players, async (m) => {
    if (m && gamef.getRoom(roomID).alivePlayer[m.joinID]) {
      const start = async () => {
        console.log(`$ ROOM ${roomID + 1} > ${gamef.roleTxt[m.role]} > ${m.first_name}`);
        let wolfList = gamef.getRoom(roomID).wolfsTxt.join(' ; ');
        let villagersList = gamef.getRoom(roomID).villagersTxt.join(' ; ');
        let playersList = gamef.getRoom(roomID).playersTxt.join(' ; ');
        if (m.role == -1) {//SÓI
          bot.say(m.joinID, `Sói ơi dậy đi! Đêm nay sói muốn cắn ai?\n/vote <id> để cắn 1 ai đó\nID team SÓI:\n ${wolfList}\n'ID team DÂN:\n ${villagersList}`);
        } else if (m.role == 1) { // tiên tri
          bot.say(m.joinID, `Tiên tri dậy đi! Tiên tri muốn kiểm tra ai?\n/see <id> để kiểm tra\n${playersList}`);
        } else if (m.role == 2) { // Bảo vệ
          bot.say(m.joinID, `Bảo vệ dậy đi! Đêm nay bạn muốn bảo vệ ai?\n/save <id> để bảo vệ\n${playersList}`);
        } else if (m.role == 3) { // Thợ săn
          bot.say(m.joinID, `Thợ săn dậy đi! Đêm nay bạn muốn bắn ai?\n/fire <id> để ngắm bắn\n${playersList}`);
        } else {
          bot.say(m.joinID, "Bạn là DÂN! Ngủ tiếp đi :))");
          gamef.getRoom(roomID).roleDoneBy(m.joinID);
        }
      }
      start();
    } else {
      bot.say(m.joinID, "Bạn đã chết =))");
      gamef.getRoom(roomID).roleDoneBy(m.joinID);
    }
  })
}
function yesNoVoteCheck(userRoom) {
  gamef.getRoom(userRoom).roleIsDone((isDone) => {
    if (!isDone) {
      return;
    }
    let deathID = gamef.getRoom(userRoom).deathID;
    let deathTxt = gamef.getRoom(userRoom).playersTxt[deathID];
    if (gamef.getRoom(userRoom).saveOrKill < 0) {
      gamef.getRoom(userRoom).kill();
      roomChatAll(userRoom, 0, `Đã treo cổ ${deathTxt}! Mọi người đi ngủ`);
      gamef.getRoom(userRoom).newLog(`Mọi người đã treo cổ (${deathTxt})!`);
    } else {
      roomChatAll(userRoom, 0, `Đã tha chết cho ${deathTxt}! Mọi người đi ngủ`);
      gamef.getRoom(userRoom).newLog(`Mọi người tha chết cho (${deathTxt})!`);
    }
    gameIsNotEndCheck(userRoom, () => {
      const start2 = async () => {
        // Đêm tiếp theo
        gamef.getRoom(userRoom).dayNightSwitch();
        await roomChatAll(userRoom, 0, `Đêm thứ ${gamef.getRoom(userRoom).day}`);
        gamef.getRoom(userRoom).newLog(`Đêm thứ ${gamef.getRoom(userRoom).day}`);
        await roomRoleChat(userRoom);
      };
      start2();
    });
  })
}
function roleDoneCheck(userRoom) {
  return gamef.getRoom(userRoom).roleIsDone((isDone) => {
    if (isDone) {
      gamef.getRoom(userRoom).findOutDeathID();
      roomChatAll(userRoom, 0, `Trời sáng rồi mọi người dậy đi`);
      let deathID = gamef.getRoom(userRoom).deathID;
      let deathTxt;
      if (deathID != -1) {
        deathTxt = gamef.getRoom(userRoom).playersTxt[deathID];
      }
      if (gamef.getRoom(userRoom).kill()) {
        roomChatAll(userRoom, 0, `Đêm hôm qua (${deathTxt}) đã bị cắn!`);
        gamef.getRoom(userRoom).newLog(`Người bị cắn: (${deathTxt}) là ${gamef.roleTxt[gamef.getRoom(userRoom).getRoleByID(deathID)]}`);
        if (gamef.getRoom(userRoom).players[deathID].role === 3) { //người chết là thợ săn
          let fireID = gamef.getRoom(userRoom).fireID;
          let deathFireTxt = gamef.getRoom(userRoom).playersTxt[fireID];
          roomChatAll(userRoom, 0, `Thợ săn vừa chết đã ngắm bắn (${deathFireTxt})!`);
          gamef.getRoom(userRoom).newLog(`Thợ săn vừa chết đã ngắm bắn (${deathFireTxt}) là ${gamef.roleTxt[gamef.getRoom(userRoom).getRoleByID(fireID)]}`);
        }
        console.log(`$ ROOM ${userRoom + 1} > ${deathTxt} DIED!`);
      } else {
        console.log(`$ ROOM ${userRoom + 1} > NOBODY DIED!`);
        gamef.getRoom(userRoom).newLog(`${deathID != -1 ? `Người bị cắn: (${deathTxt}) là ${gamef.roleTxt[gamef.getRoom(userRoom).getRoleByID(deathID)]}\n` : ``} Và đêm hôm đấy không ai chết cả!`);
        roomChatAll(userRoom, 0, `Đêm hôm qua không ai chết cả!`);
      }
      gameIsNotEndCheck(userRoom, () => {
        let playersInRoomTxt = gamef.getRoom(userRoom).playersTxt.join(' ; ');
        roomChatAll(userRoom, 0, `Mọi người có 6 phút thảo luận!`);
        gamef.getRoom(userRoom).dayNightSwitch();

        let time = new Date(Date.now() + 6 * 60 * 1000);
        gamef.getRoom(userRoom).addSchedule(time, () => {
          roomChatAll(userRoom, 0, `Đã hết thời gian, mọi người vote một người để treo cổ!\n/vote <id> để treo cổ 1 người\n${playersInRoomTxt}`);
          gamef.getRoom(userRoom).chatOFF();
          console.log(`$ ROOM ${userRoom + 1} > END OF DISCUSSION!`);
        });
      });
    }
  });
}
function gameIsNotEndCheck(userRoom, callback) {
  gamef.getRoom(userRoom).gameIsEnd((winner) => {
    const winnerStart = async () => {
      if (winner === 0) {
        callback();
      } else {
        console.log(`$ ROOM ${userRoom + 1} > END GAME > ${winner === -1 ? 'SÓI' : 'DÂN'} thắng!`);
        await roomChatAll(userRoom, 0, [`Trò chơi đã kết thúc...\n${winner === -1 ? 'SÓI' : 'DÂN'} thắng!`, `Bạn có thể sẵn sàng để bắt đầu chơi lại, hoặc tiếp tục trò chuyện với các người chơi khác trong phòng!`]);
        await roomChatAll(userRoom, 0, gamef.getRoom(userRoom).logs.join(`\n`));
        gamef.getRoom(userRoom).resetRoom();
      }
    }
    winnerStart();
  });
}

const bot = new BootBot({
  accessToken: process.env.ACCESS_TOKEN,
  verifyToken: process.env.VERIFY_TOKEN,
  appSecret: process.env.APP_SECRET
})

// bot config
bot.setGreetingText("Chào mừng bạn đến với Phạm Ngọc Duy GAME bot, hãy bắt đầu trò chơi :3")
bot.setGetStartedButton((payload, chat) => {
  chat.say('MA SÓI GAME').then(() => {
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
      { type: 'postback', title: 'Tham gia phòng chơi', payload: 'JOIN_ROOM' },
      { type: 'postback', title: 'Sẵn sàng!', payload: 'READY_ROOM' },
      { type: 'postback', title: 'Rời phòng chơi', payload: 'LEAVE_ROOM' },
    ]
  },
  {
    type: 'nested', title: 'Tiện ích khi chơi...',
    call_to_actions: [
      { type: 'postback', title: 'Đổi tên', payload: 'USER_RENAME' },
      { type: 'postback', title: 'Các người chơi cùng phòng', payload: 'VIEW_PLAYER_IN_ROOM' },
      { type: 'postback', title: '(ADMIN ONLY) RESET ROOM', payload: 'RESET_ROOM' },
    ]
  },
  { type: 'postback', title: 'Trợ giúp', payload: 'HELP' },
];
bot.setPersistentMenu(actionButtons, false);

// listen JOIN ROOM
bot.on('postback:JOIN_ROOM', (payload, chat) => {
  let joinID = payload.sender.id;
  console.log('$ JOIN > ' + joinID);
  let joinUser;
  let userRoom = gamef.getUserRoom(joinID);
  if (userRoom != undefined) {
    chat.say(`Bạn đã tham gia phòng ${(userRoom + 1)} rồi! Để rời phòng chơi, chọn menu Tham gia > Rời phòng chơi! `);
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
      gamef.getRoom(userRoom).oneReady();
      // get UserName and sendGlobalMessage to ROOM
      chat.getUserProfile().then((user) => {
        //let playerListView = gamef.getRoomPlayerView(userRoom);
        const start = async () => {
          await asyncForEach(gamef.getRoom(userRoom).players, async (m) => {
            if (m) {
              //await bot.sendGenericTemplate(m.joinID, playerListView).then(async () => {
              await bot.say(m.joinID, `${user.first_name} đã sẵn sàng! (${gamef.getRoom(userRoom).readyCount}/${gamef.getRoom(userRoom).players.length})`)
              //})
            }
          })
          gamef.gameIsReady(userRoom, (gameReady) => {
            if (gameReady && !gamef.getRoom(userRoom).ingame) {
              const gameStart = async () => {
                console.log(`$ ROOM ${userRoom + 1} > GAME_START`);
                gamef.getRoom(userRoom).setInGame();
                let roleListTxt = gamef.roleRandom(userRoom);
                await roomChatAll(userRoom, 0, [`Tất cả mọi người đã sẵn sàng! Game sẽ bắt đầu...`, roleListTxt]);
                //while(){
                gamef.getRoom(userRoom).dayNightSwitch();
                await roomChatAll(userRoom, 0, `Đêm thứ ${gamef.getRoom(userRoom).day}`);
                gamef.getRoom(userRoom).newLog(`Đêm thứ ${gamef.getRoom(userRoom).day}`);
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
  if (userRoom != undefined) {
    if (!gamef.getRoom(userRoom).ingame) {
      gamef.getRoom(userRoom).deletePlayer(joinID);
    } else {
      gamef.getRoom(userRoom).killAction(gamef.getRoom(userRoom).getPlayer(joinID).id);
    }
    chat.say(`Bạn đã rời phòng chơi ${userRoom + 1}!`);
    chat.getUserProfile().then((user) => {
      roomChatAll(userRoom, joinID, `${user.first_name} đã rời phòng chơi ${userRoom + 1}!`);
    }).then(() => {
      gamef.setUserRoom(joinID, undefined);
    });
  } else {
    chat.say(`Bạn chưa tham gia phòng nào!`);
  }
});
// listen for ROOM CHAT and VOTE
bot.on('message', (payload, chat) => {
  const joinID = payload.sender.id;
  const chatTxt = payload.message.text;
  const userRoom = gamef.getUserRoom(joinID);

  if (userRoom == undefined) {
    chat.say({
      text: `Hãy chat 'help' hoặc 'trợ giúp' để được giúp đỡ!`,
      quickReplies: ['help', 'trợ giúp']
    });
    return;
  }

  if (gamef.getRoom(userRoom).alivePlayer[joinID]) { // nếu còn sống
    chat.getUserProfile().then((user) => {
      if (gamef.getRoom(userRoom).isNight) { // ban đêm
        let userRole = gamef.getRoom(userRoom).getRole(joinID);
        if (userRole == -1) {// là SÓI
          if (!chatTxt.match(/\/vote.[0-9]+/g)) {//chat
            if (gamef.getRoom(userRoom).chatON) {
              roomWolfChatAll(userRoom, joinID, user.first_name + ': ' + chatTxt);
            }
          } else {// SÓI VOTE
            let voteID = chatTxt.match(/[0-9]+/g)[0];
            const start = async () => {
              //vote
              if (gamef.getRoom(userRoom).vote(joinID, voteID)) {
                let voteKill = gamef.getRoom(userRoom).playersTxt[voteID];
                await chat.say(`Bạn đã vote cắn ${voteKill}`);
                roomWolfChatAll(userRoom, joinID, user.first_name + ' đã vote cắn ' + voteKill);
              } else {
                chat.say("Bạn không thể thực hiện vote 2 lần hoặc vote người chơi đã chết!");
              }
              // kiểm tra đã VOTE xong chưa?
              roleDoneCheck(userRoom);
            }
            start();
          }
        } else if (userRole == 1) { // là tiên tri
          if (chatTxt.match(/\/see.[0-9]+/g)) {//see
            const startTT = async () => {
              let voteID = chatTxt.match(/[0-9]+/g)[0];
              let role = gamef.getRoom(userRoom).getRoleByID(voteID);
              await chat.say(`${voteID} là ${role == -1 ? 'SÓI' : role == 1 ? 'TIÊN TRI, Bạn đùa tớ à :v' : 'DÂN'}`);
              gamef.getRoom(userRoom).newLog(`${user.first_name} soi (${gamef.getRoom(userRoom).playersTxt[voteID]}) là ${role == -1 ? 'SÓI' : role == 1 ? 'TỰ SOI MÌNH! GG' : 'DÂN'}`);
              gamef.getRoom(userRoom).roleDoneBy(joinID);
              // kiểm tra đã VOTE xong chưa?
              roleDoneCheck(userRoom);
            }
            startTT();
          } else {
            chat.say(`Bạn không thể trò chuyện trong đêm!`);
          }
        } else if (userRole == 2) { // là bảo vệ
          if (chatTxt.match(/\/save.[0-9]+/g)) {//save
            let voteID = chatTxt.match(/[0-9]+/g)[0];
            if (!gamef.getRoom(userRoom).save(joinID, voteID)) {
              chat.say(`Bạn không thể bảo vệ 1 người 2 đêm liên tiếp!`);
            } else {
              chat.say(`Bạn đã bảo vệ ${gamef.getRoom(userRoom).playersTxt[voteID]}!`);
              // kiểm tra đã VOTE xong chưa?
              roleDoneCheck(userRoom);
            }
          } else {
            chat.say(`Bạn không thể trò chuyện trong đêm!`);
          }
        } else if (userRole == 3) { // là thợ săn
          if (chatTxt.match(/\/fire.[0-9]+/g)) {//fire
            let voteID = chatTxt.match(/[0-9]+/g)[0];
            if (!gamef.getRoom(userRoom).fire(joinID, voteID)) {
              chat.say(`Bạn không thể ngắm bắn thành viên đã chết!`);
            } else {
              chat.say(`Bạn đã ngắm bắn ${gamef.getRoom(userRoom).playersTxt[voteID]}!`);
              // kiểm tra đã VOTE xong chưa?
              roleDoneCheck(userRoom);
            }
          } else {
            chat.say(`Bạn không thể trò chuyện trong đêm!`);
          }
        }
      } else {
        if (!gamef.getRoom(userRoom).isNight) {// ban NGÀY, mọi người thảo luận
          if (!chatTxt.match(/\/vote.[0-9]+/g)) {
            if (!chatTxt.match(/\/yes/g) && !chatTxt.match(/\/no/g)) {
              if (gamef.getRoom(userRoom).chatON || (gamef.getRoom(userRoom).deathID != -1 && gamef.getRoom(userRoom).deathID === gamef.getRoom(userRoom).getPlayer(joinID).id)) { //check xem còn bật chat không?
                roomChatAll(userRoom, joinID, user.first_name + ': ' + chatTxt);
              } else {
                chat.say(`Đã hết thời gian thảo luận!`);
              }
            } else {  //VOTE YES?NO
              if (gamef.getRoom(userRoom).deathID != -1) {
                if (chatTxt.match(/\/yes/g)) { //vote treo cổ
                  gamef.getRoom(userRoom).killOrSaveVote(joinID, true);
                  chat.say(`Bạn đã vote treo! (${gamef.getRoom(userRoom).saveOrKill})`);
                  roomChatAll(userRoom, joinID, `${user.first_name} đã vote treo! (${gamef.getRoom(userRoom).saveOrKill})`);
                  yesNoVoteCheck(userRoom);
                } else { //vote tha
                  gamef.getRoom(userRoom).killOrSaveVote(joinID, false);
                  chat.say(`Bạn đã vote tha! (${gamef.getRoom(userRoom).saveOrKill})`);
                  roomChatAll(userRoom, joinID, `${user.first_name} đã vote tha! (${gamef.getRoom(userRoom).saveOrKill})`);
                  yesNoVoteCheck(userRoom);
                }
              }
            }
          } else {
            // VOTE TREO CỔ
            let voteID = chatTxt.match(/[0-9]+/g)[0];
            const start = async () => {
              if (gamef.getRoom(userRoom).vote(joinID, voteID)) {
                let voteKill = gamef.getRoom(userRoom).playersTxt[voteID];
                await chat.say(`Bạn đã vote treo cổ ${voteKill} (${gamef.getRoom(userRoom).voteList[voteID]} phiếu)`);
                await roomChatAll(userRoom, joinID, `${user.first_name} đã vote treo cổ ${voteKill} (${gamef.getRoom(userRoom).voteList[voteID]} phiếu)`);
              } else {
                chat.say(`Bạn không thể vote 2 lần hoặc vote người chơi đã chết!`);
              }
              // kiểm tra đã VOTE XONG chưa?
              gamef.getRoom(userRoom).roleIsDone((isDone) => {
                if (isDone) {
                  const newStart = async () => {
                    gamef.getRoom(userRoom).findOutDeathID();
                    gamef.getRoom(userRoom).cancelSchedule();
                    let deathID = gamef.getRoom(userRoom).deathID;
                    if (deathID != -1) { // mời 1 người lên giá treo cổ
                      gamef.getRoom(userRoom).resetRoleDone();
                      let deathTxt = gamef.getRoom(userRoom).playersTxt[deathID];
                      await roomChatAll(userRoom, 0, `Mời ${deathTxt} lên giá treo cổ !!!\nBạn có 45 giây để trăn trối, 45s bắt đầu!`);
                      // 45 giây
                      let time = new Date(Date.now() + 45 * 1000);
                      gamef.getRoom(userRoom).addSchedule(time, () => {
                        roomChatAll(userRoom, 0, `Đã hết thời gian, mọi người vote nào!\nTREO CỔ hay CỨU?\n/yes hoặc /no`);
                        console.log(`$ ROOM ${userRoom + 1} > END OF TRĂN TRỐI :))`);
                      });
                    } else {
                      await roomChatAll(userRoom, 0, `Không ai bị treo cổ do có số vote bằng nhau! Mọi người đi ngủ`);
                      const start2 = async () => {
                        // Đêm tiếp theo
                        gamef.getRoom(userRoom).dayNightSwitch();
                        await roomChatAll(userRoom, 0, `Đêm thứ ${gamef.getRoom(userRoom).day}`);
                        gamef.getRoom(userRoom).newLog(`Đêm thứ ${gamef.getRoom(userRoom).day}`);
                        await roomRoleChat(userRoom);
                      };
                      start2();
                    }
                  }
                  newStart();
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
  console.log(`$ ROOM ${userRoom + 1} CHAT > ${joinID}: ${chatTxt}`);
});
// listen VIEW_PLAYER_IN_ROOM message
bot.on('postback:VIEW_PLAYER_IN_ROOM', (payload, chat) => {
  let joinID = payload.sender.id;
  let userRoom = gamef.getUserRoom(joinID);
  let playersInRoomTxt = gamef.getRoom(userRoom).playersTxt.join(' ; ');
  chat.say(`Danh sách người chơi trong phòng ${userRoom + 1}: \n${playersInRoomTxt}`);
});
// listen USER_RENAME message
bot.on('postback:USER_RENAME', (payload, chat) => {
  let joinID = payload.sender.id;
  let userRoom = gamef.getUserRoom(joinID);
  let user = gamef.getRoom(userRoom).getPlayer(joinID);

  const askName = (convo) => {
    convo.ask(`Tên hiện tại của bạn là: ${user.first_name}\n Để hủy đổi tên, chat: /cancelNhập tên bạn muốn đổi thành:`, (payload, convo) => {
      if (!(payload.message) || isNaN(parseInt(payload.message.text))) {
        convo.say(`Vui lòng nhập tên hợp lệ!`);
        convo.end();
        return;
      } else {
        const chatTxt = payload.message.text;
        if (!chatTxt.match(/\/cancel/g)) {
          user.setFirstName(chatTxt);
          convo.say(`Đã đổi tên thành công!`);
        } else {
          convo.say(`Bạn đã hủy không đổi tên!`)
          convo.end();
          return;
        }
      }
    });
  };
  chat.conversation((convo) => {
    askName(convo);
  });
});
// listen RESET ROOM message
bot.on('postback:RESET_ROOM', (payload, chat) => {
  let joinID = payload.sender.id;
  if (joinID == 2643770348982136) {
    gamef.resetAllRoom();
    chat.say('Đã tạo lại 5 phòng chơi!');
    console.log('$ ROOM > RESET_ALL');
  } else {
    chat.say('Bạn không có quyền thực hiện yêu cầu này!');
  }
});
// listen HELP button
bot.on('postback:HELP', (payload, chat) => {
  chat.getUserProfile().then((user) => {
    chat.say(`Xin chào ${user.first_name}! \n` +
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
});
// listen to HELP
bot.hear(['help', 'menu', 'hướng dẫn', 'trợ giúp'], (payload, chat) => {
  chat.getUserProfile().then((user) => {
    chat.say(`Xin chào ${user.first_name}! \n` +
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
})


// app.set('port', (8080 || process.env.PORT))
// app.use(bodyParser.urlencoded({ extended: false }))
// app.use(bodyParser.json())

// app.get('/', function (req, res) {
//   res.send("Server MA SÓI đang chạy...")
// })

// app.get('/webhook/', function (req, res) {
//   if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
//     return res.send(req.query['hub.challenge'])
//   }
//   res.send('wrong token')
// })

// app.listen(app.get('port'), function () {
//   console.log('Started on port', app.get('port'))
// })

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

bot.start(process.env.PORT || 3000);
