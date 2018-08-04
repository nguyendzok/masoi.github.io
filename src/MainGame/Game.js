var schedule = require('node-schedule');
class Player {
    constructor(p) {
        this.id = p.id;
        this.joinID = p.joinID;
        this.first_name = p.first_name;
        this.last_name = p.last_name;
        this.avatar = p.avatar;
        this.ready = false;
        this.role = 4; // -1: SÓI / 4: DÂN / 1: tiên tri / 2: bảo vệ
        this.timerSchedule = null; // đếm giờ
        this.afkCount = 0;
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
    addSchedule(time, callback) {
        this.timerSchedule = schedule.scheduleJob(time, callback);
    }
    cancelSchedule() {
        if (this.timerSchedule) {
            this.timerSchedule.cancel();
        }
    }
    afk() {
        this.afkCount++;
    }
    backToGame(){
        if (this.afkCount > 0) {
            this.afkCount--;
        }
    }
}
class Room {
    constructor(id) {
        //info
        this.id = id;
        this.players = [];
        this.wolfsID = [];
        this.cupidsID = [];

        this.wolfsTxt = [];
        this.cupidsTxt = [];
        this.villagersTxt = [];
        this.playersTxt = [];
        this.playersRole = [];
        this.timerSchedule = null;
        this.logs = ['Tóm tắt game:\n*************************'];
        //status
        this.cupidTeam = false;
        this.readyCount = 0;
        this.ingame = false;
        this.day = 0;
        this.isNight = false;
        this.isMorning = true;
        this.chatON = true;
        this.wolfsCount = 0;
        this.villagersCount = 0;
        this.roleDoneCount = 0;
        this.roleDone = [];
        this.voteList = [];
        this.alivePlayer = [];

        // phù thủy
        this.witchID = undefined;
        this.witchSaveRemain = true;
        this.witchKillRemain = true;
        this.witchKillID = undefined;

        //Già làng
        this.oldManID = undefined;
        this.oldManLive = 2;

        // người chết và 
        this.deathID = -1; // sói cắn ai?
        this.saveID = -1; // bảo vệ ai?
        this.fireID = -1; // ghim ai?
        this.saveOrKill = 0; // nếu vote cứu thì +1, vote treo cổ thì -1.  nhỏ hơn 0 thì treo

        // danh sách subscriber
        this.subscriberList = [];
    }
    resetRoom() {
        this.wolfsID = [];
        this.cupidsID = [];

        this.wolfsTxt = [];
        this.cupidsTxt = [];
        this.villagersTxt = [];
        this.playersTxt = [];
        this.playersRole = [];
        this.timerSchedule = null;
        this.logs = ['Tóm tắt game:\n************************'];

        this.cupidTeam = false;
        this.readyCount = 0;
        this.ingame = false;
        this.day = 0;
        this.isNight = false;
        this.isMorning = true;
        this.chatON = true;
        this.wolfsCount = 0;
        this.villagersCount = 0;
        this.roleDoneCount = 0;
        this.roleDone = [];
        this.voteList = [];

        this.witchID = undefined;
        this.witchSaveRemain = true;
        this.witchKillRemain = true;
        this.witchKillID = undefined;

        this.oldManID = undefined;
        this.oldManLive = 2;

        this.deathID = -1;
        this.saveID = -1;
        this.fireID = -1;
        this.saveOrKill = 0; // nếu vote cứu thì +1, vote treo cổ thì -1.  nhỏ hơn 0 thì treo

        this.players.forEach((p, index, arr) => {
            arr[index].ready = false;
            arr[index].role = 4; //DÂN
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
        this.getPlayer(joinID).cancelSchedule();
    }
    oneReady() {
        this.readyCount++;
    }
    killOrSaveVote(joinID, voteKill) {
        if (!this.roleDone[joinID]) {
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
        if (this.roleDone[this.players[deathID].joinID]) { //người tự sát đã thực hiện ROLE
            this.roleDoneCount--;
        }
        if (this.players[deathID].role == 5) { //người chết là phù thủy
            this.witchID = undefined;
            this.witchKillRemain = false;
            this.witchSaveRemain = false;
        }
        if (this.alivePlayer[this.players[deathID].joinID]) {
            this.alivePlayer[this.players[deathID].joinID] = false;
            this.playersTxt[deathID] = '💀CHẾT:' + this.playersTxt[deathID].substr(2, this.playersTxt[deathID].length - 2) + '💀';
            if (this.players[deathID].role === -1) {
                this.wolfsCount--;
            } else {
                this.villagersCount--;
            }
        }
    }
    kill() {
        console.log(`$ ROOM ${this.id + 1} > KILL ${this.deathID} > SAVE ${this.saveID} !!!`);
        if (this.deathID != -1 && (!this.isNight || (this.isNight && this.deathID != this.saveID)) && this.players[this.deathID]) {
            if (this.players[this.deathID].role === -2 && this.isNight) { //là BÁN SÓI
                this.wolfsCount++;
                this.villagersCount--;
                return false;
            }
            if (this.players[this.deathID].role === 6) { //là Già làng
                if (this.isNight) {
                    this.oldManLive--;
                    if (this.oldManLive > 0) { // còn 1 mạng
                        return false;
                    }
                } else {
                    this.oldManLive = 0;
                }
            }
            this.killAction(this.deathID);
            if (this.players[this.deathID].role === 3) { //là thợ săn
                this.killAction(this.fireID);
            }
            if (this.cupidsID.indexOf(this.players[this.deathID].joinID) != -1) { //là 1 người trong cặp đôi
                this.cupidsID.forEach((joinID) => {
                    this.killAction(this.getPlayer(joinID).id);
                });
                this.cupidTeam = false;
            }
            return true;
        } else { // bảo vệ thành công hoặc sói không cắn ai
            return false;
        }
    }
    witchKillVote(killID) {
        if (killID != -1 && this.players[killID]) {
            this.witchKillRemain = false;
            this.witchKillID = killID;
            this.getPlayer(joinID).backToGame();
            return true;
        } else {
            return false;
        }
    }
    witchKillAction(callback) {
        if (this.witchKillID != undefined && this.players[this.witchKillID]) {
            this.killAction(this.witchKillID);
            let killID = this.witchKillID;
            this.witchKillID = undefined;
            callback(killID);
            return true;
        } else {
            return false;
        }
    }
    save(joinID, voteID) {
        if (!this.roleDone[joinID] && this.saveID != voteID && this.players[voteID] && this.alivePlayer[this.players[voteID].joinID]) {
            if (this.oldManID != undefined && this.oldManLive <= 0) { // có GIÀ LÀNG đã chết
                this.logs.push(`🗿 *${this.getPlayer(joinID).first_name}* không thể bảo vệ *${this.playersTxt[voteID]}*`);
                this.saveID = -1;
            } else {
                this.logs.push(`🗿 *${this.getPlayer(joinID).first_name}* bảo vệ *${this.playersTxt[voteID]}*`);
                this.saveID = voteID;
            }
            this.roleDoneBy(joinID);
            this.getPlayer(joinID).backToGame();
            return true;
        } else {
            return false;
        }
    }
    fire(joinID, voteID) {
        if (voteID == -1 && !this.roleDone[joinID]) { //bắn lên trời
            this.roleDoneBy(joinID);
            this.getPlayer(joinID).backToGame();
            return true;
        }
        if (!this.roleDone[joinID] && this.fireID != voteID && this.players[voteID] && this.alivePlayer[this.players[voteID].joinID]) {
            this.fireID = voteID;
            this.roleDoneBy(joinID);
            return true;
        } else {
            return false;
        }
    }
    see(joinID, voteID, trueCallback, falseCallback) {
        if (!this.roleDone[joinID] && this.players[voteID] && this.alivePlayer[this.players[voteID].joinID]) {
            this.roleDoneBy(joinID);
            this.getPlayer(joinID).backToGame();
            if (this.oldManID != undefined && this.oldManLive <= 0) { // có GIÀ LÀNG đã chết
                trueCallback(4); // già làng chết: soi ra DÂN
            } else {
                trueCallback(this.getRoleByID(voteID));
            }
            return true;
        } else {
            falseCallback(false);
            return false;
        }
    }
    cupid(joinID, voteID1, voteID2) {
        if (!this.roleDone[joinID] && this.players[voteID1] && this.players[voteID2]) {
            this.roleDoneBy(joinID);
            this.getPlayer(joinID).setRole(4); // thần tình yêu về làm DÂN
            this.cupidsID = [this.players[voteID1].joinID, this.players[voteID2].joinID];
            this.cupidsTxt = [voteID1 + ': ' + this.players[voteID1].first_name, voteID2 + ': ' + this.players[voteID2].first_name];
            if (this.players[voteID1].role * this.players[voteID2].role < 0) { //phe thứ 3
                this.cupidTeam = true;
            }
            console.log(`cupid: ${this.players[voteID1].role} * ${this.players[voteID2].role} < 0 ???`)
            return true;
        } else {
            return false;
        }
    }
    autoRole(joinID, role) {
        if (this.isNight) {
            if (role == -1) { // SÓI
                this.vote(joinID, -1);
                this.getPlayer(joinID).afk();
            } else if (role == 2) { // bảo vệ
                this.saveID = -1;
            } else if (role == 3) { // thợ săn
                this.fireID = -1;
            } else if (role == 7) { // CUPID
                this.getPlayer(joinID).setRole(4);
            }
        } else {
            this.vote(joinID, -1);
            this.getPlayer(joinID).afk();
        }
        this.roleDoneBy(joinID);
        this.getPlayer(joinID).afk();
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
            console.log("$ ROOM " + (this.id + 1) + " > ROLE OK");
            callback(true);
        }
    }
    resetRoleDone() {
        this.roleDone = [];
        this.roleDoneCount = 0;
    }
    gameIsEnd(callback) {
        console.log("$ ROOM " + (this.id + 1) + " > GAME CHECK: " + this.wolfsCount + ' SÓI/' + this.villagersCount + ' DÂN');
        if (this.cupidTeam && this.wolfsCount + this.villagersCount == 2) {
            callback(3);
        } else if (this.wolfsCount >= this.villagersCount) {
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
        if (!this.isNight) { // DAY => NIGHT
            this.day++;
        } else { // NIGHT => DAY
            this.isMorning = true;
        }
        this.isNight = !this.isNight;
        this.voteList = [];
        this.resetRoleDone();
        this.deathID = -1;
        this.saveOrKill = 0;
        this.chatON = true;
    }
    afternoonSwitch() {
        this.isMorning = false;
        this.resetRoleDone();
    }
    vote(joinID, voteID) {
        if (!this.isMorning) {
            return false;
        }
        if (voteID == -1) {
            this.roleDoneBy(joinID);
            this.getPlayer(joinID).backToGame();
            return true;
        }
        if (!this.roleDone[joinID] && this.players[voteID] && this.alivePlayer[this.players[voteID].joinID]) {
            if (this.voteList[voteID]) {
                this.voteList[voteID]++;
            } else {
                this.voteList[voteID] = 1;
            }
            this.roleDoneBy(joinID);
            this.getPlayer(joinID).backToGame();
            return true;
        } else {
            return false;
        }
    }
    witchUseSave() {
        this.witchSaveRemain = false;
        this.getPlayer(joinID).backToGame();
    }
    chatOFF() {
        this.chatON = false;
    }
    aliveCount() {
        return this.villagersCount + this.wolfsCount;
    }
    subscribe(joinID) {
        if (this.subscriberList.indexOf(joinID) == -1) {
            this.subscriberList.push(joinID);
        }
        console.log(`$ ROOM ${this.id + 1} > SUBSCRIBER ${this.subscriberList.length} > ${joinID}`);
    }
}

class Game {
    constructor() {
        this.room = [];
        this.userRoom = [];
        this.roleTxt = [];
        this.MIN_PLAYER = 4;
        this.resetAllRoom();
        this.setRoleTxt();
    }
    setRoleTxt() {
        // PHE SÓI
        this.roleTxt[-1] = '🐺SÓI';
        this.roleTxt[-2] = '🐺BÁN SÓI';

        // PHE DÂN
        this.roleTxt[1] = '🔍TIÊN TRI';
        this.roleTxt[2] = '🗿BẢO VỆ';
        this.roleTxt[3] = '🔫THỢ SĂN';
        this.roleTxt[4] = '💩DÂN';
        this.roleTxt[5] = '🔮PHÙ THỦY';
        this.roleTxt[6] = '👴GIÀ LÀNG';
        this.roleTxt[7] = '👼THẦN TÌNH YÊU';
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
        for (let i = 0; i < 5; i++) {
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
        let roomListView = [];
        this.room.forEach(r => {
            if (!r.ingame) {
                roomListView.push((r.id + 1).toString());
            } else { // đang chơi
                roomListView.push('🎮' + (r.id + 1).toString());
            }
        });
        return roomListView;
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
    trueFalseRandom() {
        return Math.random() >= 0.5;
    }
    roleRandom(roomID) {
        this.room[roomID].subscriberList = []; //danh sách người chơi đợi để tham gia phòng

        console.log(`$ ROOM ${roomID + 1} > RANDOM ROLE FOR ${this.room[roomID].players.length} PLAYERS`);
        let len = this.room[roomID].players.length;
        let roleListTxt = "🎲1 TIÊN TRI, 1 BẢO VỆ";
        this.setRole(roomID, 1, 1); // 1 TIÊN TRI +7
        this.setRole(roomID, 2, 1); // 1 BẢO VỆ +3
        if (len < 6) { // 4,5
            let villagersRemain = (len - 3), balance = 7 + 3 - 6 + (len - 3);
            roleListTxt += `, 1 SÓI`;
            this.setRole(roomID, -1, 1);  // 1 SÓI -6
            if (this.trueFalseRandom()) {
                this.setRole(roomID, 6, 1); // 1 GIÀ LÀNG +0
                roleListTxt += `, 1 GIÀ LÀNG`;
                villagersRemain--; balance--;
            }
            roleListTxt += `, ${villagersRemain} DÂN (CÂN BẰNG: ${balance})`;
        } else if (len < 8) { // 6,7
            let villagersRemain = (len - 2), balance = 7 + 3;
            if (this.trueFalseRandom()) {
                roleListTxt += ", 2 SÓI, 1 PHÙ THỦY";
                this.setRole(roomID, -1, 2);  // 2 SÓI -6*2
                this.setRole(roomID, 5, 1); // 1 PHÙ THỦY +4
                villagersRemain -= 2;
                balance += -6 * 2 + 4 + villagersRemain;
            } else {
                roleListTxt += ", 1 SÓI, 1 BÁN SÓI";
                this.setRole(roomID, -1, 1);  // 1 SÓI -6
                this.setRole(roomID, -2, 1); // 1 BÁN SÓI -3
                villagersRemain -= 2;
                balance += -6 - 3 + villagersRemain;
            }
            roleListTxt += villagersRemain + ` DÂN (CÂN BẰNG: ${balance})`;
        } else if (len < 10) { // 8,9
            let villagersRemain = (len - 7), balance = 7 + 3 - 6 * 2 + 3 - 3 + 4 + (len - 7);
            this.setRole(roomID, -1, 2);  // 2 SÓI -6*2
            this.setRole(roomID, 3, 1);  // 1 THỢ SĂN +3
            this.setRole(roomID, -2, 1); // 1 BÁN SÓI -3
            this.setRole(roomID, 5, 1); // 1 PHÙ THỦY +4
            roleListTxt += ", 2 SÓI, 1 THỢ SĂN, 1 BÁN SÓI, 1 PHÙ THỦY";
            if (this.trueFalseRandom()) {
                this.setRole(roomID, 7, 1); // THẦN TÌNH YÊU -3
                roleListTxt += `, 1 THẦN TÌNH YÊU`;
                villagersRemain--; balance += -1 - 3;
            }
            roleListTxt += `, ${villagersRemain} DÂN (CÂN BẰNG: ${balance})`;
        } else if (len < 12) { // 10,11
            this.setRole(roomID, -1, 3);  // 3 SÓI -6*3
            this.setRole(roomID, 3, 1);  // 1 THỢ SĂN +3
            this.setRole(roomID, 5, 1); // 1 PHÙ THỦY +4
            this.setRole(roomID, 6, 1); // 1 GIÀ LÀNG +0
            this.setRole(roomID, 7, 1); // THẦN TÌNH YÊU -3
            roleListTxt += ", 3 SÓI, 1 THỢ SĂN, 1 PHÙ THỦY, 1 GIÀ LÀNG, 1 THẦN TÌNH YÊU, " + (len - 9) + ` DÂN (CÂN BẰNG: ${7 + 3 - 6 * 3 + 3 + 4 + (len - 9) - 3})`;
        } else { //12,13,14,15
            this.setRole(roomID, -1, 3);  // 2 SÓI - 6*2
            this.setRole(roomID, 3, 1);  // 1 THỢ SĂN +3
            this.setRole(roomID, -2, 1); // 2 BÁN SÓI -3*2
            this.setRole(roomID, 5, 1); // 1 PHÙ THỦY +4
            this.setRole(roomID, 6, 1); // 1 GIÀ LÀNG +0
            this.setRole(roomID, 7, 1); // THẦN TÌNH YÊU -3
            roleListTxt += ", 2 SÓI, 1 THỢ SĂN, 2 BÁN SÓI, 1 PHÙ THỦY, 1 GIÀ LÀNG, 1 THẦN TÌNH YÊU, " + (len - 10) + ` DÂN (CÂN BẰNG: ${7 + 3 - 6 * 2 + 3 - 3 * 2 + 4 + (len - 10) - 3})`;
        }
        this.room[roomID].playersTxt = [];
        this.room[roomID].players.forEach(p => {
            this.room[roomID].playersRole[p.joinID] = p.role;
            this.room[roomID].playersTxt.push(p.id + ': ' + p.first_name);

            if (p.role === -1) {
                this.room[roomID].wolfsID.push(p.joinID);
                this.room[roomID].wolfsTxt.push(p.id + ': ' + p.first_name);
                this.room[roomID].wolfsCount++;
            } else {
                this.room[roomID].villagersTxt.push(p.id + ': ' + p.first_name);
                this.room[roomID].villagersCount++;
            }
        });
        this.room[roomID].logs.push(`************************`);
        return roleListTxt;
    }
    setRole(roomID, role, num) {
        let rand = 0, count = num;
        while (count > 0) {
            do {
                rand = Math.floor((Math.random() * this.room[roomID].players.length));
            } while (this.room[roomID].players[rand].role != 4)
            this.room[roomID].logs.push(`${this.roleTxt[role]} > ${this.room[roomID].players[rand].first_name}`);
            this.room[roomID].players[rand].role = role;
            count--;
            if (role == 5) { // Phù thủy
                this.room[roomID].witchID = this.room[roomID].players[rand].joinID;
            } else if (role == 6) { // Già làng
                this.room[roomID].oldManID = this.room[roomID].players[rand].joinID;
            }
        }
    }
    module(factory, bot) {
        return factory.apply(this, [this, bot]);
    }
    func(factory, bot, roomID) {
        return factory.apply(this, [this, bot, roomID]);
    }
}

module.exports = {
    Game,
    Room,
    Player
};