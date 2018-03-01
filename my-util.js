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

module.exports =
    {
        removeHtmlBlank: function (htmlText) {
            return htmlText.replaceNbsps().replace(/(\\r|\\n|\\t|\\|&nbsp;)/g, '').trim();
        },
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
    }