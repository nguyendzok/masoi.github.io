var schedule = require('node-schedule');
class Player {
    constructor(p) {
        this.id = p.id;
        this.joinID = p.joinID;
        this.first_name = p.first_name;
        this.last_name = p.last_name;
        this.name = "";
        this.avatar = p.avatar;
        this.ready = false;
        this.role = 4; // -1: SÓI / 4: DÂN / 1: tiên tri / 2: bảo vệ
        this.timerSchedule = null; // đếm giờ
        this.convoTimer = null; //convo
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
        // this.cancelSchedule();
        this.timerSchedule = schedule.scheduleJob(time, callback);
    }
    cancelSchedule() {
        if (this.timerSchedule) {
            this.timerSchedule.cancel();
        }
    }
    afk(afkLever = 2) {
        this.afkCount += afkLever;
    }
    backToGame() {
        if (this.afkCount > 0) {
            this.afkCount -= 0.5;
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
        this.roleListTxt = '';
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

        //thiên sứ
        this.thienSuWin = undefined;

        // phù thủy
        this.witchID = undefined;
        this.witchSaveRemain = true;
        this.witchKillRemain = true;
        this.witchKillID = undefined;

        //sói nguyền
        this.soiNguyen = false;
        this.soiNguyenID = undefined;
        this.nguyenID = undefined;

        //Già làng
        this.oldManID = undefined;
        this.oldManLive = 2;

        //thợ săn
        this.hunterID = undefined; //thợ săn là ai?
        this.fireID = -1; // ghim ai?
        this.fireKill = false; // chủ động hay không? (mặc định:  bị động)

        // người bị cắn và bảo vệ
        this.deathID = -1; // sói cắn ai?
        this.saveID = -1; // bảo vệ ai?

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
        this.roleListTxt = '';

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

        this.thienSuWin = undefined;

        this.witchID = undefined;
        this.witchSaveRemain = true;
        this.witchKillRemain = true;
        this.witchKillID = undefined;

        this.soiNguyen = false;
        this.soiNguyenID = undefined;
        this.nguyenID = undefined;

        this.oldManID = undefined;
        this.oldManLive = 2;

        this.hunterID = undefined;
        this.fireID = -1;
        this.fireKill = false;

        this.deathID = -1;
        this.saveID = -1;

        this.saveOrKill = 0; // nếu vote cứu thì +1, vote treo cổ thì -1.  nhỏ hơn 0 thì treo

        let len = this.players.length;
        console.log(`# ROOM ${this.id + 1} > PLAYERS COUNT : ${len}`);
        for (let index = 0; index < len; index++) {
            let p = this.players[index];
            if (p === undefined) {
                console.log(`# ROOM ${this.id + 1} > DELETE PLAYER: ${index}`);
                this.deletePlayerByID(index);
                index--;
                len--;
            } else {
                this.players[index].ready = false;
                this.players[index].role = 4; //DÂN
                this.players[index].afkCount = 0; // điểm afk / uy tín
                this.playersTxt.push(`${p.id}: ${p.first_name}`);
                this.alivePlayer[p.joinID] = true;
            }
        }
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
    justDeletePlayer(playerID) {
        this.players[playerID] = undefined;
    }
    deletePlayerByID(id) {
        if (this.players[id] && this.players[id].ready) {
            this.readyCount--;
        }
        this.players.splice(id, 1);
        let len = this.players.length;
        for (let i = id; i < len; i++) {
            if (this.players[i] != undefined) {
                this.players[i].id--;
            }
        }
    }
    addSchedule(time, callback) {
        // this.cancelSchedule();
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
            return user ? (user.joinID == joinID) : false;
        });
    }
    getRole(joinID) {
        return this.playersRole[joinID];
    }
    getRoleByID(id) {
        return this.players[id] ? this.players[id].role : 0;
    }
    roleDoneBy(joinID, autoDone = false, nothingToDo = false) {
        if (this.roleDone[joinID]) {
            return false;
        }
        this.roleDone[joinID] = true;
        this.roleDoneCount++;
        let player = this.getPlayer(joinID);
        if (!autoDone) { // người làm
            if (!nothingToDo) {
                player.backToGame();
            }
            player.cancelSchedule();
        } else {
            if (this.isNight) {
                player.afk(5);
            } else {
                player.afk(1);
            }
        }
    }
    oneReady() {
        this.readyCount++;
    }
    killOrSaveVote(joinID, voteKill, autoVote = false) {
        if (!this.roleDone[joinID]) {
            if (voteKill) {
                this.saveOrKill--;
            } else {
                this.saveOrKill++;
            }
            this.roleDoneBy(joinID, autoVote);
            return true;
        }
    }
    killAction(deathID) {
        // không giết ai, thằng bị giết out rồi, thằng cần giết chết rồi
        if (deathID == -1 || !this.players[deathID] || !this.alivePlayer[this.players[deathID].joinID]) {
            return;
        }
        if (this.roleDone[this.players[deathID].joinID]) { //người tự sát đã thực hiện ROLE
            this.roleDoneCount--;
        } else {
            this.players[deathID].cancelSchedule();
        }
        if (this.players[deathID].role == 9) { //người chết là thiên sứ
            this.thienSuWin = true;
        }
        if (this.players[deathID].role == 5) { //người chết là phù thủy
            this.witchID = undefined;
            this.witchKillRemain = false;
            this.witchSaveRemain = false;
        }
        if (this.players[deathID].role == -3) { //người chết là sói nguyền
            this.soiNguyen = false;
            this.soiNguyenID = undefined;
        }
        if (this.players[deathID].role == 2) { //người chết là bảo vệ
            this.saveID = -1;
        }

        // kill action MAIN
        this.alivePlayer[this.players[deathID].joinID] = false;
        this.playersTxt[deathID] = '💀:' + this.playersTxt[deathID].substr(2, this.playersTxt[deathID].length - 2);
        if (this.players[deathID].role === -1 || this.players[deathID].role === -3 || this.players[deathID].joinID == this.nguyenID) {
            this.wolfsCount--;
        } else {
            this.villagersCount--;
        }

        if (this.players[deathID].role === 3) { //người chết là thợ săn
            this.killAction(this.fireID);
            this.cupidKill(this.fireID);
        }
    }
    cupidKill(deathID) {
        if (this.players[deathID] && this.cupidsID.indexOf(this.players[deathID].joinID) != -1) { //là 1 người trong cặp đôi
            this.cupidsID.forEach((joinID) => {
                let playerID = this.getPlayer(joinID).id;
                if (deathID != playerID && this.alivePlayer[joinID]) {
                    this.killAction(playerID);
                }
            });
            this.cupidTeam = false;
        }
    }
    kill() {
        console.log(`$ ROOM ${this.id + 1} > KILL ${this.deathID} > SAVE ${this.saveID} !!!`);
        if (this.deathID != -1 && this.players[this.deathID]) {
            if (!this.isNight || (this.isNight && this.deathID != this.saveID)) { // là ban ngày hoặc ban đêm bảo vệ sai
                if (this.players[this.deathID].role === -2 && this.isNight) { //là BÁN SÓI
                    this.wolfsID.push(this.players[this.deathID].joinID);
                    this.wolfsTxt.push(this.playersTxt[this.deathID]);
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
                if (this.nguyenID && this.players[this.deathID].joinID == this.nguyenID && this.isNight) { //là kẻ bị sói nguyền
                    this.nguyenAction();
                    return false;
                }
                this.killAction(this.deathID);
                this.cupidKill(this.deathID);
                return true;
            } else { // bảo vệ thành công 
                return false;
            }
        } else { // sói không cắn ai
            return false;
        }
    }
    witchKillVote(killID) {
        if (killID != -1 && this.players[killID]) {
            this.witchKillRemain = false;
            this.witchKillID = killID;
            return true;
        } else {
            return false;
        }
    }
    witchKillAction(callback) {
        if (this.witchKillID != undefined && this.players[this.witchKillID]) {
            this.killAction(this.witchKillID);
            this.cupidKill(this.witchKillID);
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
            return true;
        } else {
            return false;
        }
    }
    fire(joinID, voteID, fireKill = false) {
        if (voteID == -1 && !this.roleDone[joinID]) { //bắn lên trời (bị động only)
            if (!fireKill) { //bị động
                this.fireID = -1;
                this.roleDoneBy(joinID);
                return true;
            } else { //không thể chủ động bắn lên trời
                return false;
            }
        }
        if (!this.roleDone[joinID] && this.players[voteID] && this.alivePlayer[this.players[voteID].joinID] && (fireKill || (!fireKill && this.fireID != voteID))) {
            // chủ động hoặc (bị động + ghim người khác đêm trước) 
            this.fireID = voteID;
            this.fireKill = fireKill;
            this.hunterID = joinID;
            this.roleDoneBy(joinID);
            return true;
        } else {
            return false;
        }
    }
    fireKillAction(callback) {
        if (this.fireID == -1 || !this.players[this.fireID] || !this.fireKill || !this.hunterID) { //không phải bắn lên trời hoặc bắn lung tung, phải là chủ động. phải còn thợ săn
            return false;
        }
        let fireRole = this.getRoleByID(this.fireID);
        let hunterUser = this.getPlayer(this.hunterID);
        if (fireRole > 0) { // bắn trúng dân làng (giết thợ săn => thợ săn tự ghim nạn nhân)
            this.killAction(hunterUser.id);
            this.cupidKill(hunterUser.id);
            callback(hunterUser.id, [hunterUser.id, this.fireID], false); //id thợ săn, mảng nạn nhân: [] + bắn trúng sói hay sai : false
        } else { //chỉ giết nạn nhân
            this.killAction(this.fireID);
            this.cupidKill(this.fireID);
            callback(hunterUser.id, [this.fireID], true);
        }

        // bắn xong, dù đúng hay sai bạn về dân nhé :v
        hunterUser.setRole(4);
        this.playersRole[this.hunterID] = 4;

        // reset
        this.hunterID = undefined;
        this.fireID = -1;
        this.fireKill = false;
    }
    see(joinID, voteID, trueCallback, falseCallback) {
        if (!this.roleDone[joinID] && this.players[voteID] && this.alivePlayer[this.players[voteID].joinID]) {
            this.roleDoneBy(joinID);
            if (this.oldManID != undefined && this.oldManLive <= 0) { // có GIÀ LÀNG đã chết
                trueCallback(4); // già làng chết: soi ra DÂN
            } else {
                let role = this.getRoleByID(voteID);
                if (role == -1 || role == -3 || role == 8 || (this.nguyenID && this.players[voteID].joinID == this.nguyenID)) { // sói, sói nguyền, người hóa sói, kẻ bị sói nguyền
                    trueCallback(-1);
                } else if (role == 1) { // soi tiên tri :v
                    trueCallback(1);
                } else { // còn lại là DÂN
                    trueCallback(4);
                }
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
            this.playersRole[joinID] = 4;
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
        let user = this.getPlayer(joinID);
        if (!this.isNight) { // BAN NGÀY : vote treo cổ
            this.vote(joinID, -1, true);
            return;
        }
        // BAN ĐÊM: 
        if (role == -1) { // SÓI
            this.vote(joinID, -1, true);
            return;
        }
        if (role == 2) { // bảo vệ
            this.saveID = -1;
        } else if (role == 3) { // thợ săn
            this.fireID = -1;
        } else if (role == 7) { // CUPID
            user.setRole(4);
            this.playersRole[user.joinID] = 4;
        }
        this.roleDoneBy(joinID, true);
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
        if (this.thienSuWin) {
            // thiên sứ thắng
            callback(9);
        } else if (this.cupidTeam && this.wolfsCount + this.villagersCount == 2 && this.wolfsCount > 0) {
            // cặp đôi thắng
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
    setPlayersRole(id, role) {
        this.players[id].setRole(role);
        this.playersRole[this.players[id].joinID] = role;
    }
    vote(joinID, voteID, autoVote = false) {
        if (!this.isMorning) {
            console.log('>>> VOTE FAILED (NOT MORN)!')
            return false;
        }
        if (voteID == -1 && !this.roleDone[joinID]) {
            this.roleDoneBy(joinID, autoVote);
            console.log('>>> VOTE NULL -1!')
            return true;
        }
        if (!this.roleDone[joinID] && this.players[voteID] && this.alivePlayer[this.players[voteID].joinID]) {
            if (this.voteList[voteID]) {
                this.voteList[voteID]++;
            } else {
                this.voteList[voteID] = 1;
            }
            console.log('>>> VOTE PASSED!')
            this.roleDoneBy(joinID, autoVote);
            return true;
        } else {
            console.log('>>> VOTE FAILED (roleAlreadyDONE)!')
            return false;
        }
    }
    justVote(voteID) {
        if (this.players[voteID] && this.alivePlayer[this.players[voteID].joinID] && Object.keys(this.voteList).length == 0) {
            this.voteList[voteID] = 1;
            console.log('>>> JUST VOTE! (kẻ bị sói nguyền)');
            return true;
        }
        return false;
    }
    nguyen(nguyenID) {
        if (this.soiNguyen && this.players[nguyenID] && this.alivePlayer[this.players[nguyenID].joinID]) {
            this.soiNguyen = false;
            this.nguyenID = this.players[nguyenID].joinID;
            return true;
        } else {
            return false;
        }
    }
    nguyenAction() {
        if (!this.nguyenID) {
            return false;
        }
        let nguyenUser = this.getPlayer(this.nguyenID);
        if (nguyenUser.role > 0) {
            this.wolfsID.push(this.nguyenID);
            this.wolfsTxt.push(this.playersTxt[nguyenUser.id]);
            this.villagersCount--;
            this.wolfsCount++;
        }
        return true;
    }
    witchUseSave() {
        this.witchSaveRemain = false;
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
    getAlivePlayerList() {
        let counter = 0;
        let ret = this.playersTxt.filter((e) => {
            if (counter < 11 && e[0] != '💀'[0]) {
                counter++;
                return true;
            }
            return false;
        });
        return ret;
    }
    getAliveWolfList() {
        let counter = 0;
        let ret = this.wolfsTxt.filter((e) => {
            if (counter < 11 && e[0] != '💀'[0]) {
                counter++;
                return true;
            }
            return false;
        });
        return ret;
    }
    getAliveVillagerList() {
        let counter = 0;
        let ret = this.villagersTxt.filter((e) => {
            if (counter < 11 && e[0] != '💀'[0]) {
                counter++;
                return true;
            }
            return false;
        });
        return ret;
    }
}

class Game {
    constructor() {
        this.room = [];
        this.userRoom = [];
        this.roleTxt = [];
        this.MIN_PLAYER = 4;
        this.MAX_PER_PAGE = 4;
        this.resetAllRoom();
        this.setRoleTxt();
    }
    setRoleTxt() {
        // PHE SÓI
        this.roleTxt[-1] = '🐺SÓI';
        this.roleTxt[-2] = '🐺BÁN SÓI';
        this.roleTxt[-3] = '🐺SÓI NGUYỀN';

        // PHE DÂN
        this.roleTxt[1] = '🔍TIÊN TRI';
        this.roleTxt[2] = '🗿BẢO VỆ';
        this.roleTxt[3] = '🔫THỢ SĂN';
        this.roleTxt[4] = '💩DÂN';
        this.roleTxt[5] = '🔮PHÙ THỦY';
        this.roleTxt[6] = '👴GIÀ LÀNG';
        this.roleTxt[7] = '👼THẦN TÌNH YÊU';
        this.roleTxt[8] = '😸NGƯỜI HÓA SÓI';
        this.roleTxt[9] = '💸THIÊN SỨ';
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
        for (let i = 0; i < 12; i++) {
            this.room.push(new Room(i));
        }
    }
    newRoom() {
        this.room.push(new Room(this.room.length));
        return this.room.length;
    }
    getRoom(id) {
        return this.room[id];
    }
    searchUserInRoom(userID, roomID) {
        return this.room[roomID].players.find((user) => {
            return user ? (user.joinID == userID) : false;
        });
    }
    // get view
    getRoomListView(start = 0) {
        let roomListView = [], len = this.room.length;
        if (start > 0) {
            roomListView.push('<');
        }
        for (let i = start; (i < start + this.MAX_PER_PAGE && i < len); i++) {
            let r = this.room[i];
            if (!r.ingame) {
                if (r.players.length > 0) {
                    if (r.players.length >= 11) {
                        roomListView.push('🚫' + (r.id + 1).toString());
                    } else if (r.players.length >= 7) {
                        roomListView.push('🔥' + (r.id + 1).toString());
                    } else if (r.players.length >= 4) {
                        roomListView.push('👥' + (r.id + 1).toString());
                    } else {
                        roomListView.push('👤' + (r.id + 1).toString());
                    }
                } else {
                    roomListView.push((r.id + 1).toString());
                }
            } else { // đang chơi
                roomListView.push('🎮' + (r.id + 1).toString());
            }
        }
        if (start + this.MAX_PER_PAGE < len) {
            roomListView.push('>');
        }
        return roomListView;
    }
    getRoomPlayerView(roomID, start = 0, limit = 20) {
        let playerListView = [], len = this.room[roomID].players.length;
        // create message
        for (let i = start; (i < len && (i - start) < limit); i++) {
            let m = this.room[roomID].players[i];
            playerListView.push({
                title: "" + (m.id + 1) + ": " + m.first_name,
                image_url: m.avatar,
                subtitle: `Họ & Tên: ${m.last_name + " " + m.first_name}\nMã số: ${m.id}\n${m.ready ? '🌟Đã sẵn sàng' : '💤Chưa sẵn sàng'}`,
            });
        }
        return playerListView;
    }
    getSimpleRoomPlayerView(roomID, start = 0, limit = 20) {
        let playerListView = [], len = this.room[roomID].players.length;
        // create message
        for (let i = start; (i < len && (i - start) < limit); i++) {
            let m = this.room[roomID].players[i];
            playerListView.push(`${m.id + 1}: ${m.first_name} (${m.last_name} ${m.first_name}) ${m.ready ? '🌟' : '💤'}`);
        }
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
    random(min, max) {
        return Math.floor(Math.random() * max) + min;
    }
    convertAndSetup(roomID, setupObject) {
        // convert to array of [role, numerOfRole]
        var setupArr = Object.keys(setupObject).map(function (key) {
            return [Number(key), setupObject[key]];
        });
        var setupTxt = 'SETUP GAME\n';
        setupArr.forEach((setup) => {
            if (setup[1] > 0 && setup[0] != 4) {
                this.setRole(roomID, setup[0], setup[1]);
                setupTxt += setup[1] + " " + this.roleTxt[setup[0]] + "\n";
            }
        })
        return setupTxt;
    }
    roleRandom(roomID) {
        this.room[roomID].subscriberList = []; //danh sách người chơi đợi để tham gia phòng

        console.log(`$ ROOM ${roomID + 1} > RANDOM ROLE FOR ${this.room[roomID].players.length} PLAYERS`);

        let len = this.room[roomID].players.length;
        let roleListTxt, balance = 404;
        let setup;

        if (len <= 4) {
            setup = { "1": 1, "2": 0, "3": 0, "4": 1, "5": 0, "6": 0, "7": 0, "8": 0, "9": 1, "-3": 0, "-2": 0, "-1": 1 }; balance = 3;
        } else {
            if (len == 5) {
                switch (this.random(1, 2)) {
                    case 1: setup = { "1": 1, "2": 1, "3": 0, "4": 1, "5": 0, "6": 0, "7": 0, "8": 0, "-3": 0, "-2": 1, "-1": 1 }; balance = 2; break;
                    case 2: setup = { "1": 1, "2": 0, "3": 0, "4": 3, "5": 0, "6": 0, "7": 0, "8": 0, "-3": 0, "-2": 0, "-1": 1 }; balance = 4; break;
                }
            } else if (len == 6) {
                switch (this.random(1, 4)) {
                    case 1: setup = { "1": 1, "2": 1, "3": 0, "4": 2, "5": 0, "6": 0, "7": 0, "8": 0, "-3": 0, "-2": 1, "-1": 1 }; balance = 3; break;
                    case 2: setup = { "1": 1, "2": 1, "3": 1, "4": 1, "5": 0, "6": 0, "7": 0, "8": 0, "-3": 0, "-2": 0, "-1": 2 }; balance = 2; break;
                    case 3: setup = { "1": 1, "2": 1, "3": 0, "4": 1, "5": 0, "6": 0, "7": 0, "8": 1, "-3": 0, "-2": 1, "-1": 1 }; balance = 1; break;
                    case 4: setup = { "1": 1, "2": 0, "3": 0, "4": 2, "5": 1, "6": 0, "7": 0, "8": 1, "-3": 1, "-2": 0, "-1": 0 }; balance = 0; break;
                }
            } else if (len == 7) {
                switch (this.random(1, 4)) {
                    case 1: setup = { "1": 1, "2": 0, "3": 0, "4": 3, "5": 1, "6": 0, "7": 0, "8": 1, "-3": 1, "-2": 0, "-1": 0 }; balance = 1; break;
                    case 2: setup = { "1": 1, "2": 1, "3": 0, "4": 2, "5": 0, "6": 0, "7": 0, "8": 1, "-3": 0, "-2": 1, "-1": 1 }; balance = 2; break;
                    case 3: setup = { "1": 1, "2": 1, "3": 0, "4": 1, "5": 1, "6": 0, "7": 0, "8": 1, "-3": 0, "-2": 0, "-1": 2 }; balance = 2; break;
                    case 4: setup = { "1": 1, "2": 1, "3": 1, "4": 1, "5": 0, "6": 0, "7": 0, "8": 1, "-3": 0, "-2": 0, "-1": 2 }; balance = 1; break;
                }
            } else if (len == 8) {
                switch (this.random(1, 8)) {
                    case 1: setup = { "1": 1, "2": 1, "3": 0, "4": 3, "5": 1, "6": 0, "7": 0, "8": 0, "-3": 1, "-2": 1, "-1": 0 }; balance = 3; break;
                    case 2: setup = { "1": 1, "2": 1, "3": 1, "4": 2, "5": 0, "6": 0, "7": 0, "8": 0, "-3": 0, "-2": 1, "-1": 2 }; balance = 2; break;
                    case 3: setup = { "1": 1, "2": 1, "3": 0, "4": 2, "5": 1, "6": 0, "7": 0, "8": 0, "-3": 0, "-2": 1, "-1": 2 }; balance = 1; break;
                    case 4: setup = { "1": 1, "2": 1, "3": 0, "4": 1, "5": 1, "6": 0, "7": 0, "8": 1, "-3": 0, "-2": 1, "-1": 2 }; balance = -1; break;
                    case 5: setup = { "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, "6": 0, "7": 0, "8": 0, "-3": 0, "-2": 1, "-1": 2 }; balance = 3; break;
                    case 6: setup = { "1": 1, "2": 0, "3": 1, "4": 2, "5": 1, "6": 0, "7": 0, "8": 0, "-3": 0, "-2": 1, "-1": 2 }; balance = 1; break;
                    case 7: setup = { "1": 1, "2": 0, "3": 1, "4": 1, "5": 1, "6": 1, "7": 0, "8": 0, "-3": 0, "-2": 1, "-1": 2 }; balance = -2; break;
                    case 8: setup = { "1": 1, "2": 1, "3": 0, "4": 1, "5": 1, "6": 1, "7": 0, "8": 0, "-3": 0, "-2": 1, "-1": 2 }; balance = -2; break;
                }
            } else if (len == 9) {
                switch (this.random(1, 8)) {
                    case 1: setup = { "1": 1, "2": 1, "3": 0, "4": 3, "5": 1, "6": 0, "7": 0, "8": 1, "-3": 1, "-2": 1, "-1": 0 }; balance = 1; break;
                    case 2: setup = { "1": 1, "2": 1, "3": 1, "4": 2, "5": 0, "6": 0, "7": 0, "8": 1, "-3": 0, "-2": 1, "-1": 2 }; balance = -1; break;
                    case 3: setup = { "1": 1, "2": 0, "3": 0, "4": 4, "5": 1, "6": 0, "7": 0, "8": 0, "-3": 0, "-2": 1, "-1": 2 }; balance = 0; break;
                    case 4: setup = { "1": 1, "2": 1, "3": 0, "4": 2, "5": 1, "6": 0, "7": 0, "8": 1, "-3": 0, "-2": 1, "-1": 2 }; balance = 0; break;
                    case 5: setup = { "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, "6": 0, "7": 0, "8": 1, "-3": 0, "-2": 1, "-1": 2 }; balance = 2; break;
                    case 6: setup = { "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, "6": 1, "7": 0, "8": 0, "-3": 0, "-2": 1, "-1": 2 }; balance = 2; break;
                    case 7: setup = { "1": 1, "2": 1, "3": 1, "4": 2, "5": 1, "6": 1, "7": 0, "8": 0, "-3": 1, "-2": 1, "-1": 0 }; balance = 2; break;
                    case 8: setup = { "1": 1, "2": 1, "3": 1, "4": 1, "5": 1, "6": 1, "7": 0, "8": 1, "-3": 1, "-2": 1, "-1": 0 }; balance = 0; break;
                }
            } else if (len == 10) {
                switch (this.random(1, 8)) {
                    case 1: setup = { "1": 1, "2": 1, "3": 1, "4": 3, "5": 1, "6": 1, "7": 0, "8": 0, "-3": 1, "-2": 0, "-1": 1 }; balance = 0; break;
                    case 2: setup = { "1": 1, "2": 1, "3": 1, "4": 3, "5": 1, "6": 0, "7": 0, "8": 0, "-3": 1, "-2": 1, "-1": 1 }; balance = -1; break;
                    case 3: setup = { "1": 1, "2": 1, "3": 0, "4": 3, "5": 1, "6": 1, "7": 0, "8": 0, "-3": 0, "-2": 1, "-1": 2 }; balance = 0; break;
                    case 4: setup = { "1": 1, "2": 1, "3": 1, "4": 3, "5": 1, "6": 0, "7": 0, "8": 0, "-3": 0, "-2": 0, "-1": 3 }; balance = 2; break;
                    case 5: setup = { "1": 1, "2": 1, "3": 1, "4": 2, "5": 1, "6": 0, "7": 0, "8": 1, "-3": 0, "-2": 0, "-1": 3 }; balance = 0; break;
                    case 6: setup = { "1": 1, "2": 1, "3": 1, "4": 3, "5": 1, "6": 0, "7": 1, "8": 0, "-3": 1, "-2": 0, "-1": 1 }; balance = -1; break;
                    case 7: setup = { "1": 1, "2": 1, "3": 1, "4": 2, "5": 1, "6": 0, "7": 0, "8": 0, "-3": 0, "-2": 1, "-1": 3 }; balance = -2; break;
                    case 8: setup = { "1": 1, "2": 1, "3": 1, "4": 2, "5": 1, "6": 1, "7": 0, "8": 0, "-3": 0, "-2": 0, "-1": 3 }; balance = -1; break;
                }
            } else { // 11
                switch (this.random(1, 7)) {
                    case 1: setup = { "1": 1, "2": 1, "3": 1, "4": 3, "5": 1, "6": 1, "7": 0, "8": 0, "-3": 0, "-2": 0, "-1": 3 }; balance = 0; break;
                    case 2: setup = { "1": 1, "2": 1, "3": 1, "4": 3, "5": 1, "6": 0, "7": 0, "8": 0, "-3": 0, "-2": 1, "-1": 3 }; balance = -1; break;
                    case 3: setup = { "1": 1, "2": 1, "3": 1, "4": 4, "5": 1, "6": 0, "7": 1, "8": 0, "-3": 1, "-2": 0, "-1": 1 }; balance = 0; break;
                    case 4: setup = { "1": 1, "2": 1, "3": 1, "4": 4, "5": 1, "6": 0, "7": 1, "8": 0, "-3": 1, "-2": 1, "-1": 0 }; balance = 3; break;
                    case 5: setup = { "1": 1, "2": 1, "3": 1, "4": 4, "5": 1, "6": 1, "7": 0, "8": 0, "-3": 1, "-2": 1, "-1": 0 }; balance = 4; break;
                    case 6: setup = { "1": 1, "2": 1, "3": 1, "4": 4, "5": 1, "6": 0, "7": 0, "8": 0, "-3": 1, "-2": 1, "-1": 1 }; balance = 0; break;
                    case 7: setup = { "1": 1, "2": 1, "3": 1, "4": 3, "5": 1, "6": 0, "7": 1, "8": 0, "-3": 0, "-2": 1, "-1": 2 }; balance = -2; break;
                }
            }
        }
        roleListTxt = this.convertAndSetup(roomID, setup);
        roleListTxt += `(CÂN BẰNG: ${balance})`;
        this.room[roomID].playersTxt = [];
        this.room[roomID].players.forEach(p => {
            this.room[roomID].playersRole[p.joinID] = p.role;
            this.room[roomID].playersTxt.push(p.id + ': ' + p.first_name);

            if (p.role === -1 || p.role === -3) {
                this.room[roomID].wolfsID.push(p.joinID);
                this.room[roomID].wolfsTxt.push(p.id + ': ' + p.first_name);
                this.room[roomID].wolfsCount++;
            } else {
                this.room[roomID].villagersTxt.push(p.id + ': ' + p.first_name);
                this.room[roomID].villagersCount++;
            }
        });
        this.room[roomID].logs.push(`************************`);
        this.room[roomID].roleListTxt = roleListTxt;
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
            } else if (role == -3) { // sói nguyền
                this.room[roomID].soiNguyen = true;
                this.room[roomID].soiNguyenID = this.room[roomID].players[rand].joinID;
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