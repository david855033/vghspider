"use strict";

let sign = require("./sign.js")
let spider = require("./spider.js");

let hisID = ['44476882','44353200'];

var promise = sign.signInAsync("DOC3924B","999999")
.then(function(){
    console.log('sign in ok.');
}).then(function(){
    return hisID.reduce((promise,current)=>{
        return promise.then(()=>{
            return spider.doAsync(current);
        });
    }, Promise.resolve());
}).then(function(){
    console.log('End of Program.');
});
