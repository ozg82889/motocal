var GlobalConst = require('./global_const.js')
var elementRelation = GlobalConst.elementRelation
var bahamutRelation = GlobalConst.bahamutRelation
var bahamutFURelation = GlobalConst.bahamutFURelation
var supportAbilities = GlobalConst.supportAbilities
var zenith = GlobalConst.zenith
var Jobs = GlobalConst.Jobs
var armTypes = GlobalConst.armTypes
var jobTypes = GlobalConst.jobTypes
var keyTypes = GlobalConst.keyTypes
var skilltypes = GlobalConst.skilltypes
var skillAmounts = GlobalConst.skillAmounts
var elementTypes = GlobalConst.elementTypes
var summonTypes = GlobalConst.summonTypes
var summonElementTypes = GlobalConst.summonElementTypes
var raceTypes = GlobalConst.raceTypes
var filterElementTypes = GlobalConst.filterElementTypes
var enemyDefenseType = GlobalConst.enemyDefenseType

module.exports.isCosmos = function(arm){
    var isCos = false;
    if(skilltypes[arm.skill1] != undefined && skilltypes[arm.skill1].type == "cosmosArm") {
        isCos = true;
    } else if(skilltypes[arm.skill2] != undefined && skilltypes[arm.skill2].type == "cosmosArm") {
        isCos = true;
    }

    return isCos
};

module.exports.isValidResult = function(res, minHP){
    // 結果の前処理用の関数

    // 最低保証HP
    if(minHP != undefined) {
        if (minHP > res.Djeeta.totalHP) return false
    }
    return true
};

module.exports.proceedIndex = function(index, ana, i){
    if(i == ana.length){
        return index;
    } else {
        index[i] = (index[i] + 1)|0;
        if(index[i] > ana[i].length - 1){
            index[i] = 0;
            index = arguments.callee(index, ana, i + 1);
        }
        return index
    }
};

module.exports.calcCombinations = function(arml) {
    // 全武器に対して [最小考慮数, ... , 最大考慮数] の配列を計算しておく
    var armNumArray = []
    var totalItr = 1;
    for(var i = 0; i < arml.length; i++){
        var temp = []
        var numMin = (arml[i].considerNumberMin != undefined) ? parseInt(arml[i].considerNumberMin) : 0
        var numMax = (arml[i].considerNumberMax != undefined) ? parseInt(arml[i].considerNumberMax) : 1
        var itr = numMax - numMin + 1
        for(var j = 0; j < itr; j++){
            temp[j] = j + numMin;
        }
        totalItr *= itr;
        armNumArray[i] = temp;
    }
    var combinations = []
    var index = []
    for(var i = 0; i < armNumArray.length; i++){
        index[i] = 0;
    }

    // isCosmos 事前判定
    var isCosmosArray = []
    for(var i = 0; i < arml.length; i++){
        isCosmosArray[i] = module.exports.isCosmos(arml[i])
    }

    for(var i = 0; i < totalItr; i=(i+1)|0){
        var temp = []
        var num = 0;
        var isCosmosIncluded = false;
        var isValidCombination = true;
        for(var j = 0; j < armNumArray.length; j=(j+1)|0){
            if(!isCosmosArray[j]) {
                temp.push(armNumArray[j][index[j]]);
                num += parseInt(armNumArray[j][index[j]])
            } else {
                // cosmos 武器
                if(armNumArray[j][index[j]] == 0) {
                    temp.push(armNumArray[j][index[j]]);
                } else if(armNumArray[j][index[j]] > 0 && !isCosmosIncluded) {
                    temp.push(armNumArray[j][index[j]]);
                    num += parseInt(armNumArray[j][index[j]])
                    isCosmosIncluded = true;
                } else {
                    isValidCombination = false;
                }
            }
        }
        if( isValidCombination && ((totalItr <= 1024 && num <= 10) || num == 10) ) combinations.push(temp)
        index = module.exports.proceedIndex(index, armNumArray, 0)
    }
    return combinations
};

module.exports.getTypeBonus = function(self_elem, enemy_elem) {
    var t_enemy_elem = (enemy_elem == undefined) ? "fire" : enemy_elem
    var t_elem = (self_elem == undefined) ? "fire" : self_elem

    if(elementRelation[ t_elem ]["weak"] == t_enemy_elem) {
        return 0.75
    } else if(elementRelation[ t_elem ]["strong"] == t_enemy_elem) {
        return 1.5
    } else {
        return 1.0
    }
},

module.exports.getTypeBonusStr = function(self_elem, enemy_elem) {
    switch(module.exports.getTypeBonus(self_elem, enemy_elem)) {
        case 1.0:
            return "非有利"
            break;
        case 1.5:
            return "有利"
            break;
        case 0.75:
            return "不利"
            break;
        default:
            return "非有利"
            break;
    }
};

module.exports.calcDamage = function(totalAttack, enemyDefense, additionalDamage, damageUP) {
    // ダメージ計算
    var def = (enemyDefense == undefined) ? 10.0 : enemyDefense
    var damage = totalAttack / def
    var overedDamage = 0
    // 補正1
    if(damage > 612500) {
        overedDamage += 0.01 * (damage - 612500)
        damage = 612500
    }
    // 補正2
    if(damage > 550000) {
        overedDamage += 0.10 * (damage - 550000)
        damage = 550000
    }
    // 補正3
    if(damage > 425000) {
        overedDamage += 0.40 * (damage - 425000)
        damage = 425000
    }
    // 補正4
    if(damage > 300000) {
        overedDamage += 0.70 * (damage - 300000)
        damage = 300000
    }

    var res = damage + overedDamage;

    if(additionalDamage > 0) {
        res *= 1.0 + additionalDamage
    }

    if(damageUP > 0) {
        res *= 1.0 + damageUP
    }

    return res
};

module.exports.calcOugiDamage = function(totalAttack, enemyDefense, ougiRatio, ougiDamageBuff, damageUP) {
    // ダメージ計算
    var def = (enemyDefense == undefined) ? 10.0 : enemyDefense
    var ratio = (ougiRatio == undefined) ? 4.5 : ougiRatio
    var damage = (1.0 + ougiDamageBuff) * totalAttack * ratio / def
    var overedDamage = 0
    // 補正1
    if(damage > 1400000) {
        overedDamage += 0.01 * (damage - 1400000)
        damage = 1400000
    }
    // 補正2
    if(damage > 1300000) {
        overedDamage += 0.05 * (damage - 1300000)
        damage = 1300000
    }
    // 補正3
    if(damage > 1150000) {
        overedDamage += 0.40 * (damage - 1150000)
        damage = 1150000
    }
    // 補正4
    if(damage > 1000000) {
        overedDamage += 0.60 * (damage - 1000000)
        damage = 1000000
    }

    // 与ダメージアップ
    if(damageUP > 0) {
        return (1.0 + damageUP) * (damage + overedDamage)
    } else {
        return damage + overedDamage
    }
};

