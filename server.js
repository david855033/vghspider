
let request=require("request");
let query = require('./query.js').queryToServerRequest;
let cookie = require('./cookie.js');
let util = require('./my-util.js');
let parser=require('./html-parser.js');
let gs=require('./global-setting.js');
module.exports={
    defaulOption:function(){
        this.url="https://web9.vghtpe.gov.tw/";
        this.rejectUnauthorized= false;
        this.headers={
            "Connection": "keep-alive",
            "Cache-Control": "max-age=0",
            "Upgrade-Insecure-Requests": "1",
            "User-Agent": "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "zh-TW,zh;q=0.8,en-US;q=0.6,en;q=0.4"
        }
    },
    requestAsync:function(q, passResult){
        return new Promise((resolve,reject)=>{
                var serverRequest = query(q);
                console.log("request action: " + serverRequest.query);
                var option = new this.defaulOption();
                option.headers={
                    'Cookie':  cookie.cookieObj.combinedString
                }
                option.url=serverRequest.url;

                serverRequest.method && (option.method=serverRequest.method);
                serverRequest.form && (option.form=serverRequest.form);
                serverRequest.body && (option.body=serverRequest.body);
             
                request(option, function(error,response,body) {
                    cookie.storeFromArray(response.headers['set-cookie']);
                    passResult||(passResult={});
                    passResult.value=body;
                    passResult.query=q;
                    serverRequest.parser&&(passResult.parsed=parser[serverRequest.parser](passResult.value));
                    resolve(passResult);
                });     
        })
    }
}