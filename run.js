"use strict";

let sign = require("./sign.js")
let spider = require("./spider.js");

let cookieObj = {};

let hisID = '44345600';

var promise = sign.signInAsync(cookieObj, "DOC3924B","999999")
.then(function(){
    console.log('sign in ok.');
    spider.setCookie(cookieObj);
}).then(function(){
    let dataContainer={};
    return spider.doAsync(hisID, dataContainer);
});