module.exports.calcCriticalRatio = function(normalCritical, _magnaCritical, normalOtherCritical, summon) {
    var gikouArray = []
    var gikouRatioArray = []

    var magnaCritical = 0.01 * _magnaCritical * summon["magna"]
    if(magnaCritical > 1.0) {
        gikouArray.push(1.0);
        gikouRatioArray.push(0.5);
    } else if (magnaCritical > 0.0) {
        gikouArray.push(magnaCritical);
        gikouRatioArray.push(0.5);
    }

    // 通常技巧配列は[確率1, 確率2, 確率3, ... ]という形式で渡される
    for(var j = 0; j < normalCritical.length; j++){
        // 単体スキル分なので1.0以上の値が来ないか確認しなくて良い
        gikouArray.push(0.01 * normalCritical[j]["value"] * summon["zeus"]);
        gikouRatioArray.push(normalCritical[j]["attackRatio"]);
    }

    // LBやサポアビ分の技巧
    for(var j = 0; j < normalOtherCritical.length; j++){
        gikouArray.push(normalOtherCritical[j]["value"]);
        gikouRatioArray.push(normalOtherCritical[j]["attackRatio"]);
    }

    var criticalRatio = 0.0

    // 最大10要素 + LB + キャラ技巧の技巧配列が来る
    // それぞれ倍率と発動率は違う
    // n要素とした時、最大2^n個の発動確率がある
    // {発動率: {発動本数: x, ケース: 1}}という配列にすればそのあとkeysを使うことで期待値が出せる
    // {ダメージ倍率: {発動確率: x}}という配列にして、
    // 同じ倍率の場合は発動確率を加算すればよい
    if(gikouArray.length > 0){
        var bitmask = []
        var criticalRatioArray = {}
        for(var i = 0; i < gikouArray.length; i++) {
            bitmask.push(1 << i);
        }

        for(var i = 0; i < Math.pow(2, gikouArray.length); i++) {
            var ratio = 1.0
            var cnt = 0
            var attackRatio = 1.0

            for(var j = 0; j < gikouArray.length; j++) {
                if((bitmask[j] & i) > 0) {
                    // j番目の技巧が発動
                    ratio *= gikouArray[j]
                    cnt += 1
                    attackRatio += gikouRatioArray[j]
                } else {
                    // j番目の技巧は非発動
                    ratio *= 1.0 - gikouArray[j]
                }
            }

            // ここまでである1ケースの発動率が算出できた
            if(ratio > 0.0) {
                if(ratio > 1.0) ratio = 1.0

                if(!(attackRatio in criticalRatioArray)) {
                    // ratioが存在しない場合
                    criticalRatioArray[attackRatio] = {"ratio": ratio}
                } else {
                    // ratioが存在する場合
                    criticalRatioArray[attackRatio]["ratio"] += ratio
                }
            }
        }

        // ここまでで全てのケースについて算出できた
        for(var attackRatio in criticalRatioArray) {
            criticalRatio += attackRatio * criticalRatioArray[attackRatio]["ratio"]
        }
    } else {
        criticalRatio = 1.0
    }

    return criticalRatio
};

module.exports.calcBasedOneSummon = function(summonind, prof, buff, totals) {
    var res = {}

    for(key in totals) {
        var totalSummon = totals[key]["totalSummon"][summonind]

        // for attack
        var magnaCoeff = 1.0 + 0.01 * totals[key]["magna"] * totalSummon["magna"]
        var magnaHaisuiCoeff = 1.0 + 0.01 * (totals[key]["magnaHaisui"]) * totalSummon["magna"]
        var unknownCoeff = 1.0 + 0.01 * totals[key]["unknown"] * totalSummon["ranko"] + 0.01 * totals[key]["unknownOther"]
        var unknownHaisuiCoeff = 1.0 + 0.01 * totals[key]["unknownOtherHaisui"]

        var normalCoeff = 1.0 + 0.01 * totals[key]["normal"] * totalSummon["zeus"] + 0.01 * totals[key]["bahaAT"] + 0.01 * totals[key]["normalOther"] + 0.01 * totals[key]["cosmosAT"] + totalSummon["chara"] + buff["normal"] + totals[key]["normalBuff"]
        var normalHaisuiCoeff = 1.0 + 0.01 * (totals[key]["normalHaisui"]) * totalSummon["zeus"]
        var normalKonshinCoeff = 1.0 + 0.01 * (totals[key]["normalKonshin"]) * totalSummon["zeus"]
        // 属性(経過ターン)も最大値で計算する
        var elementCoeff = totals[key]["typeBonus"] + (totalSummon["element"] - 1.0 + totalSummon["elementTurn"] - 1.0) + buff["element"] + totals[key]["elementBuff"]
        var otherCoeff = 1.0 + buff["other"] + totals[key]["otherBuff"]

        // キャラ背水枠
        var charaHaisuiCoeff = 1.0 + 0.01 * totals[key]["charaHaisui"]

        // hp倍率
        var hpCoeff = (1.0 + buff["hp"] + totalSummon["hpBonus"] + 0.01 * totals[key]["bahaHP"] + 0.01 * totals[key]["magnaHP"] * totalSummon["magna"] + 0.01 * totals[key]["normalHP"] * totalSummon["zeus"] + 0.01 * totals[key]["unknownHP"] * totalSummon["ranko"])

        if(key == "Djeeta") hpCoeff += 0.01 * totals["Djeeta"]["job"].shugoBonus
        hpCoeff *= 1.0 - totals[key]["HPdebuff"]

        // ベースHP
        var displayHP = totals[key]["baseHP"] + totals[key]["armHP"] + totalSummon["hp"]

        if(key == "Djeeta") {
            // for Djeeta
            var summedAttack = (totals[key]["baseAttack"] + totals[key]["armAttack"] + totalSummon["attack"] + totals["Djeeta"]["job"].atBonus) * (1.0 + buff["master"])
            // 主人公HP計算
            displayHP += totals["Djeeta"]["job"].hpBonus
            displayHP *= (1.0 + buff["masterHP"])
            var totalHP = displayHP * hpCoeff
        } else {
            // for chara
            var summedAttack = totals[key]["baseAttack"] + totals[key]["armAttack"] + totalSummon["attack"]
            var totalHP = displayHP * hpCoeff
        }

        var totalAttack = summedAttack * magnaCoeff * magnaHaisuiCoeff * normalCoeff * normalHaisuiCoeff * elementCoeff * unknownCoeff * otherCoeff * unknownHaisuiCoeff * normalKonshinCoeff * charaHaisuiCoeff

        // HPの下限は 1
        if( totalHP <= 0 ) totalHP = 1

        // for DA and TA
        var normalNite = totals[key]["normalNite"] * totalSummon["zeus"];
        var magnaNite = totals[key]["magnaNite"] * totalSummon["magna"];
        var normalSante = totals[key]["normalSante"] * totalSummon["zeus"];
        var magnaSante = totals[key]["magnaSante"] * totalSummon["magna"];
        var unknownOtherNite = totals[key]["unknownOtherNite"]

        // DATA sup
        // 通常・方陣・EX・バハ・コスモスBLで別枠とする
        // DATA debuff は羅刹用
        var armDAupNormal = (normalNite + normalSante > 50.0) ? 50.0 : normalNite + normalSante
        var armDAupMagna = (magnaNite + magnaSante > 50.0) ? 50.0 : magnaNite + magnaSante
        var armDAupBaha = (totals[key]["bahaDA"] > 50.0) ? 50.0 : totals[key]["bahaDA"]
        var armDAupCosmos = (totals[key]["cosmosBL"] > 50.0) ? 50.0 : totals[key]["cosmosBL"]
        var armDAupOther = (totals[key]["DAbuff"] > 50.0) ? 50.0 : totals[key]["DAbuff"] // 特殊スキルなどの分
        // unknownは現状50%に届くことはない
        var totalDA = 0.01 * totals[key]["baseDA"] + buff["da"] + totals[key]["DABuff"] + totalSummon["da"] + 0.01 * (armDAupNormal + armDAupMagna + unknownOtherNite + armDAupBaha + armDAupCosmos + armDAupOther)
        if(totalDA < 0.0) totalDA = 0.0

        var armTAupNormal = (normalSante > 50.0) ? 50.0 : normalSante
        var armTAupMagna  = (magnaSante > 50.0)  ? 50.0 : magnaSante
        var armTAupBaha = (totals[key]["bahaTA"] > 50.0) ? 50.0 : totals[key]["bahaTA"]
        var armTAupOther = (totals[key]["TAbuff"] > 50.0) ? 50.0 : totals[key]["TAbuff"]
        var totalTA = 0.01 * totals[key]["baseTA"] + buff["ta"] + totals[key]["TABuff"] + totalSummon["ta"] + 0.01 * (armTAupNormal + armTAupMagna + armTAupBaha + armTAupOther)
        if(totalTA < 0.0) totalTA = 0.0

        var taRate = (parseFloat(totalTA) >= 1.0) ? 1.0 : parseFloat(totalTA)
        var daRate = (parseFloat(totalDA) >= 1.0) ? 1.0 : parseFloat(totalDA)
        var expectedAttack = 3.0 * taRate + (1.0 - taRate) * (2.0 * daRate + (1.0 - daRate))

        if(totals[key]["typeBonus"] != 1.5) {
            var damageUP = 0.0
            var criticalRatio = 1.0
        } else {
            var damageUP = totals[key]["tenshiDamageUP"]
            var criticalRatio = module.exports.calcCriticalRatio(totals[key]["normalCritical"], totals[key]["magnaCritical"], totals[key]["normalOtherCritical"], totalSummon)
        }

        var criticalAttack = parseInt(totalAttack * criticalRatio)
        var expectedOugiGage = (buff["ougiGage"] + totals[key]["ougiGageBuff"]- totals[key]["ougiDebuff"]) * (taRate * 37.0 + (1.0 - taRate) * (daRate * 22.0 + (1.0 - daRate) * 10.0))

        var minimumTurn = Math.ceil( 100.0 / (37.0 * (buff["ougiGage"] + totals[key]["ougiGageBuff"] - totals[key]["ougiDebuff"])) )
        var expectedTurn = ((100.0 / expectedOugiGage) > minimumTurn) ? (100.0 / expectedOugiGage) : minimumTurn;

        // "additionalDamage"はノーマル枠として神石効果を考慮
        var additionalDamage = (0.01 * totals[key]["additionalDamage"] * totalSummon["zeus"] + totals[key]["additionalDamageBuff"] + buff["additionalDamage"])

        // damageは追加ダメージなしの単攻撃ダメージ(減衰・技巧補正あり)
        var damage = module.exports.calcDamage(criticalRatio * totalAttack, prof.enemyDefense, additionalDamage, damageUP)

        // クリティカル無しの場合のダメージを技巧期待値の補正に使う
        var damageWithoutCritical = module.exports.calcDamage(totalAttack, prof.enemyDefense, additionalDamage, damageUP)

        // 実質の技巧期待値
        var effectiveCriticalRatio = damage/damageWithoutCritical

        var ougiDamage = module.exports.calcOugiDamage(criticalRatio * totalAttack, prof.enemyDefense, prof.ougiRatio, totals[key]["ougiDamageBuff"], damageUP)

        var expectedCycleDamage = ougiDamage + expectedTurn * expectedAttack * damage
        var expectedCycleDamagePerTurn = expectedCycleDamage / (expectedTurn + 1.0)

        var nazo_number = parseInt(totalAttack * criticalRatio * expectedAttack)

        // 表示用配列
        var coeffs = {};
        coeffs["normal"] = normalCoeff;
        coeffs["normalHaisui"] = normalHaisuiCoeff;
        coeffs["normalKonshin"] = normalKonshinCoeff;
        coeffs["magna"] = magnaCoeff;
        coeffs["magnaHaisui"] = magnaHaisuiCoeff;
        coeffs["element"] = elementCoeff;
        coeffs["unknown"] = unknownCoeff;
        coeffs["unknownHaisui"] = unknownHaisuiCoeff;
        coeffs["charaHaisui"] = charaHaisuiCoeff;
        coeffs["other"] = otherCoeff;
        coeffs["ougiDamageBuff"] = totals[key]["ougiDamageBuff"];
        coeffs["hpRatio"] = hpCoeff
        coeffs["additionalDamage"] = additionalDamage
        coeffs["damageUP"] = damageUP

        // 連撃情報
        coeffs["normalDA"] = armDAupNormal
        coeffs["magnaDA"] = armDAupMagna
        coeffs["exDA"] = unknownOtherNite
        coeffs["cosmosDA"] = armDAupCosmos
        coeffs["bahaDA"] = armDAupBaha
        coeffs["otherDA"] = armDAupOther

        coeffs["normalTA"] = armTAupNormal
        coeffs["magnaTA"] = armTAupMagna
        coeffs["bahaTA"] = armTAupBaha
        coeffs["otherTA"] = armTAupOther

        res[key] = {
            totalAttack: Math.ceil(totalAttack),
            displayAttack: Math.ceil(summedAttack),
            totalHP: Math.round(totalHP),
            displayHP: Math.round(displayHP),
            remainHP: totals[key]["remainHP"],
            totalDA: totalDA,
            totalTA: totalTA,
            debuffResistance: totals[key]["debuffResistance"],
            totalSummon: totalSummon,
            element: totals[key]["element"],
            expectedAttack: expectedAttack,
            criticalAttack: criticalAttack,
            criticalRatio: criticalRatio,
            effectiveCriticalRatio: effectiveCriticalRatio,
            totalExpected: nazo_number,
            skilldata: coeffs,
            expectedOugiGage: expectedOugiGage,
            damage: damage * expectedAttack, // 技巧連撃
            pureDamage: damageWithoutCritical, // 純ダメージ
            damageWithCritical: damage, // 技巧のみ
            damageWithMultiple: damageWithoutCritical * expectedAttack, // 連撃のみ
            ougiDamage: ougiDamage,
            expectedTurn: expectedTurn,
            expectedCycleDamagePerTurn: expectedCycleDamagePerTurn
        };
    }
    var average = 0.0;
    var crit_average = 0.0;
    var totalExpected_average = 0.0;
    var averageCyclePerTurn = 0.0;

    var cnt = 0.0
    for(key in res) {
        if(totals[key]["isConsideredInAverage"]) {
            average += res[key].totalAttack
            crit_average += res[key].criticalAttack
            totalExpected_average += res[key].totalExpected
            averageCyclePerTurn += res[key].expectedCycleDamagePerTurn
            cnt += 1.0
        }
    }
    res["Djeeta"]["averageAttack"] = parseInt(average/cnt)
    res["Djeeta"]["averageCriticalAttack"] = parseInt(crit_average/cnt)
    res["Djeeta"]["averageTotalExpected"] = parseInt(totalExpected_average/cnt)
    res["Djeeta"]["averageCyclePerTurn"] = parseInt(averageCyclePerTurn/cnt)
    return res
};

