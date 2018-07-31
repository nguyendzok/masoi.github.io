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

//module import
const botSetup = require('./src/botSetup');
const menuTienIch = require('./src/Menu/TienIch');
const menuHelp = require('./src/Menu/Help');
const attachmentChat = require('./src/Chat/AttachmentChat');
const joinRoom = require('./src/Room/Join');
const readyRoom = require('./src/Room/Ready');

const gamef = new Game();
const bot = new BootBot({
  accessToken: process.env.ACCESS_TOKEN,
  verifyToken: process.env.VERIFY_TOKEN,
  appSecret: process.env.APP_SECRET
})

// **** BOT MODULE ****
// setup GreetingText / GetStartedButton / PersistentMenu
bot.module(botSetup);
// help
bot.module(menuHelp);


// **** GAME MODULE ****
// handle menu > tiện ích khi chơi
gamef.module(menuTienIch, bot);
// handle attachment chat
gamef.module(attachmentChat, bot);
// join room
gamef.module(joinRoom, bot);
// ready room
gamef.module(readyRoom, bot);


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
      await bot.say(m, content);
    }
  })
}

async function yesNoVoteCheck(userRoom) {
  gamef.getRoom(userRoom).roleIsDone(async () => {
    gamef.getRoom(userRoom).cancelSchedule();
    let deathID = gamef.getRoom(userRoom).deathID;
    let deathTxt = gamef.getRoom(userRoom).playersTxt[deathID];
    if (gamef.getRoom(userRoom).saveOrKill < 0) {
      gamef.getRoom(userRoom).kill();
      roomChatAll(userRoom, 0, `👻Đã treo cổ ${deathTxt}! Mọi người đi ngủ`);
      gamef.getRoom(userRoom).newLog(`👻Mọi người đã treo cổ (${deathTxt})! với ${(gamef.getRoom(userRoom).aliveCount() + 1 + gamef.getRoom(userRoom).saveOrKill) / 2} tha/${(gamef.getRoom(userRoom).aliveCount() + 1 - gamef.getRoom(userRoom).saveOrKill) / 2} treo`);
    } else {
      roomChatAll(userRoom, 0, `😇Đã tha chết cho ${deathTxt}! Mọi người đi ngủ`);
      gamef.getRoom(userRoom).newLog(`😇Mọi người tha chết cho (${deathTxt}) với ${(gamef.getRoom(userRoom).aliveCount() + gamef.getRoom(userRoom).saveOrKill) / 2} tha/${(gamef.getRoom(userRoom).aliveCount() - gamef.getRoom(userRoom).saveOrKill) / 2} treo`);
    }
    gameIsNotEndCheck(userRoom, () => {
      // Đêm tiếp theo
      gamef.getRoom(userRoom).dayNightSwitch();
      roomChatAll(userRoom, 0, `🌛Đêm thứ ${gamef.getRoom(userRoom).day}🌛`);
      gamef.getRoom(userRoom).newLog(`🌛Đêm thứ ${gamef.getRoom(userRoom).day}🌛++++++++++`);
      roomRoleChat(userRoom);
    });
  })
}
async function dayNotify(userRoom, witchSaved) {
  let deathID = gamef.getRoom(userRoom).deathID;
  let deathTxt, deathRole;
  if (deathID != -1) {
    deathTxt = gamef.getRoom(userRoom).playersTxt[deathID];
    deathRole = gamef.roleTxt[gamef.getRoom(userRoom).getRoleByID(deathID)];
  }
  let dieCount = 0;

  roomChatAll(userRoom, 0, `🌞Trời sáng rồi mọi người dậy đi`);
  // SÓI CẮN
  if (!witchSaved && gamef.getRoom(userRoom).kill()) {
    dieCount++;
    roomChatAll(userRoom, 0, `🔪 *${deathTxt}* đã CHẾT!`);
    gamef.getRoom(userRoom).newLog(`🔪 *${deathTxt}* là ${deathRole} đã bị SÓI cắn!`);
    console.log(`$ ROOM ${userRoom + 1} > ${deathTxt} DIED!`);
    if (gamef.getRoom(userRoom).players[deathID].role === 3) { //người chết là thợ săn
      dieCount++;
      let fireID = gamef.getRoom(userRoom).fireID;
      let deathFireTxt = gamef.getRoom(userRoom).playersTxt[fireID];
      roomChatAll(userRoom, 0, `🔪 *${deathFireTxt}* đã CHẾT!`);
      gamef.getRoom(userRoom).newLog(`🔪Thợ săn chết đã ghim ${gamef.roleTxt[gamef.getRoom(userRoom).getRoleByID(fireID)]} *${deathFireTxt}*`);
      console.log(`$ ROOM ${userRoom + 1} > ${deathFireTxt} DIED!`);
    }
  }
  // PHÙ THỦY giết
  if (gamef.getRoom(userRoom).witchKillID != undefined) {
    let killID = gamef.getRoom(userRoom).witchKillID;
    let deathByMagicTxt = gamef.getRoom(userRoom).playersTxt[killID];
    gamef.getRoom(userRoom).witchKillAction(async (witchKillID) => {
      dieCount++;
      roomChatAll(userRoom, 0, `🔪 *${deathByMagicTxt}* đã CHẾT!`);
      gamef.getRoom(userRoom).newLog(`🔪Phù thủy đã phù phép chết ${gamef.roleTxt[gamef.getRoom(userRoom).getRoleByID(witchKillID)]} *${deathByMagicTxt}*`);
      console.log(`$ ROOM ${userRoom + 1} > ${witchKillID}: ${deathByMagicTxt} DIED by witch!`);
    });
  }
  //là BÁN SÓI
  if (deathID != -1 && gamef.getRoom(userRoom).players[deathID].role == 4) {
    let halfWolfjoinID = gamef.getRoom(userRoom).players[deathID].joinID;
    let halfWolfTxt = gamef.getRoom(userRoom).players[deathID].first_name;
    await bot.say(halfWolfjoinID, `\`\`\`\nBạn đã bị sói cắn!\nTừ giờ bạn là 🐺SÓI!\n\`\`\``);
    gamef.getRoom(userRoom).players[deathID].setRole(-1);
    gamef.getRoom(userRoom).newLog(`🐺BÁN SÓI *${halfWolfTxt}* bị cắn và trở thành 🐺SÓI`);
    console.log(`$ ROOM ${userRoom + 1} > HALF WOLF!`);
  }
  if (dieCount == 0) {
    console.log(`$ ROOM ${userRoom + 1} > NOBODY DIED!`);
    gamef.getRoom(userRoom).newLog(`${deathID != -1 ? `🔪 *${deathTxt}* bị cắn nhưng không chết!\n` : `🎊Sói không thống nhất được số vote!\n`}🎊Đêm hôm đấy không ai chết cả!`);
    roomChatAll(userRoom, 0, `🎊Đêm hôm qua không ai chết cả!`);
  }

  gameIsNotEndCheck(userRoom, () => {
    let playersInRoomTxt = gamef.getRoom(userRoom).playersTxt.join(' ; ');
    roomChatAll(userRoom, 0, `⏰Mọi người có 6 phút thảo luận!`);
    gamef.getRoom(userRoom).dayNightSwitch();

    let time = new Date(Date.now() + 5 * 60 * 1000);
    gamef.getRoom(userRoom).addSchedule(time, () => {
      roomChatAll(userRoom, 0, `⏰CÒN 1 PHÚT THẢO LUẬN\nCác bạn nên cân nhắc kĩ, tránh lan man, nhanh chóng tìm ra kẻ đáng nghi nhất!`);
      console.log(`$ ROOM ${userRoom + 1} > 1 MINUTE REMAINING`);
      let time = new Date(Date.now() + 1 * 60 * 1000);
      gamef.getRoom(userRoom).addSchedule(time, () => {
        roomChatAll(userRoom, 0, `⏰Đã hết thời gian, mọi người vote một người để treo cổ!\n/vote <id> để treo cổ 1 người\n${playersInRoomTxt}`);
        gamef.getRoom(userRoom).chatOFF();
        console.log(`$ ROOM ${userRoom + 1} > END OF DISCUSSION!`);
      });
    });
  });
}
function nightDoneCheck(userRoom) {
  gamef.getRoom(userRoom).roleIsDone((isDone) => {
    if (isDone) {
      gamef.getRoom(userRoom).findOutDeathID();
      let deathID = gamef.getRoom(userRoom).deathID;
      let deathTxt;
      if (deathID != -1) {
        deathTxt = gamef.getRoom(userRoom).playersTxt[deathID];
      }

      const askForSave = (convo) => {
        convo.ask({
          text: `🔪Đêm hôm qua: *${deathTxt}* đã CHẾT!\nBạn có muốn cứu không?\n/yes hay /no ?`,
          quickReplies: ['/yes', '/no'],
        }, (payload, convo) => {
          if (!payload.message || !(payload.message.text.match(/\/yes/g) || payload.message.text.match(/\/no/g))) {
            convo.say(`\`\`\`\nKhông hợp lệ!\nBạn đã không cứu!\n\`\`\``);
            convo.end();
            dayNotify(userRoom, false);
            return;
          } else {
            if (payload.message.text.match(/\/yes/g)) { //yes
              gamef.getRoom(userRoom).witchUseSave();
              convo.say(`🔮Bạn đã cứu *${deathTxt}* thành công!`);
              gamef.getRoom(userRoom).newLog(`🔮Phù thủy *${gamef.getRoom(userRoom).getPlayer(gamef.getRoom(userRoom).witchID).first_name}* đã cứu *${deathTxt}*!`);
              convo.end();
              dayNotify(userRoom, true);
            } else { // no
              convo.end();
              dayNotify(userRoom, false);
            }
          }
        });
      };

      //Call phù thủy
      if (deathID != -1 && gamef.getRoom(userRoom).players[deathID].role != 4 && gamef.getRoom(userRoom).witchID != undefined && gamef.getRoom(userRoom).witchSaveRemain) { //phù thủy còn quyền cứu, nạn nhân không phải bán sói
        bot.conversation(gamef.getRoom(userRoom).witchID, (convo) => {
          askForSave(convo);
        });
      } else {
        dayNotify(userRoom, false);
      }
    }
  });
}
function gameIsNotEndCheck(userRoom, callback) {
  gamef.getRoom(userRoom).gameIsEnd((winner) => {
    const winnerStart = async () => {
      if (winner === 0) {
        callback();
      } else {
        console.log(`$ ROOM ${userRoom + 1} > END GAME > ${winner === -1 ? '🐺SÓI' : '💩DÂN'} thắng!`);
        await roomChatAll(userRoom, 0, [`🏆Trò chơi đã kết thúc...\n${winner === -1 ? '🐺SÓI' : '💩DÂN'} thắng!`, `🎮Bạn có thể sẵn sàng để bắt đầu chơi lại, hoặc tiếp tục trò chuyện với các người chơi khác trong phòng!`]);
        gamef.getRoom(userRoom).newLog(`🏆Trò chơi đã kết thúc với: ${gamef.getRoom(userRoom).wolfsCount} SÓI/ ${gamef.getRoom(userRoom).villagersCount} DÂN!`)
        await roomChatAll(userRoom, 0, gamef.getRoom(userRoom).logs.join(`\n`));
        //subscriber
        console.log(`$ ROOM ${userRoom + 1} > SUBSCRIBE REMINDER FOR ${gamef.getRoom(userRoom).subscriberList.length} PLAYERS`);
        gamef.getRoom(userRoom).subscriberList.forEach((joinID) => {
          bot.say(joinID, `Trò chơi ở phòng ${userRoom + 1} đã kết thúc!\nHãy nhanh chóng tham gia phòng trước khi trò chơi bắt đầu lại!`);
          console.log(`>>> REMINDER: ${joinID}`);
        });
        gamef.getRoom(userRoom).resetRoom();
      }
    }
    winnerStart();
  });
}

