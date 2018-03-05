let util = require('util');
let fs = require("fs");
let server = require('./server.js');
let cookie = require("./cookie.js")
let parser = require("./html-parser.js");

let dataDir = "D:\\spiderdata";



module.exports = {
    doAsync: function (hisID) {
        return new Promise((resolve, reject) => {

            server.requestAsync("preSelectPatient" + "_" + hisID)
                //住院清單
                .then((passResult) => {
                    return FetchWriteAsync("admissionList" + "_" + hisID, hisID, passResult)
                }).then((passResult) => {
                    passResult.admissionList = passResult.saved;
                    return new Promise((resolve) => { resolve(passResult) });
                })
                /*
                    //基本資料
                    .then((passResult) => {
                        return FetchWriteAsync("patientData" + "_" + hisID, hisID, passResult)
                    })
                    .then((passResult) => {
                        return FetchWriteAsync("changeBedSection" + "_" + hisID, hisID, passResult)
                    })
                    .then((passResult) => {
                        return FetchWriteAsync("consultation" + "_" + hisID, hisID, passResult)
                    })
                    .then((passResult) => {
                        var consultList = passResult.saved;
                        var reduced = consultList.reduce((promise, current) => {
                            var query = "consultationReply" + "_" + hisID + "_" + current.caseNo + "_" + current.oseq;
                            return promise.then((passResult) => {
                                return FetchWriteAsync(query, hisID, passResult);
                            })
                        }, Promise.resolve(passResult));
                        return reduced;
                    })
    
                    .then((passResult) => {
                        return FetchWriteAsync("consultationPending" + "_" + hisID, hisID, passResult);
                    })
                    .then((passResult) => {
                        return FetchWriteAsync("surgery" + "_" + hisID, hisID, passResult);
                    })
                    .then((passResult) => {
                        return FetchWriteAsync("order" + "_" + hisID + "_" + 3600, hisID, passResult);
                    })
                    .then((passResult) => {
                        return FetchWriteAsync("report" + "_" + hisID + "_" + 96, hisID, passResult);
                    })
                    .then((passResult) => {
                        var orderList = passResult.saved;
                        var reduced = orderList.reduce((promise, current) => {
                            var query = "reportContent" + "_" + hisID + "_" + current.partNo + "_" + current.caseNo + "_" + current.orderSeq;
                            return promise.then((passResult) => {
                                return FetchWriteAsync(query, hisID, passResult);
                            })
                        }, Promise.resolve(passResult));
                        return reduced;
                    })
                    .then((passResult) => {
                        var cummList = [];
                        ['DGLU1'].forEach(x => {
                            [24, 2016, 2015, 2014, 2013, 2012].forEach(y => {
                                cummList.push({ col: x, year: y });
                            })
                        })
                        var reduced = cummList.reduce((promise, current) => {
                            var query = "cummulative" + "_" + hisID + "_" + current.year + "_" + current.col;
                            return promise.then((passResult) => {
                                return FetchWriteAsync(query, hisID, passResult);
                            })
                        }, Promise.resolve(passResult));
                        return reduced;
                    })
                    .then((passResult) => {
                        var vitalsignList = ['HWS', 'BPP', 'IO', 'TMP', 'RSP', 'OXY'];
                        var reduced = vitalsignList.reduce((promise, current) => {
                            var query = "vitalSign" + "_" + hisID + "_" + "all" + "_" + current;
                            return promise.then((passResult) => {
                                return FetchWriteAsync(query, hisID, passResult);
                            })
                        }, Promise.resolve(passResult));
                        return reduced;
                    })
                    .then((passResult) => {
                        var admissionList = passResult.admissionList || [];
                        var reduced = admissionList.reduce((promise, current) => {
                            var query = "treatment" + "_" + hisID + "_" + current.caseNo;
                            return promise.then((passResult) => {
                                return FetchWriteAsync(query, hisID, passResult);
                            })
                        }, Promise.resolve(passResult));
                        return reduced;
                    })
                    .then((passResult) => {
                        var admissionList = passResult.admissionList || [];
                        var reduced = admissionList.reduce((promise, current) => {
                            var query = "transfusion" + "_" + hisID + "_" + current.caseNo;
                            return promise.then((passResult) => {
                                return FetchWriteAsync(query, hisID, passResult);
                            })
                        }, Promise.resolve(passResult));
                        return reduced;
                    })
    
                    .then((passResult) => {
                        var admissionList = passResult.admissionList || [];
                        var reduced = admissionList.reduce((promise, current) => {
                            var query = "medication" + "_" + hisID + "_" + current.caseNo;
                            return promise.then((passResult) => {
                                return FetchWriteAsync(query, hisID, passResult);
                            }).then((passResult) => {
                                //儲存order Seq
                                passResult.admissionListOdrseqMap = passResult.admissionListOdrseqMap || [];
                                passResult.saved.filter(x => x.seq).map(x => x.seq).forEach(x => {
                                    passResult.admissionListOdrseqMap.push({
                                        caseNo: current.caseNo,
                                        odrseq: x
                                    });
                                });
                                return new Promise((resolve) => { resolve(passResult) });
                            })
                        }, Promise.resolve(passResult));
                        return reduced;
                    })
                    .then((passResult) => {
                        var odrseqMap = passResult.admissionListOdrseqMap || [];
                        var reduced = odrseqMap.reduce((promise, current) => {
                            var query = "medicationInfo" + "_" + current.caseNo + "_" + current.odrseq;
                            return promise.then((passResult) => {
                                return FetchWriteAsync(query, hisID, passResult);
                            })
                        }, Promise.resolve(passResult));
                        return reduced;
                    })
                    .then((passResult) => {
                        var admissionList = passResult.admissionList || [];
                        var list = admissionList.filter(x => x.caseNo[0] != "G");
                        var reduced = list.reduce((promise, current) => {
                            var query = "admissionNote" + "_" + hisID + "_" + current.caseNo + "_" + current.admissionDate.replace(/-/g, '');
                            return promise.then((passResult) => {
                                return FetchWriteAsync(query, hisID, passResult);
                            })
                        }, Promise.resolve(passResult));
                        return reduced;
                    })
                    .then((passResult) => {
                        var admissionList = passResult.admissionList || [];
                        var list = admissionList.filter(x => x.caseNo[0] != "G");
                        var reduced = list.reduce((promise, current) => {
                            var query = "dischargeNote" + "_" + hisID + "_" + current.caseNo + "_" + current.admissionDate.replace(/-/g, '');
                            return promise.then((passResult) => {
                                return FetchWriteAsync(query, hisID, passResult);
                            })
                        }, Promise.resolve(passResult));
                        return reduced;
                    })
                    .then((passResult) => {
                        var admissionList = passResult.admissionList || [];
                        var list = admissionList.filter(x => x.caseNo[0] != "G");
                        var reduced = list.reduce((promise, current) => {
                            var query = "progressNote" + "_" + hisID + "_" + current.caseNo + "_" + current.admissionDate.replace(/-/g, '').slice(3, 6);
                            return promise.then((passResult) => {
                                return FetchWriteAsync(query, hisID, passResult);
                            })
                        }, Promise.resolve(passResult));
                        return reduced;
                    })
                    */
                .then((passResult) => {
                    var admissionList = passResult.admissionList || [];
                    var list = admissionList.filter(x => x.caseNo[0] != "G");
                    if(list[0]){
                        var query = "preSelectBirthSheet" + "_" + hisID + "_" + list[0].caseNo;
                        return Promise.resolve(passResult).then((passResult) => {
                            return FetchWriteAsync(query, hisID, passResult);
                        }).then((passResult) => {
                            var saved = passResult.saved;
                            var queryBirthSheet = "birthSheet" + "_" + saved.caseno + "_" + saved.histno + "_" + saved['struts.token.name'] + "_" + saved.token;
                            return FetchWriteAsync(queryBirthSheet, hisID, passResult);
                        })
                    }else{
                        return Promise.resolve(passResult);
                    }
                })
                .then(() => {
                    resolve();
                })

        })
    }
}