module.exports.getTesukatoripokaAmount = function(amount, numOfRaces){
    if(amount != 100 && amount != 120) return 0;

    var resultAmount = 10;
    switch(numOfRaces){
        case 1:
            break;
        case 2:
            resultAmount = 30;
            break;
        case 3:
            resultAmount = 60;
            break;
        case 4:
            resultAmount = 100;
            break;
    }

    if(amount == 120){
        resultAmount += 20;
    }

    return resultAmount;
};

module.exports.checkNumberofRaces = function(chara){
    // check num of races
    var includedRaces = {
        "human": false,
        "erune": false,
        "doraf": false,
        "havin": false,
        "unknown": true,
    }
    // ジータがいるのでunknown枠は常にtrue
    // indの初期値も1からで良い
    var ind = 1;
    for(var key in chara) {
        if(chara[key].name != "" && chara[key].isConsideredInAverage) {
            if(ind < 4) {
                includedRaces[chara[key]["race"]] = true
            }
            ind++;
        }
    }

    var races = 0
    for(var key in includedRaces) {
        if(includedRaces[key]) races++;
    }
    return races
};

module.exports.calcHaisuiValue = function(haisuiType, haisuiAmount, haisuiSLv, haisuiRemainHP){
    var remainHP = haisuiRemainHP
    var baseRate = 0.0

    if(haisuiType == 'normalHaisui' || haisuiType == 'magnaHaisui' || haisuiType == 'unknownOtherHaisui' || haisuiType == "charaHaisui")
    {
        // 背水倍率の実装は日比野さんのところのを参照
        if(haisuiAmount == "S") {
            // 小
            if(haisuiSLv < 10) {
                baseRate = -0.3 + haisuiSLv * 1.8;
            } else {
                baseRate = 18 + 3.0 * ((haisuiSLv - 10) / 5.0)
            }
        } else if ( haisuiAmount == "M" ){
            // 中
            if(haisuiSLv < 10) {
                baseRate = -0.4 + haisuiSLv * 2.4;
            } else {
                baseRate = 24 + 6.0 * ((haisuiSLv - 10) / 5.0)
            }
        } else {
            // 大
            if(haisuiSLv < 10) {
                baseRate = -0.5 + haisuiSLv * 3.0;
            } else {
                baseRate = 30 + 7.5 * ((haisuiSLv - 10) / 5.0)
            }
        }
        return (baseRate/3.0) * ( 2.0 * remainHP * remainHP - 5.0 * remainHP + 3.0 )
    } else if(haisuiType == 'normalKonshin' || haisuiType == "magnaKonshin"){
        if(haisuiAmount == "S") {
        } else if ( haisuiAmount == "M" ){
        } else {
            if(haisuiSLv <= 10) {
                // baseRate = 5.0 + haisuiSLv * 0.8;
                baseRate = 0.0518 + 3.29e-3 * haisuiSLv
            } else {
                // baseRate = 20.0 + ((haisuiSLv - 10) * 0.6);
                // 11/24のアップデート、暫定対応
                baseRate = 0.0847 + (haisuiSLv - 10) * 6.58e-3
            }
        }
        if(remainHP >= 0.25) {
            // HP25%以下で打ち切りになる
            return 100.0 * (baseRate * Math.pow(remainHP + 0.0317, 3) + 0.0207)
        } else {
            return 0.0;
        }
    } else {
        console.error("Unknown Haisui Type Passed: " + haisuiType)
        return 0.0;
    }
};

