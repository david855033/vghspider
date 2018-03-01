String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(search, replacement);
};

module.exports=
{
    removeHtmlBlank:function (htmlText){
        return htmlText.replaceAll(/\\r/g,'').replaceAll(/\\n/g,'').replaceAll(/\\t/g,'').replaceAll(/\\\"/g,'').replaceAll().trim();
    },
    //'20180101' -> '2018-01-01'
    getDateFromShortDate:function(dateString){
        if(typeof dateString =="string" && dateString.length==8)
        {
            return dateString.substr(0,4)+"-"+dateString.substr(4,2)+"-"+dateString.substr(6,2);
        }
        else{
            return dateString;
        } 
    },
}