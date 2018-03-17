"use strict";
let fs = require('fs');

let sign = require("./sign.js")
let spider = require("./spider.js");
let gs = require('./global-setting.js');
let util = require('./my-util.js');
let patient = require('./patient.js');

gs.checkDir();

//---genrate patient list---
let hisIDList = [];

if (!fs.existsSync(gs.commonDir + "\\unique-patient-list.json")) {
    var patientList = fs.readFileSync(gs.commonDir + "\\2013-2017list.txt", "utf8").split('\n').map(x => {
        var match = x.match(/^\d{7,8}/);
        return match && match[0];
    }).filter(x => x);
    hisIDList = patientList.filter((value, index, self) => { return self.indexOf(value) === index; });
    fs.writeFileSync(gs.commonDir + "\\unique-patient-list.json", JSON.stringify(hisIDList));
} else {
    hisIDList = JSON.parse(fs.readFileSync(gs.commonDir + "\\unique-patient-list.json", "utf8"));
}
var exsistedPatient = fs.readdirSync(gs.patientDataDir, (err, files) => { }).map(x => x.split('_')[0])

var todoList = [];

hisIDList.forEach((element) => {
    if (exsistedPatient.indexOf(element) < 0) {
        todoList.push(element);
    }
});

// todoList=[39676603]; //test
//-----download & parse
Promise.resolve()
    .then(() => {
        var reduced = todoList.reduce((promise, current) => {
            return promise
            .then(() => {
                return download([current]);
            })
            .then(() => {
                return patient.createPatient([current]);
            })
        }, Promise.resolve())

        return reduced;
    })
    .then(function () {
        console.log('End of Program.');
    });
///------


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
            }).then(() => { resolve() })
    });
}