module.exports.recalcCharaHaisui = function(chara, remainHP) {
    var charaHaisuiValue = 1.0;

    for(var ch = 0; ch < chara.length; ch++){
        if(chara[ch].name != "" && chara[ch].isConsideredInAverage) {
            for(var i = 0; i < 2; i++) {
                if(i == 0) {
                    if(chara[ch]["support"] == undefined) continue;
                    var support = supportAbilities[chara[ch]["support"]];
                } else {
                    if(chara[ch]["support2"] == undefined) continue;
                    var support = supportAbilities[chara[ch]["support2"]];
                }

                if(support.type == "none") continue;

                // 背水サポアビのみ処理
                switch(support.type){
                    case "taiyou_sinkou":
                        // ザルハメリナのHPを参照する
                        charaHaisuiValue += 0.01 * module.exports.calcHaisuiValue("charaHaisui", "L", 10, remainHP)
                        continue;
                        break;
                    default:
                        break;
                }
            }
        }
    }

    return charaHaisuiValue;
};

module.exports.getTotalBuff = function(prof) {
    var totalBuff = {master: 0.0, masterHP: 0.0, normal: 0.0, element: 0.0, other: 0.0, zenith1: 0.0, zenith2: 0.0, hp: 0.0, da: 0.0, ta: 0.0, ougiGage: 1.0, additionalDamage: 0.0};

    if(!isNaN(prof.masterBonus)) totalBuff["master"] += 0.01 * parseInt(prof.masterBonus);
    if(!isNaN(prof.masterBonusHP)) totalBuff["masterHP"] += 0.01 * parseInt(prof.masterBonusHP);
    if(!isNaN(prof.hpBuff)) totalBuff["hp"] += 0.01 * parseInt(prof.hpBuff);
    if(!isNaN(prof.daBuff)) totalBuff["da"] += 0.01 * parseFloat(prof.daBuff);
    if(!isNaN(prof.taBuff)) totalBuff["ta"] += 0.01 * parseFloat(prof.taBuff);
    if(!isNaN(prof.additionalDamageBuff)) totalBuff["additionalDamage"] += 0.01 * parseInt(prof.additionalDamageBuff);
    if(!isNaN(prof.ougiGageBuff)) totalBuff["ougiGage"] += 0.01 * parseInt(prof.ougiGageBuff);
    totalBuff["normal"] += 0.01 * parseInt(prof.normalBuff);
    totalBuff["element"] += 0.01 * parseInt(prof.elementBuff);
    totalBuff["other"] += 0.01 * parseInt(prof.otherBuff);
    totalBuff["zenith1"] += zenith[prof.zenithBonus1];
    totalBuff["zenith2"] += zenith[prof.zenithBonus2];

    return totalBuff
};

