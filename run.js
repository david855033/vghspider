"use strict";
let fs = require('fs');
let sign = require("./sign.js")
let spider = require("./spider.js");
let gs = require('./global-setting.js');
let util = require('./my-util.js');
let patient =require('./patient.js');

gs.checkDir();

//---control zone---
let hisIDList = ['44572001'].map(x => x.trim());
Promise.resolve()
    // .then(()=>{
    //     return download(hisIDList);
    // })
    .then(() => {
        return patient.createPatient(hisIDList);
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

