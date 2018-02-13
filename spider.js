let util = require('util');
let query = require('./query.js');
let server = require('./server.js');
let cookie = require("./cookie.js")
let cookieObj = {};



module.exports={
    doAsync:function(hisID, container){
        console.log("spider working: HIS ID = " + hisID);
    },
    setCookie:function(cookieInput){
        cookieObj = cookieInput;    
    }
}