module.exports.addSkilldataToTotals = function(totals, comb, arml, buff) {
    // cosmos武器があるかどうかを確認しておく
    var cosmosType = '';
    for(var i = 0; i < arml.length; i++){
        if(comb[i] > 0) {
            var arm = arml[i];
            if(module.exports.isCosmos(arm)) {
                if(skilltypes[arm.skill1].type == "cosmosArm") {
                    cosmosType = skilltypes[arm.skill1].cosmosArm
                } else {
                    cosmosType = skilltypes[arm.skill2].cosmosArm
                }
            }
        }
    }

    var index = 0;
    for( key in totals ) {
        index = (index + 1)|0;
        var isBahaAtIncluded = false; var isBahaAthpIncluded = false; var isBahaHpIncluded = false;

        for(var i = 0; i < arml.length; i++){
            if(comb[i] == 0) continue

            var arm = arml[i];
            var armSup= 1.0
            var hpSup = 1.0

            if (arm.armType == cosmosType){
                armSup += 0.3
                hpSup += 0.3
            }

            if( key == "Djeeta" ) {
                // for Djeeta
                if(arm.armType == totals[key]["fav1"] && arm.armType == totals[key]["fav2"]){
                    armSup += (0.2 + buff["zenith1"] + buff["zenith2"])
                    hpSup += 0.2
                } else if(arm.armType == totals[key]["fav1"]){
                    armSup += (0.2 + buff["zenith1"])
                    hpSup += 0.2
                } else if(arm.armType == totals[key]["fav2"]){
                    armSup += (0.2 + buff["zenith2"])
                    hpSup += 0.2
                }
            } else {
                // for chara
                if(arm.armType == totals[key]["fav1"]){
                    armSup += 0.2
                } else if(arm.armType == totals[key]["fav2"]){
                    armSup += 0.2
                }
            }

            totals[key]["armAttack"] += armSup * parseInt(arm.attack) * comb[i]
            totals[key]["armHP"] += hpSup * parseInt(arm.hp) * comb[i]

            for(var j = 1; j <= 2; j++){
                var skillname = '';
                var element = ''; (arm.element == undefined) ? "fire" : arm.element
                if(j == 1) {
                    skillname = arm.skill1
                    element = (arm.element == undefined) ? "fire" : arm.element
                } else {
                    skillname = arm.skill2
                    element = (arm.element2 == undefined) ? "fire" : arm.element2
                }

                if(skillname != 'non'){
                    // 古いデータ用の対応
                    if(skillname == "bahaAT" || skillname == "bahaFUATHP") {
                        skillname += "-dagger"
                    } else if (skillname == "bahaATHP") {
                        skillname += "-sword"
                    }
                    var stype = skilltypes[skillname].type;
                    var amount = skilltypes[skillname].amount;
                    var slv = parseInt(arm.slv)

                    // mask invalid slv
                    if(slv == 0) slv = 1

                    // バハとコスモスは属性関係なし
                    if(stype == 'bahaAT') {
                        if(!isBahaAtIncluded) {
                            // バハ短剣など
                            if(totals[key]["race"] == "unknown") {
                                totals[key]["bahaAT"] += comb[i] * skillAmounts["bahaAT"][amount][slv - 1];
                                isBahaAtIncluded = true;
                            } else {
                                var bahatype = skillname.split("-")
                                if( bahamutRelation[bahatype[1]]["type1"] == totals[key]["race"] ) {
                                    totals[key]["bahaAT"] += comb[i] * skillAmounts["bahaAT"][amount][slv - 1];
                                    isBahaAtIncluded = true;
                                }
                            }
                        }
                    } else if(stype == 'bahaATHP') {
                        if(!isBahaAthpIncluded) {
                            // バハ剣など
                            if(totals[key]["race"] == "unknown") {
                                totals[key]["bahaAT"] += comb[i] * skillAmounts["bahaAT"][amount][slv - 1];
                                totals[key]["bahaHP"] += comb[i] * skillAmounts["bahaHP"][amount][slv - 1];
                                isBahaAthpIncluded = true;
                            } else {
                                var bahatype = skillname.split("-")
                                if( bahamutRelation[bahatype[1]]["type1"] == totals[key]["race"] || bahamutRelation[ bahatype[1]]["type2"] == totals[key]["race"] ) {
                                    totals[key]["bahaAT"] += comb[i] * skillAmounts["bahaAT"][amount][slv - 1];
                                    totals[key]["bahaHP"] += comb[i] * skillAmounts["bahaHP"][amount][slv - 1];
                                    isBahaAthpIncluded = true;
                                }
                            }
                        }
                    } else if(stype == 'bahaHP') {
                        if(!isBahaHpIncluded) {
                            // バハ拳など
                            if(totals[key]["race"] == "unknown") {
                                totals[key]["bahaHP"] += comb[i] * skillAmounts["bahaHP"][amount][slv - 1];
                                isBahaHpIncluded = true;
                            } else {
                                var bahatype = skillname.split("-")
                                if( bahamutRelation[bahatype[1]]["type1"] == totals[key]["race"] || bahamutRelation[ bahatype[1]]["type2"] == totals[key]["race"] ) {
                                    totals[key]["bahaHP"] += comb[i] * skillAmounts["bahaHP"][amount][slv - 1];
                                    isBahaHpIncluded = true;
                                }
                            }
                        }
                    } else if(stype == 'bahaFUATHP') {
                        if(totals[key]["race"] == "unknown") {
                            totals[key]["bahaAT"] += comb[i] * skillAmounts["bahaFUATHP"]["AT"][slv - 1];
                            totals[key]["bahaHP"] += comb[i] * skillAmounts["bahaFUATHP"]["HP"][slv - 1];
                        } else {
                            var bahatype = skillname.split("-")
                            if( bahamutFURelation[bahatype[1]]["type1"] == totals[key]["race"] || bahamutFURelation[ bahatype[1]]["type2"] == totals[key]["race"] ) {
                                totals[key]["bahaAT"] += comb[i] * skillAmounts["bahaFUATHP"]["AT"][slv - 1];
                                totals[key]["bahaHP"] += comb[i] * skillAmounts["bahaFUATHP"]["HP"][slv - 1];
                            }
                        }
                    } else if(stype == 'bahaFUHP') {
                        if(totals[key]["race"] == "unknown") {
                            totals[key]["bahaHP"] += comb[i] * skillAmounts["bahaFUHP"]["HP"][slv - 1];
                            totals[key]["bahaDA"] += comb[i] * skillAmounts["bahaFUHP"]["DA"][slv - 1];
                            totals[key]["bahaTA"] += comb[i] * skillAmounts["bahaFUHP"]["TA"][slv - 1];
                        } else {
                            var bahatype = skillname.split("-")
                            if( bahamutFURelation[bahatype[1]]["type1"] == totals[key]["race"] || bahamutFURelation[ bahatype[1]]["type2"] == totals[key]["race"] ) {
                                totals[key]["bahaHP"] += comb[i] * skillAmounts["bahaFUHP"]["HP"][slv - 1];
                                totals[key]["bahaDA"] += comb[i] * skillAmounts["bahaFUHP"]["DA"][slv - 1];
                                totals[key]["bahaTA"] += comb[i] * skillAmounts["bahaFUHP"]["TA"][slv - 1];
                            }
                        }
                    } else if(stype == 'cosmos') {
                        // コスモス武器
                        if(skillname == 'cosmosAT' && totals[key]["type"] == "attack") {
                            totals[key]["cosmosAT"] += comb[i] * 20.0;
                            totals[key]["HPdebuff"] += comb[i] * 0.40
                        } else if(skillname == 'cosmosDF' && totals[key]["type"] == "defense") {
                            totals[key]["HPdebuff"] -= comb[i] * 0.10
                        } else if(skillname == 'cosmosBL' && totals[key]["type"] == "balance") {
                            totals[key]["cosmosBL"] = comb[i] * 20.0
                        } else if(skillname == 'cosmosPC' && totals[key]["type"] == "pecu") {
                            totals[key]["debuffResistance"] = comb[i] * 20.0
                        }
                    } else if(stype == 'cosmosArm') {
                        // コスモス武器スキルはスキップ
                    } else if(totals[key]["element"] == element){
                        // 属性一致してれば計算
                        if(stype == 'normalHaisui' || stype == 'magnaHaisui' || stype == 'unknownOtherHaisui' || stype == 'normalKonshin'){
                            // 背水計算部分は別メソッドで
                            totals[key][stype] += comb[i] * module.exports.calcHaisuiValue(stype, amount, slv, totals[key]["remainHP"])
                        } else if(stype == 'normalKamui') {
                            totals[key]["normal"] += comb[i] * skillAmounts["normal"][amount][slv - 1];
                            totals[key]["normalHP"] += comb[i] * skillAmounts["normalHP"][amount][slv - 1];
                        } else if(stype == 'magnaKamui') {
                            totals[key]["magna"] += comb[i] * skillAmounts["magna"][amount][slv - 1];
                            totals[key]["magnaHP"] += comb[i] * skillAmounts["magnaHP"][amount][slv - 1];
                        } else if(stype == 'normalCritical') {
                            // 通常技巧は複数発動するので確率を加算しないで残しておく
                            for(var setu = 0; setu < comb[i]; setu++){
                                totals[key]["normalCritical"].push({"value": skillAmounts["normalCritical"][amount][slv - 1], "attackRatio": 0.5});
                            }
                        } else if(stype == 'normalSetsuna') {
                            for(var setu = 0; setu < comb[i]; setu++){
                                totals[key]["normalCritical"].push({"value": skillAmounts["normalCritical"][amount][slv - 1], "attackRatio": 0.5});
                            }
                            totals[key]["normal"] += comb[i] * skillAmounts["normal"][amount][slv - 1];
                        } else if(stype == 'magnaSetsuna') {
                            totals[key]["magnaCritical"] += comb[i] * skillAmounts["magnaCritical"][amount][slv - 1];
                            totals[key]["magna"] += comb[i] * skillAmounts["magna"][amount][slv - 1];
                        } else if(stype == 'normalKatsumi') {
                            for(var setu = 0; setu < comb[i]; setu++){
                                totals[key]["normalCritical"].push({"value": skillAmounts["normalCritical"][amount][slv - 1], "attackRatio": 0.5});
                            }
                            totals[key]["normalNite"] += comb[i] * skillAmounts["normalNite"][amount][slv - 1];
                        } else if(stype == 'magnaKatsumi') {
                            totals[key]["magnaCritical"] += comb[i] * skillAmounts["magnaCritical"][amount][slv - 1];
                            totals[key]["magnaNite"] += comb[i] * skillAmounts["magnaNite"][amount][slv - 1];
                        } else if(stype == 'normalKatsumoku') {
                            totals[key]["normalNite"] += comb[i] * skillAmounts["normalNite"][amount][slv - 1];
                        } else if(stype == 'magnaKatsumoku') {
                            totals[key]["magnaNite"] += comb[i] * skillAmounts["magnaNite"][amount][slv - 1];
                        } else if(stype == 'normalRasetsu') {
                            totals[key]["normal"] += comb[i] * skillAmounts["normal"][amount][slv - 1];
                            totals[key]["DAbuff"] -= comb[i] * 38.0;
                            totals[key]["TAbuff"] -= comb[i] * 38.0;
                        } else if(stype == 'magnaRasetsu') {
                            totals[key]["magna"] += comb[i] * skillAmounts["magna"][amount][slv - 1];
                            totals[key]["DAbuff"] -= comb[i] * 38.0;
                            totals[key]["TAbuff"] -= comb[i] * 38.0;
                        } else if(stype == 'normalBoukun') {
                            totals[key]["HPdebuff"] += comb[i] * 0.10
                            totals[key]["normal"] += comb[i] * skillAmounts["normal"][amount][slv - 1];
                        } else if(stype == 'magnaBoukun') {
                            totals[key]["HPdebuff"] += comb[i] * 0.10
                            totals[key]["magna"] += comb[i] * skillAmounts["magna"][amount][slv - 1];
                        } else if(stype == 'unknownOtherBoukun'){
                            totals[key]["HPdebuff"] += comb[i] * 0.07
                            totals[key]["unknown"] += comb[i] * skillAmounts["unknown"][amount][slv - 1];
                        } else if(stype == 'gurenJuin'){
                            if(index == 2){
                                totals[key]["normal"] += comb[i] * skillAmounts["normal"][amount][slv - 1];
                            }
                        } else if(stype == 'muhyoTuiga'){
                            if(index == 4){
                                totals[key]["additionalDamage"] += comb[i] * slv;
                                totals[key]["ougiDebuff"] += comb[i] * 0.30;
                            }
                        //! 四大天司の祝福
                        } else if(stype == 'tenshiShukufuku'){
                            if(amount == 'M') {
                                totals[key]["tenshiDamageUP"] += comb[i] * 0.10;
                            } else if (amount == 'L') {
                                totals[key]["tenshiDamageUP"] += comb[i] * 0.20;
                            }
                        //! 4凸武器スキル
                        } else if(stype == 'tsuranukiKiba'){
                            if(skillname == 'tsuranukiKibaMain'){
                                totals[key]["normalHP"] += comb[i] * skillAmounts["normalHP"][amount][slv - 1];
                                if(key == 'Djeeta') {
                                    for(var setu = 0; setu < comb[i]; setu++){
                                        totals[key]["normalCritical"].push({"value": skillAmounts["normalCritical"][amount][slv - 1], "attackRatio": 0.5});
                                    }
                                }
                            } else {
                                totals[key]["normalHP"] += comb[i] * skillAmounts["normalHP"][amount][slv - 1];

                            }
                        } else if(stype == 'washiouKekkai'){
                            if(key == 'Djeeta') totals[key]["DAbuff"] += comb[i] * skillAmounts["washiouKekkai"][amount][slv - 1];
                        } else {
                            totals[key][stype] += comb[i] * skillAmounts[stype][amount][slv - 1];
                        }
                    }
                }
            }
        }

        // バハ武器重複上限
        if(totals[key]["bahaAT"] > 50) totals[key]["bahaAT"] = 50
        if(totals[key]["bahaHP"] > 50) totals[key]["bahaHP"] = 50
    }
};

