function changed() {
    let canBang = 0, teamDan = 0, teamSoi = 0, setupResult = '', setup = new Object();
    $('input[type="checkbox"].co-chuc-nang').each((index, e) => {
        if (e.checked) {
            canBang += parseInt(e.value);
            if ($(this).hasClass("soi")) {
                teamSoi++;
            } else {
                teamDan++;
            }
            setupResult += '1 ' + e.name + ', ';
            setup[e.getAttribute('roleID')] = 1;
        } else {
            setup[e.getAttribute('roleID')] = 0;
        }
    });
    let dan = parseInt($('#dan')[0].value);
    let soi = parseInt($('#soi')[0].value);
    canBang += dan - soi * 6;
    setupResult += soi + ' SÓI, ' + dan + ' DÂN!';
    setup["4"] = dan; setup["-1"] = soi;

    // in kết quả
    $("#can-bang").val(canBang);
    $("label[for='can-bang']").html("CÂN BẰNG: " + canBang);
    $("#setup-total").html(teamSoi + soi + teamDan + dan);
    $("#setup-result").html(setupResult);
    $("#setup-code").html(JSON.stringify(setup));
}

$('#dan').change(() => {
    $('label[for="dan"]').html('[+' + $('#dan')[0].value + '] DÂN: ' + $('#dan')[0].value);
    changed();
})
$('#soi').change(() => {
    $('label[for="soi"]').html('[-' + $('#soi')[0].value * 6 + '] SÓI: ' + $('#soi')[0].value);
    changed();
})

$('.co-chuc-nang').change(() => {
    changed();
});
function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
function convertAndSetup(setupObject) {
    // convert to array of [role, numerOfRole]
    var setupArr = Object.keys(setupObject).map(function (key) {
        return [Number(key), setupObject[key]];
    });
    setupArr.forEach((setup) => {
        if (setup[1] > 0 && setup[0] != 4 && setup[0] != -1) {
            $('input[roleID="' + setup[0] + '"]').click();
        } else if (setup[0] == 4) {
            $('#dan')[0].value = setup[1];
            $('label[for="dan"]').html('[+' + $('#dan')[0].value + '] DÂN: ' + $('#dan')[0].value);
        } else if (setup[0] == -1) {
            $('#soi')[0].value = setup[1];
            $('label[for="soi"]').html('[-' + $('#soi')[0].value * 6 + '] SÓI: ' + $('#soi')[0].value);
        }
        changed();
    })
}
let setupObjectString = getParameterByName('setup');
if (setupObjectString !== null && setupObjectString !== "") {
    let setupObject = JSON.parse(setupObjectString);
    convertAndSetup(setupObject);
} else {
    $('#tienTri').click();
    $('#baoVe').click();
}

function currentSetup(len) {
    this.random = (min, max) => {
        return Math.floor(Math.random() * max) + min;
    }
    this.trueFalseRandom = () => {
        return Math.random() >= 0.5;
    }
    let setup;
    if (len <= 4) {
        setup = { "1": 1, "2": 1, "3": 0, "4": 0, "5": 0, "6": 0, "7": 0, "8": 1, "-3": 0, "-2": 0, "-1": 1 }; balance = 3;
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
    return setup;
}
$('#random').click(() => {
    let playersCount = $('#playersCount').val();
    let setup = currentSetup(playersCount);
    let setupString = JSON.stringify(setup);
    $('#set').html(`<a href='?setup=${setupString}&players=${$('select').val()}'>\>\>\>Nhấn vào để xem SETUP cho ${playersCount} người tiếp theo: ${setupString}</a>`);
})

let playersCountString = getParameterByName('players');
if (playersCountString !== null && playersCountString !== "") {
    let playersCount = JSON.parse(playersCountString);
    $('select').val(playersCount);
    $('#random').click();
} else {
    $('#tienTri').click();
    $('#baoVe').click();
}