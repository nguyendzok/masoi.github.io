var schedule = require('node-schedule');
class Player {
    constructor(p) {
        this.id = p.id;
        this.joinID = p.joinID;
        this.first_name = p.first_name;
        this.last_name = p.last_name;
        this.avatar = p.avatar;
        this.ready = false;
        this.role = 0; // -1: SÓI / 0: DÂN / 1: tiên tri / 2: bảo vệ
    }
    getReady() {
        this.ready = true;
    }
}
class Room {
    constructor(id) {
        //info
        this.id = id;
        this.players = [];
        this.wolfsID = [];
        this.wolfsTxt = [];
        this.villagersTxt = [];
        this.playersTxt = [];
        this.playersRole = [];
        this.timerSchedule = null;
        this.logs = ['...'];
        //status
        this.ingame = false;
        this.day = 0;
        this.isNight = false;
        this.chatON = true;
        this.wolfsCount = 0;
        this.villagersCount = 0;
        this.roleDone = [];
        this.voteList = [];
        this.alivePlayer = []; 
        this.deathID = -1; // -1 là không ai cả
        this.saveID = -1; // -1 là không ai cả
    }
    resetRoom(){
        this.wolfsID = [];
        this.wolfsTxt = [];
        this.villagersTxt = [];
        this.playersTxt = [];
        this.playersRole = [];
        this.timerSchedule = null;
        this.logs = ['...'];

        this.ingame = false;
        this.day = 0;
        this.isNight = false;
        this.chatON = true;
        this.wolfsCount = 0;
        this.villagersCount = 0;
        this.roleDone = [];
        this.voteList = [];
        this.alivePlayer = []; 
        this.deathID = -1; // -1 là không ai cả
        this.saveID = -1; // -1 là không ai cả
    }
    addPlayer(player) {
        this.players.push(player);
        this.playersTxt.push(player.id + ': ' + player.first_name);
        this.alivePlayer[player.joinID] = true;
    }
    deletePlayer(joinID) {
        this.getPlayer(joinID) = undefined;
    }
    addSchedule(time,callback){
        this.timerSchedule = schedule.scheduleJob(time, callback);
    }
    cancelSchedule(){
        this.timerSchedule.cancel();
    }
    newPlayerID() {
        return this.players.length > 0 ? (this.players[this.players.length - 1].id + 1) : 0;
    }
    setInGame() {
        this.ingame = true;
    }
    getPlayer(joinID) {
        return this.players.find((user) => {
            return user.joinID == joinID;
        });
    }
    getRole(joinID) {
        return this.playersRole[joinID];
    }
    getRoleByID(id) {
        return this.players[id].role;
    }
    roleDoneBy(joinID) {
        this.roleDone[joinID] = true;
        this.roleDoneCount++;
    }
    kill() {
        console.log(`$ ROOM ${this.id+1} > KILL ${this.deathID} > SAVE ${this.saveID} !!!`)
        if (this.deathID != -1 && (!this.isNight || (this.isNight && this.deathID != this.saveID))) {
            this.alivePlayer[this.players[this.deathID].joinID] = false;
            this.playersTxt[this.deathID] = '[CHẾT]' + this.playersTxt[this.deathID].substr(2, this.playersTxt[this.deathID].length-3);
            if (this.players[this.deathID].role===-1){
                this.wolfsCount--;
            } else {
                this.villagersCount--;
            }
            return true;
        } else {
            return false;
        }
    }
    save(joinID, voteID) {
        if (this.saveID != voteID && this.alivePlayer[this.players[voteID].joinID]) {
            this.saveID = voteID;
            this.roleDoneBy(joinID);
            return true;
        } else {
            return false;
        }
    }
    roleIsDone(callback) {
        console.log("$ ROOM " + (this.id + 1) + " > ROLE DONE: " + this.roleDoneCount + '/' + this.players.length);
        if (this.roleDoneCount == this.players.length) {
            let maxVote = -1;
            this.voteList.forEach((numberOfVote, id) => {
                if (numberOfVote > maxVote) {
                    maxVote = numberOfVote;
                    this.deathID = id;
                } else if (numberOfVote == maxVote) {
                    this.deathID = -1;
                }
            });
            callback(true);
            return true;
        } else {
            return false;
        }
    }
    gameIsEnd(callback){
        if (this.wolfsCount === this.villagersCount){
            //SÓI THẮNG
            callback(-1);
        } else if (this.wolfsCount === 0) {
            //DÂN THẮNG
            callback(1);
        } else {
            callback(0);
        }
    }
    dayNightSwitch() {
        console.log(`$ ROOM ${this.id+1} > DAY <=> NIGHT SWITCH`);
        if (!this.isNight) {
            this.day++;
        }
        this.isNight = !this.isNight;
        this.voteList = [];
        this.roleDone = [];
        this.roleDoneCount = 0;
        this.deathID = -1;
        this.saveID = -1;
        this.chatON = true;
    }
    vote(joinID, voteID) {
        if (!this.roleDone[joinID] && this.alivePlayer[this.players[voteID].joinID]) {
            if (this.voteList[voteID]) {
                this.voteList[voteID]++;
            } else {
                this.voteList[voteID] = 1;
            }
            this.roleDoneBy(joinID);
            return true;
        } else {
            return false;
        }
    }
    chatOFF(){
        this.chatON = false;
    }
}

