// ("abc","abcdeabc") -> "abcabc"
if (!String.prototype.regSelect) {
    String.prototype.selectToString = function (regex, replacement) {
        var target = this;
        var match = target.match(regex, replacement);
        return match ? match.join("") : "";
    };
}
if (!String.prototype.replaceNbsps) {
    String.prototype.replaceNbsps = function () {
        var str = this;
        var re = new RegExp(String.fromCharCode(160), "g");
        return str.replace(re, " ");
    }
};
if (!String.prototype.splice) {
    String.prototype.splice = function (start, delCount, newSubStr) {
        return this.slice(0, start) + newSubStr + this.slice(start + Math.abs(delCount));
    };
}
Date.prototype.yyyymmdd = function (spliter) {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();
    spliter = spliter || '';
    return [this.getFullYear(),
    (mm > 9 ? '' : '0') + mm,
    (dd > 9 ? '' : '0') + dd
    ].join(spliter);
};

Date.prototype.yyyymmddhhmmss = function () {
    var MM = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();

    var date = [this.getFullYear(),
    (MM > 9 ? '' : '0') + MM,
    (dd > 9 ? '' : '0') + dd].join('');
    
    var hh = this.getHours(); 
    var mm = this.getMinutes();
    var ss = this.getSeconds();

    var time = [(hh > 9 ? '' : '0') + hh,(mm > 9 ? '' : '0') + mm,(ss > 9 ? '' : '0') + ss].join('');
    return date+"_"+time;
};

Date.prototype.addDate = function (increment) {
    this.setDate(this.getDate() + increment);
};

module.exports =
    {
        //'20180101' -> '2018-01-01'
        getDateFromShortDate: function (dateString) {
            if (typeof dateString == "string" && dateString.length == 8) {
                return dateString.substr(0, 4) + "-" + dateString.substr(4, 2) + "-" + dateString.substr(6, 2);
            }
            else {
                return dateString;
            }
        },

        // '1200' -> '12:00'
        getTimeFromShortTime: function (timeString) {
            if (typeof timeString == "string" && timeString.length == 4) {
                return timeString.substr(0, 2) + ":" + timeString.substr(2, 2);
            }
            else {
                return timeString;
            }
        },

        //'20180101-1200' -> '2018-01-01 12:00'
        getDateTimeFromShortDateTime: function (dateTimeString) {
            var parts = dateTimeString.replace(/-/g, ':').split(':');
            if (parts.length = 2) {
                parts[0] = this.getDateFromShortDate(parts[0].trim());
                parts[1] = this.getTimeFromShortTime(parts[1].trim());
                return parts[0] + ' ' + parts[1];
            }
            return dateTimeString;
        },
        // '2018-01-01-10.30' -> '2018-01-01 10:30'
        getDateTimeInMedicationTable: function (inputString) {
            return inputString.selectToString(/[0-9]{4}-[0-9]{2}-[0-9]{2}/) + " " + inputString.selectToString(/[0-9]{2}\.[0-9]{2}/).replace('\.', ":");
        },
        //轉成date格式
        getDateFromString: function (str) {
            if (!str) { return new Date(str) || new Date(); }
            var match_d = str.match(/\d{1,4}-\d{1,2}-\d{1,2}/);
            match_d = (match_d && match_d[0]) || "";
            if (match_d) {
                var match_t = str.match(/\d{1,2}(:|\.)\d{1,2}((:|\.)\d{1,2})?/);
                match_t = (match_t && match_t[0]) || "";
                var d = match_d.split("-").map(function (x) { return Number(x) });
                var t = [];
                t = match_t.split(":").map(function (x) { return Number(x) });
                t[0] = t[0] || 0; t[1] = t[1] || 0; t[2] = t[2] || 0;
                return new Date(d[0], (d[1] - 1), d[2], t[0], t[1], t[2]);
            };
        },
        //計算日期差距
        getDateDifference: function(date1,date2){
            var date1 = new Date(date1);
            var date2 = new Date(date2);
            var timeDiff = Math.abs(date2.getTime() - date1.getTime());
            var diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
            return diffDays;
        }
    }