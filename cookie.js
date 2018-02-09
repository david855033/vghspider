
var getKeyValuePairsFromCookieArray=function(cookieArray){
    var keyValuePairs={};
    cookieArray.forEach(function(item){
        var firstPart=item.split(';')[0];
        var split = firstPart.split('=');
        var key = split[0].trim();
        var value = split[1].trim();
        keyValuePairs[key]=value;
    })
    return keyValuePairs;
}
var getKeyValuePairsFromCookieString=function(cookieString){
    var keyValuePairs={};
    cookieString&&cookieString.split(';')
        .forEach(function(x){
            var parts=x.split('=');
            var key=parts.shift();
            var value=parts.join('=');
            keyValuePairs[key.trim()]=value.trim();
        });
    return keyValuePairs; 
}
var getCookieStringFromKeyValuePairs=function(keyValuePairs){
        var keys= Object.keys(keyValuePairs);
        return keys.map(function(x){return x+"="+keyValuePairs[x];}).join('; ');
}

module.exports={
    storeFromArray:function(cookieObj, inputArray){
        //先轉換成K-V pair
        var inputObj = getKeyValuePairsFromCookieArray(inputArray);
        var originObj = getKeyValuePairsFromCookieString(cookieObj.combinedString);
        
        //將input的K-V pair更新到originObj(用來判斷新增/取代cookies)
        var keysInInputObj = Object.keys(inputObj);
        var keysInOriginObj = Object.keys(originObj);
        keysInInputObj.forEach(function(x){originObj[x]=inputObj[x]});
        
        //remove start with dt/WAS
        keysInInputObj=keysInInputObj.filter(function(x){return x.slice(0,2)!='dt'&&x.slice(0,3)!='WAS'})
        
        //轉換成string
        var combinedString = getCookieStringFromKeyValuePairs(originObj);
        cookieObj.combinedString = combinedString;
    }
}