var promiseReducer = function (promise, item) {
    return promise.then((result) => {
        return currentValue
    })
}

var FetchWriteAsync = function (qString, hisID, passResult) {
    return new Promise((resolve) => {
        server.requestAsync(qString, passResult)
            .then((passResult) => { writeToFile(hisID, passResult, resolve) })
    })
}

//會寫入html及parsed之JSON檔案if there is one, 成功後呼叫resolve
let writeToFile = function (hisID, passResult, resolve) {
    checkDir(hisID);
    splitedQuery = passResult.query.split('_');
    if (splitedQuery[0] == 'birthSheet') {
        passResult.query = splitedQuery[0] + "_" + splitedQuery[1] + "_" + splitedQuery[2];
    }
    var filepath = dataDir + "\\" + hisID + "\\" + passResult.query + ".html";
    var filepathParsed = dataDir + "\\" + hisID + "\\" + passResult.query + ".json";

    var content = "[fetch time:" + new Date().getShortDateTime() + "]\r\n" + passResult.value;
    fs.writeFile(filepath, content, function (err) {
        if (err) { console.log(err); }
        console.log(" >> write to file: " + filepath);
        passResult.value = "";
        passResult.query = "";
        if (passResult.parsed) {
            parsedContent = JSON.stringify(passResult.parsed);
            fs.writeFile(filepathParsed, parsedContent, function (err) {
                console.log(" >> parse to file: " + filepathParsed);
                passResult.saved = passResult.parsed;
                passResult.parsed = {};
                resolve(passResult);
            })
        } else {
            resolve(passResult)
        }
    })
}


Date.prototype.getShortDateTime = function () {
    return this.getFullYear() +
        "/" + pad((this.getMonth() + 1), 2) +
        "/" + pad(this.getDate(), 2) +
        " " + pad(this.getHours(), 2) +
        ":" + pad(this.getMinutes(), 2) +
        ":" + pad(this.getSeconds(), 2);
}

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function checkDir(hisID) {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
    if (!fs.existsSync(dataDir + "\\" + hisID)) {
        fs.mkdirSync(dataDir + "\\" + hisID);
    }
}