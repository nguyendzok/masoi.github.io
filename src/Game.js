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
    setFirstName(newFirstName) {
        this.first_name = newFirstName;
    }
    setRole(role) {
        this.role = role;
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
        this.logs = ['Tóm tắt game: *************************'];
        //status
        this.readyCount = 0;
        this.ingame = false;
        this.day = 0;
        this.isNight = false;
        this.isMorning = true;
        this.chatON = true;
        this.wolfsCount = 0;
        this.villagersCount = 0;
        this.roleDone = [];
        this.voteList = [];
        this.alivePlayer = [];
        this.deathID = -1; // -1 là không ai cả
        this.saveID = -1; // -1 là không ai cả
        this.fireID = -1;
        this.saveOrKill = 0; // nếu vote cứu thì +1, vote treo cổ thì -1.  nhỏ hơn 0 thì treo
    }
    resetRoom() {
        this.wolfsID = [];
        this.wolfsTxt = [];
        this.villagersTxt = [];
        this.playersTxt = [];
        this.playersRole = [];
        this.timerSchedule = null;
        this.logs = ['Tóm tắt game: ************************'];

        this.readyCount = 0;
        this.ingame = false;
        this.day = 0;
        this.isNight = false;
        this.isMorning = true;
        this.chatON = true;
        this.wolfsCount = 0;
        this.villagersCount = 0;
        this.roleDone = [];
        this.voteList = [];
        this.deathID = -1; // -1 là không ai cả
        this.saveID = -1; // -1 là không ai cả
        this.fireID = -1;
        this.saveOrKill = 0; // nếu vote cứu thì +1, vote treo cổ thì -1.  nhỏ hơn 0 thì treo

        this.players.forEach((p, index, arr) => {
            arr[index].ready = false;
            arr[index].role = 0; // -1: SÓI / 0: DÂN / 1: tiên tri / 2: bảo vệ
            this.playersTxt.push(`${p.id}: ${p.first_name}`);
            this.alivePlayer[p.joinID] = true;
        });
    }
    addPlayer(player) {
        this.players.push(player);
        this.alivePlayer[player.joinID] = true;
    }
    deletePlayer(joinID) {
        let player = this.getPlayer(joinID);
        let playerID = player.id;
        let len = this.players.length;
        if (player.ready) {
            this.readyCount--;
        }
        this.players.splice(playerID, 1);
        for (let i = playerID; i < len - 1; i++) {
            this.players[i].id--;
        }
    }
    deletePlayerByID(id) {
        let playerID = id;
        let len = this.players.length;
        if (this.players[id].ready) {
            this.readyCount--;
        }
        this.players.splice(playerID, 1);
        for (let i = playerID; i < len - 1; i++) {
            this.players[i].id--;
        }
    }
    addSchedule(time, callback) {
        this.timerSchedule = schedule.scheduleJob(time, callback);
    }
    cancelSchedule() {
        if (this.timerSchedule) {
            this.timerSchedule.cancel();
        }
    }
    newPlayerID() {
        return this.players.length > 0 ? (this.players[this.players.length - 1].id + 1) : 0;
    }
    setRole(role, num) {
        let rand = 0, count = num;
        while (count > 0) {
            do {
                rand = Math.floor((Math.random() * this.players.length));
            } while (this.players[rand].role != 0)
            this.players[rand].role = role;
            count--;
        }
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
    oneReady() {
        this.readyCount++;
    }
    killOrSaveVote(joinID, voteKill) {
        if (this.roleDone[joinID]) {
            return false;
        } else {
            if (voteKill) {
                this.saveOrKill--;
            } else {
                this.saveOrKill++;
            }
            this.roleDoneBy(joinID);
            return true;
        }
    }
    killAction(deathID) {
        this.alivePlayer[this.players[deathID].joinID] = false;
        this.playersTxt[deathID] = '💀CHẾT:' + this.playersTxt[deathID].substr(2, this.playersTxt[deathID].length - 2) + '💀';
        if (this.players[deathID].role === -1) {
            this.wolfsCount--;
        } else {
            this.villagersCount--;
        }
    }
    kill() {
        console.log(`$ ROOM ${this.id + 1} > KILL ${this.deathID} > SAVE ${this.saveID} !!!`);
        if (this.deathID != -1 && (!this.isNight || (this.isNight && this.deathID != this.saveID)) && this.players[this.deathID]) {
            if (this.players[this.deathID].role === 4 && this.isNight) { //là BÁN SÓI
                this.wolfsCount++;
                this.villagersCount--;
                return false;
            } else {
                this.killAction(this.deathID);
                if (this.players[this.deathID].role === 3) { //là thợ săn
                    this.killAction(this.fireID);
                }
                return true;
            }
        } else {
            return false;
        }
    }
    save(joinID, voteID) {
        if (!this.roleDone[joinID] && this.saveID != voteID && this.players[voteID] && this.alivePlayer[this.players[voteID].joinID]) {
            this.logs.push(`${this.getPlayer(joinID).first_name} bảo vệ: (${this.playersTxt[voteID]})`);
            this.saveID = voteID;
            this.roleDoneBy(joinID);
            return true;
        } else {
            return false;
        }
    }
    fire(joinID, voteID) {
        if (!this.roleDone[joinID] && this.players[voteID] && this.alivePlayer[this.players[voteID].joinID]) {
            this.logs.push(`${this.getPlayer(joinID).first_name} ngắm bắn: (${this.playersTxt[voteID]})`);
            this.fireID = voteID;
            this.roleDoneBy(joinID);
            return true;
        } else {
            return false;
        }
    }
    newLog(log) {
        this.logs.push(log);
    }
    findOutDeathID() {
        let maxVote = -1;
        this.voteList.forEach((numberOfVote, id) => {
            if (numberOfVote > maxVote) {
                maxVote = numberOfVote;
                this.deathID = id;
            } else if (numberOfVote == maxVote) {
                this.deathID = -1;
            }
        });
    }
    roleIsDone(callback) {
        console.log("$ ROOM " + (this.id + 1) + " > ROLE DONE: " + this.roleDoneCount + '/' + (this.wolfsCount + this.villagersCount));
        if (this.roleDoneCount == (this.wolfsCount + this.villagersCount)) {
            callback(true);
        }
    }
    resetRoleDone() {
        this.roleDone = [];
        this.roleDoneCount = 0;
    }
    gameIsEnd(callback) {
        console.log("$ ROOM " + (this.id + 1) + " > GAME CHECK: " + this.wolfsCount + ' SÓI/' + this.villagersCount + ' DÂN');
        if (this.wolfsCount >= this.villagersCount) {
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
        console.log(`$ ROOM ${this.id + 1} > DAY <=> NIGHT SWITCH`);
        if (!this.isNight) {
            this.day++;
        } else {
            this.isMorning = true;
        }
        this.isNight = !this.isNight;
        this.voteList = [];
        this.roleDone = [];
        this.roleDoneCount = 0;
        this.deathID = -1;
        this.fireID = -1;
        // this.saveID = -1;
        this.chatON = true;
    }
    setMorning(isMorning) {
        this.isMorning = isMorning;
    }
    vote(joinID, voteID) {
        if (voteID == -1) {
            this.roleDoneBy(joinID);
            return true;
        }
        if (!this.roleDone[joinID] && this.players[voteID] && this.alivePlayer[this.players[voteID].joinID]) {
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
    chatOFF() {
        this.chatON = false;
    }
    aliveCount() {
        return this.villagersCount + this.wolfsCount;
    }
}

class Game {
    constructor() {
        this.room = [];
        this.userRoom = [];
        this.roleTxt = [];
        this.MIN_PLAYER = 3;
        this.resetAllRoom();
        this.setRoleTxt(); //không cần lắm
    }
    setRoleTxt() { //không cần lắm
        this.roleTxt[0] = '💩DÂN';
        this.roleTxt[-1] = '🐺SÓI';
        this.roleTxt[1] = '🔍TIÊN TRI';
        this.roleTxt[2] = '🗿BẢO VỆ';
        this.roleTxt[3] = '🔫THỢ SĂN';
        this.roleTxt[4] = '🐺BÁN SÓI';
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
            playerListView.unshift({
                title: "Người chơi " + (m.id + 1) + ": " + m.last_name + " " + m.first_name,
                image_url: m.avatar,
                subtitle: `ID người chơi: ${m.id}\n${m.ready ? 'Đã sẵn sàng' : 'Chưa sẵn sàng'}`,
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
        console.log(`$ ROOM ${roomID + 1} > RANDOM ROLE FOR ${this.room[roomID].players.length} PLAYERS`);
        let len = this.room[roomID].players.length;
        let roleListTxt = "Đang tạo game với: 1 TIÊN TRI, 1 BẢO VỆ";
        this.room[roomID].setRole(1, 1); // 1 TIÊN TRI
        this.room[roomID].setRole(2, 1); // 1 BẢO VỆ
        if (len < 6) { // 3,4,5
            this.room[roomID].setRole(-1, 1);  // 1 SÓI
            roleListTxt += ", 1 SÓI, " + (len - 3) + " DÂN";
        } else if (len < 10) { // 6,7,8,9
            this.room[roomID].setRole(-1, 2);  // 2 SÓI
            this.room[roomID].setRole(3, 1);  // 1 THỢ SĂN
            this.room[roomID].setRole(4, 1); // 1 BÁN SÓI
            roleListTxt += ", 2 SÓI, 1 THỢ SĂN, 1 BÁN SÓI" + (len - 6) + " DÂN";
        } else if (len < 12) { // 10,11
            this.room[roomID].setRole(-1, 3);  // 3 SÓI
            this.room[roomID].setRole(3, 1);  // 1 THỢ SĂN
            this.room[roomID].setRole(4, 1); // 1 BÁN SÓI
            roleListTxt += ", 3 SÓI, 1 THỢ SĂN, " + (len - 7) + " DÂN";
        } else if (len < 14) {
            this.room[roomID].setRole(-1, 3);  // 3 SÓI
            this.room[roomID].setRole(3, 1);  // 1 THỢ SĂN
            this.room[roomID].setRole(4, 1); // 1 BÁN SÓI
            roleListTxt += ", 3 SÓI, 1 THỢ SĂN, " + (len - 7) + " DÂN";
            // this.room[roomID].setRole(4,1);  // 1 CUPID - ghép đôi
        }
        this.room[roomID].playersTxt = [];
        this.room[roomID].players.forEach(p => {
            this.room[roomID].playersRole[p.joinID] = p.role;
            this.room[roomID].playersTxt.push(p.id + ': ' + p.first_name); .0

            if (p.role === -1) {
                this.room[roomID].wolfsID.push(p.joinID);
                this.room[roomID].wolfsTxt.push(p.id + ': ' + p.first_name);
                this.room[roomID].wolfsCount++;
            } else {
                this.room[roomID].villagersTxt.push(p.id + ': ' + p.first_name);
                this.room[roomID].villagersCount++;
            }
        });
        return roleListTxt;
    }
}

module.exports = {
    Game,
    Room,
    Player
};