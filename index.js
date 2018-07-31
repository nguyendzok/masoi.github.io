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
const { Game, Room, Player } = require('./src/Game.js');

//module import
const botSetup = require('./src/botSetup');
const menuTienIch = require('./src/Menu/TienIch');
const menuHelp = require('./src/Menu/Help');
const attachmentChat = require('./src/Chat/AttachmentChat');
const joinRoom = require('./src/Room/Join');
const readyRoom = require('./src/Room/Ready');
const leaveRoom = require('./src/Room/Leave');
const chatAndVote = require('./src/Chat/Chat');
const adminCMD = require('./src/Menu/Admin');

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
// chat and vote
gamef.module(chatAndVote, bot);





bot.start(process.env.PORT || 3000);
