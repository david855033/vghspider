let util = require('util');
let fs = require("fs");
let query = require('./query.js');
let server = require('./server.js');
let cookie = require("./cookie.js")

module.exports={
    doAsync:function(hisID, container){
        return new Promise((resolve,reject)=>{
            var serverRequest = query.queryToServerRequest("preSelectPatient_44427114");
            console.log("action: " + serverRequest.query);
            server.requestAsync(serverRequest)
            .then((value)=>{
                console.log(value.slice(0,50));
                resolve();
            });
        })
    }
}

