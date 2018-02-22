"use strict";

let sign = require("./sign.js")
let spider = require("./spider.js");

let hisID = '44345600';

var promise = sign.signInAsync("DOC3924B","999999")
.then(function(){
    console.log('sign in ok.');
}).then(function(){
    let dataContainer={}; 
    return spider.doAsync(hisID, dataContainer);
}).then(function(){
    console.log('last');
});
