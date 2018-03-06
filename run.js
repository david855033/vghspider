"use strict";
let fs = require('fs');
let sign = require("./sign.js")
let spider = require("./spider.js");
let gs = require('./global-setting.js');
let hisIDList = ['44572001'].map(x => x.trim());

//---control zone---
    //download(hisIDList) ;
    createPatient(hisIDList);
///------
function createPatient(hisIDList) {
    return hisIDList.reduce((promise, current) => {
        return promise.then(() => {
            console.log('generate patient from raw data: ' + current);
            var patientRawDataPath = gs.rawDataDir + "\\" + current;
            var patientDataPath = gs.patientDataDir + "\\" + current + '.json';
            var newPatient = {};
            var files = fs.readdirSync(patientRawDataPath).filter(x => x.match(/\.json$/));

            files.forEach(file => {
                var jsonFilePath = patientRawDataPath + "\\" + file;
                var content = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
                var dataStructure = file.replace("_" + current, '').replace('.json', '');
                var splitted = dataStructure.split('_');
                var dataType = splitted[0];
                if (dataType == "admissionNote" || dataType == "dischargeNote"|| dataType == "erNote"|| dataType == "progressNote") {
                    newPatient[dataType] || (newPatient[dataType] = []);
                    newPatient[dataType].push({
                        caseno: splitted[1],
                        admissionDate: splitted[2],
                        content: content.value,
                        lastUpdate: content.lastUpdate
                    })
                } else if (dataType == "birthSheet") {
                    newPatient[dataType] || (newPatient[dataType] = {});
                    newPatient[dataType] = content;
                } else if (dataType == "consultationReply") {
                    newPatient[dataType] || (newPatient[dataType] = []);
                    newPatient[dataType].push({
                        caseno: splitted[1],
                        seq: splitted[2],
                        content: content.value,
                        lastUpdate: content.lastUpdate
                    })
                } else if (dataType == "cummulative") {
                    newPatient[dataType] || (newPatient[dataType] = {});
                    newPatient[dataType][splitted[2]] || (newPatient[dataType][splitted[2]] = []);
                    newPatient[dataType][splitted[2]].push({
                        year: splitted[1],
                        data: content.data,
                        colNames: content.colNames,
                        lastUpdate: content.lastUpdate
                    })
                } else if (dataType == "flowSheet") {
                    newPatient[dataType] || (newPatient[dataType] = []);
                    var container = newPatient[dataType].filter(x=>x.caseno==splitted[1]);
                    if(container){container=container[0]}else{container={caseno:splitted[1]}}
                    var lastUpdate=content.lastUpdate;
                    delete content[lastUpdate];
                    container.push({
                        date: splitted[2],
                        content: content,
                        lastUpdate: lastUpdate
                    })
                } else {
                    newPatient[dataStructure] = content;
                }
            });
            fs.writeFileSync(patientDataPath, JSON.stringify(newPatient));
        })
    }, Promise.resolve());
}

function download(hisIDList) {
    return new Promise((resolve) => {
        sign.signInAsync("DOC3924B", "999999")
            .then(function () {
                console.log('sign in ok.');
            }).then(function () {
                return hisIDList.reduce((promise, current) => {
                    return promise.then(() => {
                        return spider.doAsync(current);
                    });
                }, Promise.resolve());
            }).then(function () {
                console.log('End of Program.');
            }).then(() => { resolve() })
    });
}
