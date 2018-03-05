"use strict";

let sign = require("./sign.js")
let spider = require("./spider.js");

let hisID = '44345779';

var promise = sign.signInAsync("DOC3924B","999999")
.then(function(){
    console.log('sign in ok.');
}).then(function(){
    return spider.doAsync(hisID);
}).then(function(){
    console.log('End of Program.');
});