module.exports.getInitialTotals = function(prof, chara, summon) {
    var baseAttack = (prof.rank > 100) ? 5000 + (parseInt(prof.rank) - 100) * 20 : ((prof.rank > 1) ? 1000 + (parseInt(prof.rank)) * 40 : 1000)
    var baseHP = (prof.rank > 100) ? 1400 + (parseInt(prof.rank) - 100) * 4.0 : 600 + (parseInt(prof.rank)) * 8
    var element = (prof.element == undefined) ? "fire" : prof.element
    var djeetaRemainHP = (prof.remainHP != undefined && parseInt(prof.remainHP) < parseInt(prof.hp)) ? 0.01 * parseInt(prof.remainHP) : 0.01 * parseInt(prof.hp)
    var djeetaDA = (prof.DA == undefined) ? 6.5 : parseFloat(prof.DA)
    var djeetaTA = (prof.TA == undefined) ? 3.0 : parseFloat(prof.TA)
    var job = (prof.job == undefined) ? Jobs["none"] : Jobs[prof.job]
    var zenithATK = (prof.zenithAttackBonus == undefined) ? 3000 : parseInt(prof.zenithAttackBonus)
    var zenithHP = (prof.zenithHPBonus == undefined) ? 1000 : parseInt(prof.zenithHPBonus)
    var zenithPartyHP = (prof.zenithPartyHPBonus == undefined) ? 0 : parseInt(prof.zenithPartyHPBonus)
    var djeetaBuffList = {personalNormalBuff: 0.0, personalElementBuff: 0.0, personalOtherBuff: 0.0, personalDABuff: 0.0, personalTABuff: 0.0, personalOugiGageBuff: 0.0, personalAdditionalDamageBuff: 0.0}

    for(var djeetabuffkey in djeetaBuffList) {
        if (prof[djeetabuffkey] != undefined) {
            djeetaBuffList[djeetabuffkey] = 0.01 * parseFloat(prof[djeetabuffkey])
        }
    }

    var totals = {"Djeeta": {baseAttack: (baseAttack + zenithATK), baseHP: (baseHP + zenithPartyHP + zenithHP), baseDA: djeetaDA, baseTA: djeetaTA, remainHP: djeetaRemainHP, armAttack: 0, armHP:0, fav1: job.favArm1, fav2: job.favArm2, race: "unknown", type: job.type, element: element, HPdebuff: 0.00, magna: 0, magnaHaisui: 0, normal: 0, normalOther: 0, normalHaisui: 0, normalKonshin: 0, unknown: 0, unknownOther: 0, unknownOtherHaisui: 0, bahaAT: 0, bahaHP: 0, bahaDA: 0, bahaTA: 0, magnaHP: 0, normalHP: 0, unknownHP: 0, normalNite: 0, magnaNite: 0, normalSante: 0, magnaSante: 0, unknownOtherNite: 0, normalCritical: [], normalOtherCritical: [], magnaCritical: 0, cosmosAT: 0, cosmosBL: 0, additionalDamage: 0, ougiDebuff: 0, isConsideredInAverage: true, job: job, normalBuff: djeetaBuffList["personalNormalBuff"], elementBuff: djeetaBuffList["personalElementBuff"], otherBuff: djeetaBuffList["personalOtherBuff"], DABuff: djeetaBuffList["personalDABuff"], TABuff: djeetaBuffList["personalTABuff"], ougiGageBuff: djeetaBuffList["personalOugiGageBuff"], ougiDamageBuff: 0, additionalDamageBuff: djeetaBuffList["personalAdditionalDamageBuff"], DAbuff: 0, TAbuff: 0, support: "none", support2: "none", charaHaisui: 0, debuffResistance: 0, tenshiDamageUP: 0}};

    for(var i = 0; i < chara.length; i++){
        if(chara[i].name != "") {
            var charaelement = (chara[i].element == undefined) ? "fire" : chara[i].element
            var charaDA = (chara[i].DA == undefined) ? 6.5 : chara[i].DA
            var charaTA = (chara[i].TA == undefined) ? 3.0 : chara[i].TA
            var charaRemainHP = (chara[i].remainHP != undefined && parseInt(chara[i].remainHP) < parseInt(prof.hp)) ? 0.01 * parseInt(chara[i].remainHP) : 0.01 * parseInt(prof.hp)
            var charaConsidered = (chara[i].isConsideredInAverage == undefined) ? true : chara[i].isConsideredInAverage

            // key 重複対応
            var charakey = chara[i].name;
            var k = 1;
            while(charakey in totals) {
                charakey = chara[i].name + k
                k++;
            }

            var charaBuffList = {normalBuff: 0.0, elementBuff: 0.0, otherBuff: 0.0, daBuff: 0.0, taBuff: 0.0, ougiGageBuff: 0.0, additionalDamageBuff: 0.0}

            for(var charabuffkey in charaBuffList) {
                if (chara[i][charabuffkey] != undefined) {
                    charaBuffList[charabuffkey] = 0.01 * parseFloat(chara[i][charabuffkey])
                }
            }

            totals[charakey] = {baseAttack: parseInt(chara[i].attack), baseHP: parseInt(chara[i].hp) + zenithPartyHP, baseDA: parseFloat(charaDA), baseTA: parseFloat(charaTA), remainHP: charaRemainHP, armAttack: 0, armHP:0, fav1: chara[i].favArm, fav2: chara[i].favArm2, race: chara[i].race, type: chara[i].type, element: charaelement, HPdebuff: 0.00, magna: 0, magnaHaisui: 0, normal: 0, normalOther: 0,normalHaisui: 0, normalKonshin: 0, unknown: 0, unknownOther: 0, unknownOtherHaisui: 0, bahaAT: 0, bahaHP: 0, bahaDA: 0, bahaTA: 0, magnaHP: 0, normalHP: 0, unknownHP: 0, bahaHP: 0, normalNite: 0, magnaNite: 0, normalSante: 0, magnaSante: 0, unknownOtherNite: 0, normalCritical: [], normalOtherCritical: [], magnaCritical: 0, cosmosAT: 0, cosmosBL: 0, additionalDamage: 0, ougiDebuff: 0, isConsideredInAverage: charaConsidered, normalBuff: charaBuffList["normalBuff"], elementBuff: charaBuffList["elementBuff"], otherBuff: charaBuffList["otherBuff"], DABuff: charaBuffList["daBuff"], TABuff: charaBuffList["taBuff"], ougiGageBuff: charaBuffList["ougiGageBuff"], ougiDamageBuff: 0, additionalDamageBuff: charaBuffList["additionalDamageBuff"], DAbuff: 0, TAbuff: 0, support: chara[i].support, support2: chara[i].support2, charaHaisui: 0, debuffResistance: 0, tenshiDamageUP: 0}
        }
    }

    var races = module.exports.checkNumberofRaces(chara)
    for(var key in totals) {
        totals[key]["totalSummon"] = []
        for(var s = 0; s < summon.length; s++) {
            var selfElement = (summon[s].selfElement == undefined) ? "fire" : summon[s].selfElement
            var friendElement = (summon[s].friendElement == undefined) ? "fire" : summon[s].friendElement

            var totalSummon = {magna: 1.0, element: 1.0, elementTurn: 1.0, zeus: 1.0, chara: 0.0, ranko: 1.0, attack: 0, hp: 0.0, hpBonus: 0.0, da: 0, ta: 0};

            if((summonElementTypes[selfElement]["type"].indexOf(totals[key]["element"]) >= 0) || selfElement == "all" ){
                if(summon[s].selfSummonType == "odin") {
                    // odin(属性+キャラ攻撃)など、複数の場合の処理
                    totalSummon["element"] += 0.01 * parseInt(summon[s].selfSummonAmount)
                    totalSummon["chara"] += 0.01 * parseInt(summon[s].selfSummonAmount2)
                } else if(summon[s].selfSummonType == "elementByRace") {
                    totalSummon["element"] += 0.01 * module.exports.getTesukatoripokaAmount(parseInt(summon[s].selfSummonAmount), races)
                } else {
                    // 自分の加護 通常の場合
                    totalSummon[summon[s].selfSummonType] += 0.01 * parseInt(summon[s].selfSummonAmount)
                }
            }
            if((summonElementTypes[friendElement]["type"].indexOf(totals[key]["element"]) >= 0) || friendElement == "all" ){
                if(summon[s].friendSummonType == "odin") {
                    // odin(属性+キャラ攻撃)など、複数の場合の処理
                    totalSummon["element"] += 0.01 * parseInt(summon[s].friendSummonAmount)
                    totalSummon["chara"] += 0.01 * parseInt(summon[s].friendSummonAmount2)
                } else if(summon[s].friendSummonType == "elementByRace") {
                    totalSummon["element"] += 0.01 * module.exports.getTesukatoripokaAmount(parseInt(summon[s].friendSummonAmount), races)
                } else {
                    // フレンドの加護 通常の場合
                    totalSummon[summon[s].friendSummonType] += 0.01 * parseInt(summon[s].friendSummonAmount)
                }
            }

            // 後から追加したので NaN でないか判定しておく
            if(!isNaN(summon[s].attack)) totalSummon["attack"] = parseInt(summon[s].attack)
            if(!isNaN(summon[s].hp)) totalSummon["hp"] = parseInt(summon[s].hp)
            if(!isNaN(summon[s].hpBonus)) totalSummon["hpBonus"] = 0.01 * parseInt(summon[s].hpBonus)
            if(!isNaN(summon[s].DA)) totalSummon["da"] = 0.01 * parseInt(summon[s].DA)
            if(!isNaN(summon[s].TA)) totalSummon["ta"] = 0.01 * parseInt(summon[s].TA)

            totals[key]["totalSummon"][s] = totalSummon
        }
    }

    for(var key in totals){
        totals[key]["typeBonus"] = module.exports.getTypeBonus(totals[key]["element"], prof.enemyElement)
    }

    return totals
};

