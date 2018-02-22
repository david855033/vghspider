let request = require("request");
let util = require('util')

let cookie = require("./cookie.js")
let server = require("./server.js")

module.exports={
    signInAsync:function(account, password){
        let option = new server.defaulOption();
            option.url= "https://web9.vghtpe.gov.tw/Signon/lockaccount";
            option.method= "POST";
            option.form={j_username:account,j_password:password};

        return new Promise((resolve, reject) => {                  
            request(option, function(error,response,body) {
                cookie.storeFromArray(response.headers['set-cookie']);
                resolve();
            });             
        });
    }
}