function dayVoteEnd(userRoom) {
  const newStart = async () => {
    gamef.getRoom(userRoom).findOutDeathID();
    gamef.getRoom(userRoom).cancelSchedule();
    let deathID = gamef.getRoom(userRoom).deathID;
    if (deathID != -1 && gamef.getRoom(userRoom).alivePlayer[gamef.getRoom(userRoom).players[deathID].joinID]) { // mời 1 người lên giá treo cổ
      gamef.getRoom(userRoom).resetRoleDone();
      gamef.getRoom(userRoom).setMorning(false);
      let deathTxt = gamef.getRoom(userRoom).playersTxt[deathID];
      roomChatAll(userRoom, 0, `😈Mời ${deathTxt} lên giá treo cổ !!!\n⏰Bạn có 1 phút để trăn trối\n1 PHÚT bắt đầu!`);
      // 1 phút trăn trối
      let time = new Date(Date.now() + 1 * 60 * 1000);
      gamef.getRoom(userRoom).addSchedule(time, () => {
        roomChatAll(userRoom, 0, `⏰Đã hết thời gian, mọi người vote nào!\n👎TREO CỔ hay 👍CỨU?\n/yes hoặc /no`);
        console.log(`$ ROOM ${userRoom + 1} > END OF TRĂN TRỐI :))`);
      });
    } else {
      await roomChatAll(userRoom, 0, `😇Không ai bị treo cổ do có số vote bằng nhau hoặc người bị treo đã tự sát! Mọi người đi ngủ`);
      gamef.getRoom(userRoom).newLog(`😇Không ai bị treo cổ do có số vote bằng nhau hoặc người bị treo đã tự sát!`);
      gameIsNotEndCheck(userRoom, async () => {
        // Đêm tiếp theo
        gamef.getRoom(userRoom).dayNightSwitch();
        await roomChatAll(userRoom, 0, `🌛Đêm thứ ${gamef.getRoom(userRoom).day}🌛`);
        gamef.getRoom(userRoom).newLog(`🌛Đêm thứ ${gamef.getRoom(userRoom).day}🌛++++++++++`);
        await roomRoleChat(userRoom);
      });
    }
  }
  newStart();
}