module.exports.initializeTotals = function(totals) {
    // 初期化
    // 武器編成によって変わらないものは除く
    for(key in totals){
        totals[key]["armAttack"] = 0; totals[key]["armHP"] = 0;
        totals[key]["HPdebuff"] = 0; totals[key]["magna"] = 0;
        totals[key]["magnaHaisui"] = 0; totals[key]["normal"] = 0;
        totals[key]["normalOther"] = 0;
        totals[key]["normalHaisui"] = 0; totals[key]["normalKonshin"] = 0;
        totals[key]["unknown"] = 0; totals[key]["unknownOther"] = 0;
        totals[key]["unknownOtherHaisui"] = 0; totals[key]["bahaAT"] = 0;
        totals[key]["bahaHP"] = 0; totals[key]["bahaDA"] = 0;
        totals[key]["bahaTA"] = 0; totals[key]["magnaHP"] = 0;
        totals[key]["normalHP"] = 0; totals[key]["unknownHP"] = 0;
        totals[key]["normalNite"] = 0; totals[key]["magnaNite"] = 0;
        totals[key]["normalSante"] = 0; totals[key]["magnaSante"] = 0;
        totals[key]["unknownOtherNite"] = 0;
        totals[key]["normalCritical"] = [];
        totals[key]["magnaCritical"] = 0;
        totals[key]["cosmosBL"] = 0; totals[key]["cosmosAT"] = 0;
        totals[key]["additionalDamage"] = 0; totals[key]["ougiDebuff"] = 0;
        totals[key]["DAbuff"] = 0; totals[key]["TAbuff"] = 0;
        totals[key]["debuffResistance"] = 0; totals[key]["tenshiDamageUP"] = 0;
    }
};

module.exports.calcOneCombination = function(comb, summon, prof, arml, totals, buff){
    module.exports.addSkilldataToTotals(totals, comb, arml, buff)
    var result = []
    for(var i = 0; i < summon.length; i++){
        // 攻撃などの結果を入れた連想配列の配列を作る
        result.push(module.exports.calcBasedOneSummon(i, prof, buff, totals));
    }

    return result
};

// totalsの内容をcharaのサポアビを反映したものに上書きする
module.exports.treatSupportAbility = function(totals, chara) {
    for(var key in totals){
        for(var i = 0; i < 2; i++) {
            if(i == 0) {
                if(totals[key]["support"] == undefined) continue;
                var support = supportAbilities[totals[key]["support"]];
            } else {
                if(totals[key]["support2"] == undefined) continue;
                var support = supportAbilities[totals[key]["support2"]];
            }

            if(support.type == "none") continue;

            // 特殊なサポアビの処理
            switch(support.type){
                case "normalBuff_doraf":
                    if(totals[key].isConsideredInAverage) {
                        // ドラフと種族不明のみキャラ攻刃
                        for(var key2 in totals){
                            if(totals[key2]["race"] == "doraf" || totals[key2]["race"] == "unknown") {
                                totals[key2]["normalBuff"] += support.value
                            }
                        }
                    } else {
                        // 平均に入れない場合は自分だけ計算
                        totals[key]["normalBuff"] += support.value
                    }
                    continue;
                    break;
                case "normalBuff_depends_races":
                    var races = module.exports.checkNumberofRaces(chara);
                    // 4種族なら50%, それ以外なら種族数*10%
                    totals[key]["normalBuff"] += (races == 4 ? 0.50 : races * 0.10);
                    continue;
                    break;
                case "normalBuff_depends_member":
                    continue;
                    break;
                case "taiyou_sinkou":
                    // ザルハメリナのHPを参照する
                    var charaHaisuiValue = module.exports.calcHaisuiValue("charaHaisui", "L", 10, totals[key]["remainHP"])
                    if(totals[key].isConsideredInAverage) {
                        for(var key2 in totals){
                            totals[key2]["charaHaisui"] += charaHaisuiValue
                        }
                    } else {
                        totals[key]["charaHaisui"] += charaHaisuiValue
                    }
                    continue;
                    break;
                default:
                    break;
            }

            // 技巧系処理
            if(support.type == "criticalBuff") {
                if(support.range == "own") {
                    totals[key]["normalOtherCritical"].push({"value": support.value, "attackRatio": support.attackRatio})
                } else {
                    if(totals[key].isConsideredInAverage) {
                        for(var key2 in totals){
                            totals[key2]["normalOtherCritical"].push({"value": support.value, "attackRatio": support.attackRatio})
                        }
                    } else {
                        totals[key]["normalOtherCritical"].push({"value": support.value, "attackRatio": support.attackRatio})
                    }
                }
                continue;
            }

            // 単純なバフ系の場合の処理
            if(support.range == "own") {
                totals[key][support.type] += support.value
            } else {
                // range == "all"
                // 平均に含める場合は全体に影響する
                if(totals[key].isConsideredInAverage) {
                    for(var key2 in totals){
                        totals[key2][support.type] += support.value
                    }
                } else {
                    totals[key][support.type] += support.value
                }
            }
        }
    }
};

