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
// const eventEmitter = new EventEmitter()
// var async = require("async");
// var Q = require("q");
const { Client } = require('pg');
const { Game, Room, Player } = require('./src/MainGame/Game.js');

//module import
const botSetup = require('./src/botSetup');
const menuTienIch = require('./src/Menu/TienIch');
const menuHelp = require('./src/Menu/Help');
const attachmentChat = require('./src/Chat/AttachmentChat');
const joinRoom = require('./src/Room/Join');
const readyRoom = require('./src/Room/Ready');
const leaveRoom = require('./src/Room/Leave');
const newRoom = require('./src/Room/New');
const chatAndVote = require('./src/Chat/Chat');
const adminCMD = require('./src/Menu/Admin');
const vote = require('./src/GameAction/Vote');
const train = require('./src/Menu/Training');
const adminDB = require('./src/DBModule/Admin');
const clan = require('./src/Menu/Clan');

const gamef = new Game();
const bot = new BootBot({
  accessToken: process.env.ACCESS_TOKEN,
  verifyToken: process.env.VERIFY_TOKEN,
  appSecret: process.env.APP_SECRET
})
const dbclient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: true,
});
// bot config
bot.setGreetingText("Chào mừng bạn đến với Phạm Ngọc Duy GAME bot, hãy bắt đầu trò chơi :3")
bot.setGetStartedButton((payload, chat) => {
  chat.say('🐺MA SÓI GAME').then(() => {
    chat.say({
      text: `Chào mừng bạn, để bắt đầu hãy chat 'trợ giúp' để được hướng dẫn cách sử dụng bot!'`,
      quickReplies: ['trợ giúp'],
    });
  })
});

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

// **** BOT MODULE ****
// setup GreetingText / GetStartedButton / PersistentMenu
bot.module(botSetup);
// help
bot.module(menuHelp);

bot.module(clan);

bot.module(train);
// handle menu > tiện ích khi chơi
gamef.module(menuTienIch, bot);
// handle admin
gamef.module(adminCMD, bot);
// handle attachment chat
gamef.module(attachmentChat, bot);
// join room
gamef.module(joinRoom, bot);
// ready room
gamef.module(readyRoom, bot);
// leave room
gamef.module(leaveRoom, bot);
// new room
gamef.module(newRoom, bot);
// chat and vote
gamef.module(chatAndVote, bot);
// evote
gamef.module(vote, bot);

//db admin
gamef.moduleWithDB(adminDB, bot, dbclient);

bot.start(process.env.PORT || 3000);
