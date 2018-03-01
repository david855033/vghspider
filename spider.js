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

                .then((result) => {
                    return FetchAndWrite("admissionList" + "_" + hisID, hisID, result)
                })
                .then((result) => {
                    return FetchAndWrite("patientData" + "_" + hisID, hisID, result)
                })
                .then((result) => {
                    return FetchAndWrite("changeBedSection" + "_" + hisID, hisID, result)
                })
                .then((result) => {
                    return FetchAndWrite("consultation" + "_" + hisID, hisID, result)
                })

                .then(() => { resolve(); });

        })
    }
}

var FetchAndWrite = function (qString, hisID, passResult) {
    return new Promise((resolve) => {
        server.requestAsync(qString, passResult)
            .then(() => {
                return new Promise((resolve2) => { writeToFile(hisID, passResult, resolve); })
            })
    });
}

let writeToFile = function (hisID, result, resolve) {
    checkDir(hisID);
    var filepath = dataDir + "\\" + hisID + "\\" + result.query + ".txt";
    var filepathParsed = dataDir + "\\" + hisID + "\\" + result.query + ".json";
    console.log(" >> write to file: " + filepath);

    var content = "[fetch time:" + new Date().getShortDateTime() + "]\r\n" + result.value;
    fs.writeFile(filepath, content, function (err) {
        if (err) { console.log(err); }
        result.value = "";
        result.query = "";
        if (result.parsed) {
            parsedContent = JSON.stringify(result.parsed);
            fs.writeFile(filepathParsed, parsedContent, function (err) {
                result.parsed = "";
                resolve(result);
            })
        } else { 
            resolve(result)
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