module.exports.generateSimulationData = function(res, turnBuff, arml, summon, prof, buff, chara, storedCombinations) {
    var data = {}
    var minMaxArr = {
        "averageAttack": {"max": 0, "min": 0},
        "averageTotalExpected": {"max": 0, "min": 0},
        "expectedDamage": {"max": 0, "min": 0},
        "averageExpectedDamage": {"max": 0, "min": 0},
        "summedAverageExpectedDamage": {"max": 0, "min": 0},
    }
    var cnt = 1
    var considerAverageArray = {}
    for(var ch = 0; ch < chara.length; ch++) {
        var charaConsidered = (chara[ch].isConsideredInAverage == undefined) ? true : chara[ch].isConsideredInAverage
        if(charaConsidered && chara[ch].name != "") {
            cnt++;
            considerAverageArray[chara[ch].name] = true
        } else {
            considerAverageArray[chara[ch].name] = false
        }
    }

    if(res.length > 1) {
        var AllAverageTotalAttack = [["ターン"]];
        var AllAverageTotalExpected = [["ターン"]];
        var AllExpectedDamage = [["ターン"]];
        var AllAverageExpectedDamage = [["ターン"]];
        var AllSummedAverageExpectedDamage = [["ターン"]];

        for(var m = 1; m <= turnBuff.maxTurn; m++){
            AllAverageTotalAttack.push([m])
            AllAverageTotalExpected.push([m])
            AllExpectedDamage.push([m])
            AllAverageExpectedDamage.push([m])
            AllSummedAverageExpectedDamage.push([m])
        }
    }

    for(var s = 0; s < res.length; s++) {
        var oneresult = res[s]
        var summonHeader = ""
        if(summon[s].selfSummonType == "odin"){
            summonHeader += "属性攻" + summon[s].selfSummonAmount + "キャラ攻" + summon[s].selfSummonAmount2
        } else {
            summonHeader += summonElementTypes[summon[s].selfElement].name + summonTypes[summon[s].selfSummonType] + summon[s].selfSummonAmount
        }

        summonHeader += " + "
        if(summon[s].friendSummonType == "odin"){
            summonHeader += "属性攻" + summon[s].friendSummonAmount + "キャラ攻" + summon[s].friendSummonAmount2
        } else {
            summonHeader += summonElementTypes[summon[s].friendElement].name + summonTypes[summon[s].friendSummonType] + summon[s].friendSummonAmount
        }
        var AverageTotalAttack = [["ターン"]];
        var AverageTotalExpected = [["ターン"]];
        var ExpectedDamage = [["ターン"]];
        var AverageExpectedDamage = [["ターン"]];
        var SummedAverageExpectedDamage = [["ターン"]];

        for(var m = 1; m <= turnBuff.maxTurn; m++){
            AverageTotalAttack.push([m])
            AverageTotalExpected.push([m])
            ExpectedDamage.push([m])
            AverageExpectedDamage.push([m])
            SummedAverageExpectedDamage.push([m])

            for(var j = 0; j < oneresult[0].length; j++) {
                AverageExpectedDamage[m].push(0)
                SummedAverageExpectedDamage[m].push(0)
            }
        }

        for(var t = 1; t <= turnBuff.maxTurn; t++){
            var turndata = oneresult[t - 1]
            for(var j = 0; j < turndata.length; j++){
                var onedata = turndata[j].data

                AverageTotalAttack[t].push( onedata["Djeeta"].averageAttack )
                AverageTotalExpected[t].push( onedata["Djeeta"].averageTotalExpected )

                for(key in onedata) {
                    if(turnBuff.buffs["全体バフ"][t-1].turnType == "ougi" || turnBuff.buffs[key][t-1].turnType == "ougi") {
                        // 基本的に奥義の設定が優先
                        var newOugiDamage = module.exports.calcOugiDamage(onedata[key].criticalRatio * onedata[key].totalAttack, prof.enemyDefense, prof.ougiRatio, onedata[key].skilldata.ougiDamageBuff, onedata[key].skilldata.damageUP)

                        if(key == "Djeeta") {
                            ExpectedDamage[t].push( parseInt(newOugiDamage) )
                            AverageExpectedDamage[t][j + 1] += parseInt(newOugiDamage/cnt)
                        } else if(considerAverageArray[key]) {
                            AverageExpectedDamage[t][j + 1] += parseInt(newOugiDamage/cnt)
                        }

                    } else if(turnBuff.buffs["全体バフ"][t-1].turnType == "ougiNoDamage" || turnBuff.buffs[key][t-1].turnType == "ougiNoDamage") {
                        // しコルワ
                        if(key == "Djeeta") {
                            ExpectedDamage[t].push(0)
                        }
                    } else {
                        // 通常攻撃
                        var newDamage = module.exports.calcDamage(onedata[key].criticalRatio * onedata[key].totalAttack, prof.enemyDefense, onedata[key].skilldata.additionalDamage, onedata[key].skilldata.damageUP)
                        if(key == "Djeeta") {
                            ExpectedDamage[t].push( parseInt(newDamage * onedata[key].expectedAttack) )
                            AverageExpectedDamage[t][j + 1] += parseInt(onedata[key].expectedAttack * newDamage/cnt)
                        } else if(considerAverageArray[key]) {
                            AverageExpectedDamage[t][j + 1] += parseInt(onedata[key].expectedAttack * newDamage/cnt)
                        }
                    }
                }

                if(t == 1) {
                    var title = "No. " + (j+1).toString() + ":"
                    for(var i=0; i < arml.length; i++){
                        if(storedCombinations[j][i] > 0) {
                            var name = (arml[i].name == "") ? "武器(" + i.toString() + ")" : arml[i].name
                            title += name + storedCombinations[j][i] + "本\n"
                        }
                    }
                    AverageTotalAttack[0].push(title)
                    AverageTotalExpected[0].push(title)
                    ExpectedDamage[0].push(title)
                    AverageExpectedDamage[0].push(title)
                    SummedAverageExpectedDamage[0].push(title)

                    // 召喚石2組以上の場合
                    if(res.length > 1) {
                        AllAverageTotalAttack[0].push("(" + summonHeader + ")" + title)
                        AllAverageTotalExpected[0].push("(" + summonHeader + ")" + title)
                        AllExpectedDamage[0].push("(" + summonHeader + ")" + title)
                        AllAverageExpectedDamage[0].push("(" + summonHeader + ")" + title)
                        AllSummedAverageExpectedDamage[0].push("(" + summonHeader + ")" + title)
                    }
                    SummedAverageExpectedDamage[t][j + 1] = AverageExpectedDamage[t][j + 1]
                } else {
                    SummedAverageExpectedDamage[t][j + 1] = SummedAverageExpectedDamage[t - 1][j + 1] + AverageExpectedDamage[t][j + 1]
                }

                if(res.length > 1) {
                    AllAverageTotalAttack[t].push(AverageTotalAttack[t][j + 1])
                    AllAverageTotalExpected[t].push(AverageTotalExpected[t][j + 1])
                    AllExpectedDamage[t].push(ExpectedDamage[t][j + 1])
                    AllAverageExpectedDamage[t].push(AverageExpectedDamage[t][j + 1])
                    AllSummedAverageExpectedDamage[t].push(SummedAverageExpectedDamage[t][j + 1])
                }
            }
        }

        data[summonHeader] = {}
        data[summonHeader]["averageAttack"] = AverageTotalAttack
        data[summonHeader]["averageTotalExpected"] = AverageTotalExpected
        data[summonHeader]["expectedDamage"] = ExpectedDamage
        data[summonHeader]["averageExpectedDamage"] = AverageExpectedDamage
        data[summonHeader]["summedAverageExpectedDamage"] = SummedAverageExpectedDamage
    }

    if(res.length > 1){
        data["まとめて比較"] = {}
        data["まとめて比較"]["averageAttack"] = AllAverageTotalAttack
        data["まとめて比較"]["averageTotalExpected"] = AllAverageTotalExpected
        data["まとめて比較"]["expectedDamage"] = AllExpectedDamage
        data["まとめて比較"]["averageExpectedDamage"] = AllAverageExpectedDamage
        data["まとめて比較"]["summedAverageExpectedDamage"] = AllSummedAverageExpectedDamage
    }

    // グラフ最大値最小値を抽出
    for(key in minMaxArr) {
        for(summonkey in data) {
            for(var k = 1; k <= turnBuff.maxTurn; k++){
                for(var j = 1; j <= res[0][0].length; j++){
                    // グラフ最大値最小値を保存
                    if(data[summonkey][key][k][j] > minMaxArr[key]["max"]) minMaxArr[key]["max"] = data[summonkey][key][k][j]
                    if(data[summonkey][key][k][j] < minMaxArr[key]["min"] || minMaxArr[key]["min"] == 0) minMaxArr[key]["min"] = data[summonkey][key][k][j]
                }
            }
        }
    }

    data["minMaxArr"] = minMaxArr
    return data
};