class Game {
    constructor() {
        this.room = [];
        this.userRoom = [];
        this.roleTxt = [];
        this.MIN_PLAYER = 3;
        this.resetRoom();
        this.setRoleTxt(); //không cần lắm
    }
    setRoleTxt(){ //không cần lắm
        this.roleTxt[0] = 'DÂN';
        this.roleTxt[-1] = 'SÓI';
        this.roleTxt[1] = 'TIÊN TRI';
        this.roleTxt[2] = 'Bảo vệ';
    }
    getUserRoom(joinID) {
        return this.userRoom[joinID];
    }
    setUserRoom(joinID, roomID) {
        this.userRoom[joinID] = roomID;
    }
    resetAllRoom() {
        this.room = [];
        this.userRoom = [];
        for (let i = 0; i < 2; i++) {
            this.room.push(new Room(i));
        }
    }
    resetRoom(id){
        this.room[id].resetRoom();
    }
    getRoom(id) {
        return this.room[id];
    }
    searchUserInRoom(userID, roomID) {
        return this.room[roomID].players.find((user) => {
            return user.joinID == userID;
        });
    }
    // get view
    getRoomListView() {
        return ['1', '2'];
        // let roomListView = [];
        // this.room.forEach(r => {
        //     if (!r.ingame) {
        //         roomListView.push(r.id + 1);
        //     }
        // });
        // return roomListView;
    }
    getRoomPlayerView(roomID) {
        let playerListView = [];
        // create message
        this.room[roomID].players.forEach(m => {
            playerListView.push({
                title: "Người chơi " + m.last_name + " " + m.first_name,
                image_url: m.avatar,
                subtitle: m.ready ? 'Đã sẵn sàng' : 'Chưa sẵn sàng',
                // buttons: [
                //   { type: 'postback', title: m.ready ? 'Đã sẵn sàng' : 'Chưa sẵn sàng', payload: 'button' }
                // ]
            });
        });
        return playerListView;
    }
    gameIsReady(roomID, callback) {
        let gameReady = true;
        if (this.room[roomID].players.length >= this.MIN_PLAYER) {
            this.room[roomID].players.every(m => {
                if (!m.ready) {
                    gameReady = false;
                    return false;
                } else return true;
            });
            if (gameReady) {
                callback(true);
            }
        }
    }
    roleRandom(roomID) {
        this.room[roomID].players[0].role = -1; // SÓI
        this.room[roomID].players[1].role = 1; // TIÊN TRI
        this.room[roomID].players[2].role = 2; // BẢO VỆ
        if (this.room[roomID].players > 3){
            this.room[roomID].players[3].role = 0; // DÂN
        }
        if (this.room[roomID].players > 4){
            this.room[roomID].players[4].role = -1; // SÓI
        }

        this.room[roomID].players.forEach(p => {
            this.room[roomID].playersRole[p.joinID] = p.role;
            if (p.role === -1){
                this.room[roomID].wolfsID.push(p.joinID);
                this.room[roomID].wolfsTxt.push(p.id+': '+p.first_name);
                this.room[roomID].wolfsCount++;
            } else {
                this.room[roomID].villagersTxt.push(p.id+': '+p.first_name);
                this.room[roomID].villagersCount++;
            }
        });
    }
}

module.exports = {
    Game,
    Room,
    Player
};