let util = require('util');
let url = require('./url.js');


module.exports={
    doAsync:function(hisID, container){
        console.log("spider working: ID = " + hisID);
        console.log("having cookie: "+ util.inspect(cookieObj));
    },
    setCookie:function(cookieInput){
        cookieObj = cookieInput;    
    }
}

var cookieObj ={};

