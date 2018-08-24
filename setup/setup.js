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
    console.log(setup)
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