// listen for ROOM CHAT and VOTE
bot.on('message', (payload, chat, data) => {
  if (data.captured) { return; }

  const joinID = payload.sender.id;
  const chatTxt = payload.message.text;
  const userRoom = gamef.getUserRoom(joinID);

  if (userRoom == undefined) {
    chat.say({
      text: `\`\`\`\nBạn chưa tham gia phòng chơi nào!\n\`\`\``,
      quickReplies: ['help', 'trợ giúp']
    });
    return;
  }
  let user = gamef.getRoom(userRoom).getPlayer(joinID);
  if (gamef.getRoom(userRoom).alivePlayer[joinID]) { // nếu còn sống

    if (gamef.getRoom(userRoom).isNight) { // ban đêm
      let userRole = gamef.getRoom(userRoom).getRole(joinID);
      if (userRole == -1) {// là SÓI
        if (!chatTxt.match(/\/vote.-?[0-9]+/g)) {//chat
          if (gamef.getRoom(userRoom).chatON) {
            roomWolfChatAll(userRoom, joinID, '*' + user.first_name + '*: ' + chatTxt);
          }
        } else {// SÓI VOTE
          let voteID = chatTxt.match(/-?[0-9]+/g)[0];
          const start = async () => {
            //vote
            if (gamef.getRoom(userRoom).vote(joinID, voteID)) {
              if (voteID == -1) { //ăn chay (phiếu trống)
                await chat.say(`🍴Bạn đã vote ăn chay!`);
                roomWolfChatAll(userRoom, joinID, '🍴' + user.first_name + ' đã vote ăn chay!');
              } else {
                let voteKill = gamef.getRoom(userRoom).playersTxt[voteID];
                await chat.say(`🍗Bạn đã vote cắn ${voteKill}`);
                roomWolfChatAll(userRoom, joinID, '🍗' + user.first_name + ' đã vote cắn ' + voteKill);
              }
            } else {
              chat.say("```\nBạn không thể thực hiện vote 2 lần hoặc vote người chơi đã chết!\n```");
            }
            // kiểm tra đã VOTE xong chưa?
            nightDoneCheck(userRoom);
          }
          start();
        }
      } else if (userRole == 1) { // là tiên tri
        if (chatTxt.match(/\/see.[0-9]+/g)) {//see
          const startTT = async () => {
            if (!gamef.getRoom(userRoom).roleDone[joinID]) { // chưa soi ai
              let voteID = chatTxt.match(/[0-9]+/g)[0];
              let role = gamef.getRoom(userRoom).getRoleByID(voteID);
              await chat.say(`${voteID} là ${role == -1 ? '🐺SÓI' : role == 1 ? '🔍TIÊN TRI, Bạn đùa tớ à :v' : '💩PHE DÂN'}`);
              gamef.getRoom(userRoom).newLog(`🔍${user.first_name} soi *${gamef.getRoom(userRoom).playersTxt[voteID]}* ra ${role == -1 ? '🐺SÓI' : role == 1 ? 'TỰ SOI MÌNH! GG' : '💩PHE DÂN'}`);
              gamef.getRoom(userRoom).roleDoneBy(joinID);
            } else {
              chat.say('```\nBạn không thể soi 2 lần!\n```');
            }
            // kiểm tra đã VOTE xong chưa?
            nightDoneCheck(userRoom);
          }
          startTT();
        } else {
          chat.say('```\nBạn không thể trò chuyện trong đêm!\n```');
        }
      } else if (userRole == 2) { // là bảo vệ
        if (chatTxt.match(/\/save.[0-9]+/g)) {//save
          let voteID = chatTxt.match(/[0-9]+/g)[0];
          if (!gamef.getRoom(userRoom).save(joinID, voteID)) {
            chat.say(`\`\`\`\nBạn không thể bảo vệ 1 người 2 đêm liên tiếp hoặc bảo vệ người chơi đã chết!\n\`\`\``);
          } else {
            chat.say(`🗿Bạn đã bảo vệ ${gamef.getRoom(userRoom).playersTxt[voteID]}!`);
            // kiểm tra đã VOTE xong chưa?
            nightDoneCheck(userRoom);
          }
        } else {
          chat.say('```\nBạn không thể trò chuyện trong đêm!\n```');
        }
      } else if (userRole == 3) { // là thợ săn
        if (chatTxt.match(/\/fire.-?[0-9]+/g)) {//fire
          let voteID = chatTxt.match(/-?[0-9]+/g)[0];
          if (!gamef.getRoom(userRoom).fire(joinID, voteID)) {
            chat.say(`\`\`\`\nBạn không thể ngắm bắn 1 người 2 đêm liên tiếp hoặc người chơi đã chết!\n\`\`\``);
          } else {
            if (voteID != -1) {
              chat.say(`🔫Bạn đã ngắm bắn ${gamef.getRoom(userRoom).playersTxt[voteID]}!`);
              gamef.getRoom(userRoom).newLog(`🔫Thợ săn đã ngắm bắn ${gamef.getRoom(userRoom).playersTxt[voteID]}!`);
            } else {
              chat.say(`🔫Bạn đã ngắm bắn lên trời!`);
              gamef.getRoom(userRoom).newLog(`🔫Thợ săn đã ngắm bắn lên trời!`)
            }

            // kiểm tra đã VOTE xong chưa?
            nightDoneCheck(userRoom);
          }
        } else {
          chat.say('```\nBạn không thể trò chuyện trong đêm!\n```');
        }
      } else if (userRole == 5) { // là phù thủy
        if (gamef.getRoom(userRoom).witchKillRemain) {
          if (chatTxt.match(/\/kill.[0-9]+/g)) {// giết
            let voteID = chatTxt.match(/[0-9]+/g)[0];
            if (!gamef.getRoom(userRoom).witchKillVote(voteID)) {
              chat.say(`\`\`\`\nBạn không thể giết người chơi đã chết!\n\`\`\``);
            } else {
              chat.say(`⛔Bạn đã giết ${gamef.getRoom(userRoom).playersTxt[voteID]}!`);
              gamef.getRoom(userRoom).roleDoneBy(joinID);
              gamef.getRoom(userRoom).newLog(`⛔Phù thủy ${gamef.getRoom(userRoom).getPlayer(gamef.getRoom(userRoom).witchID).first_name} đã giết ${gamef.getRoom(userRoom).playersTxt[voteID]}!`)
              // kiểm tra đã VOTE xong chưa?
              nightDoneCheck(userRoom);
            }
          } else if (chatTxt.match(/\/skip/g)) {
            chat.say('🎊Bạn đã không giết ai!');
            gamef.getRoom(userRoom).roleDoneBy(joinID);
            // kiểm tra đã VOTE xong chưa?
            nightDoneCheck(userRoom);
          } else {
            chat.say('```\nBạn không thể trò chuyện trong đêm!\n```');
          }
        } else {
          chat.say('```\nBạn không thể trò chuyện trong đêm!\n```');
        }
      }
    } else {
      if (!gamef.getRoom(userRoom).isNight) {// ban NGÀY, mọi người thảo luận
        if (!chatTxt.match(/\/vote.-?[0-9]+/g)) {
          if (!chatTxt.match(/\/yes/g) && !chatTxt.match(/\/no/g)) {
            if (gamef.getRoom(userRoom).chatON || (gamef.getRoom(userRoom).deathID != -1 && gamef.getRoom(userRoom).deathID === gamef.getRoom(userRoom).getPlayer(joinID).id)) { //check xem còn bật chat không?
              roomChatAll(userRoom, joinID, '*' + user.first_name + '*: ' + chatTxt);
            } else {
              chat.say('```\nBạn không thể trò chuyện\n```');
            }
          } else {  //VOTE YES?NO
            if (gamef.getRoom(userRoom).deathID != -1) {
              if (chatTxt.match(/\/yes/g)) { //vote treo cổ
                gamef.getRoom(userRoom).killOrSaveVote(joinID, true);
                chat.say(`👎Bạn đã vote treo! (${gamef.getRoom(userRoom).saveOrKill})`);
                roomChatAll(userRoom, joinID, `👎${user.first_name} đã vote treo! (${gamef.getRoom(userRoom).saveOrKill})`);
                yesNoVoteCheck(userRoom);
              } else { //vote tha
                gamef.getRoom(userRoom).killOrSaveVote(joinID, false);
                chat.say(`👍Bạn đã vote tha! (${gamef.getRoom(userRoom).saveOrKill})`);
                roomChatAll(userRoom, joinID, `👍${user.first_name} đã vote tha! (${gamef.getRoom(userRoom).saveOrKill})`);
                yesNoVoteCheck(userRoom);
              }
            }
          }
        } else {
          // VOTE TREO CỔ
          let voteID = chatTxt.match(/-?[0-9]+/g)[0];
          const start = async () => {
            if (gamef.getRoom(userRoom).vote(joinID, voteID)) {
              if (voteID == -1) {
                await chat.say(`Bạn đã từ chối bỏ phiếu!`);
                await roomChatAll(userRoom, joinID, `${user.first_name} đã từ chối bỏ phiếu (${gamef.getRoom(userRoom).voteList[voteID]} phiếu)`);
              } else {
                let voteKill = gamef.getRoom(userRoom).playersTxt[voteID];
                await chat.say(`😈Bạn đã vote treo cổ ${voteKill} (${gamef.getRoom(userRoom).voteList[voteID]} phiếu)`);
                await roomChatAll(userRoom, joinID, `😈${user.first_name} đã vote treo cổ ${voteKill} (${gamef.getRoom(userRoom).voteList[voteID]} phiếu)`);
              }
            } else {
              chat.say('```\nBạn không thể vote 2 lần hoặc vote người chơi đã chết!\n```');
            }
            // kiểm tra đã VOTE XONG chưa?
            gamef.getRoom(userRoom).roleIsDone((isDone) => {
              if (isDone) {
                dayVoteEnd(userRoom);
              }
            });
          }
          start();
        }
      }
    }
  } else {
    chat.say('```\nBạn đã chết! Xin giữ im lặng! \n```')
  }
  console.log(`$ ROOM ${userRoom + 1} CHAT > ${user.first_name}: ${chatTxt}`);
});

bot.start(process.env.PORT || 3000);
