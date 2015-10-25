/*\
|*|
|*|  :: cookies.js ::
|*|
|*|  A complete cookies reader/writer framework with full unicode support.
|*|
|*|  Revision #1 - September 4, 2014
|*|
|*|  https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
|*|  https://developer.mozilla.org/User:fusionchess
|*|
|*|  This framework is released under the GNU Public License, version 3 or later.
|*|  http://www.gnu.org/licenses/gpl-3.0-standalone.html
|*|
|*|  Syntaxes:
|*|
|*|  * docCookies.setItem(name, value[, end[, path[, domain[, secure]]]])
|*|  * docCookies.getItem(name)
|*|  * docCookies.removeItem(name[, path[, domain]])
|*|  * docCookies.hasItem(name)
|*|  * docCookies.keys()
|*|
\*/

var docCookies = {
  getItem: function (sKey) {
    if (!sKey) { return null; }
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
          sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
          break;
        case String:
          sExpires = "; expires=" + vEnd;
          break;
        case Date:
          sExpires = "; expires=" + vEnd.toUTCString();
          break;
      }
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
  },
  removeItem: function (sKey, sPath, sDomain) {
    if (!this.hasItem(sKey)) { return false; }
    document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "");
    return true;
  },
  hasItem: function (sKey) {
    if (!sKey) { return false; }
    return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
  },
  keys: function () {
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nLen = aKeys.length, nIdx = 0; nIdx < nLen; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
    return aKeys;
  }
};

var numfoodpoints;
var user;

var start;
var end;
var currdate = new Date();

var acadyear = currdate.getMonth() > 6 ? currdate.getFullYear() : currdate.getFullYear() - 1;
var DEFAULT_FOOD_POINTS = 2152;
var UPDATE_INTERVAL = 200;
var FALL_LENGTH = 16 * 7;
var SPRING_LENGTH = 16 * 7 + 4;
var MAX_AMOUNT_BALANCEADDITION = 1500;
var fallstart = getFirstWeekday(1, 19, 7, acadyear); //monday after aug 19 of acad year
var fallend = addDays(fallstart, FALL_LENGTH);
var springstart = getFirstWeekday(3, 2, 0, acadyear + 1); //wednesday after jan 2 of following year
var springend = addDays(springstart, SPRING_LENGTH);
// console.log(fallstart, fallend, springstart, springend);

$(document).ready(function() {

    //load user and generate user-specific visualizations
    $.ajax({
            url: "/api/user"
        }).always(function(data, status, err) {
            if (status === "success") {
                user = data;
                // console.log(user);
            }

            var fall = currdate > fallstart && currdate < fallend;
            var spring = currdate > springstart && currdate < springend;
            start = spring ? springstart : fallstart;
            end = spring ? springend : fallend;

            var projectionStart = 0;
            var projectionEnd = 0;
            if (user) {
                // this was old jquery to display balance on progressbar
                //$("#balance").html(user.balances[0].balance.toFixed(2));

                user.balances = user.balances.filter(function(b) {
                    return new Date(b.date) > start && new Date(b.date) < end;
                });

                if (user.balances.length > 0) {
                    var first = user.balances[0];
                    var last = user.balances[user.balances.length - 1];
                    var addedTotal = 0;
                    var deposits = [];

                    user.trans.forEach(function(exp) {
                        if ((exp.amount > 0)&&(exp.amount < MAX_AMOUNT_BALANCEADDITION)) {
                            deposits.push(exp.amount);
                        }
                    });

                    deposits.forEach(function(deps){
                       addedTotal+=deps;
                    });

                    var delta = last.balance - first.balance - addedTotal;

                    var timedelta = moment(first.date).diff(last.date);
                    var slope = delta / timedelta;

                    //extrapolate line to semester start/end
                    projectionStart = moment(first.date).diff(start) * slope + first.balance;
                    projectionEnd = moment(first.date).diff(end) * slope + first.balance+addedTotal;

                    //compute estimated usages for day, week, month
                    var day = moment.duration(1, 'day').asMilliseconds() * slope;
                    var week = moment.duration(1, 'week').asMilliseconds() * slope;
                    var month = moment.duration(1, 'month').asMilliseconds() * slope;

                    var projections = [{
                        time: "Starting Balance",
                        amount: projectionStart
                    },{
                        time:"Added Balance",
                        amount: addedTotal
                    }, {
                        time: "Ending Balance",
                        amount: projectionEnd
                    }, {
                        time: "Per day",
                        amount: day
                    }, {
                        time: "Per week",
                        amount: week
                    }, {
                        time: "Per month",
                        amount: month
                    }];
                    for (var i = 0; i < projections.length; i++) {
                        $("#projections").append("<tr><td>" + projections[i].time + "</td><td>" + projections[i].amount.toFixed(2) + "</td></tr>");
                    }
                }
            }

            var cookieVal = docCookies.getItem("numfoodpoints");
            numfoodpoints = parseInt(cookieVal || projectionStart || DEFAULT_FOOD_POINTS);
            $("#plan").val(numfoodpoints).change();

            //start the countdown
            if (!fall && !spring) {
                $("#result").html("0.00");
            }
            else {
                setInterval(function updateCountdown() {
                    var currtime = new Date();
                    var percent = (1 - (currtime - start) / (end - start));
                    var remaining = (numfoodpoints * percent).toFixed(4);
                    $("#result").html(remaining);
                    $("#progbar").width(percent * 100 + "%");
                }, UPDATE_INTERVAL);
            }

            if (user) {
                var bals = ['Food Points'];
                var ideal = ['Ideal', numfoodpoints, 0];
                var deposits = [];
                var proj = ['Projection', projectionStart, projectionEnd];
                var x = ['x', start, end];
                var x2 = ['x2'];
                var bucketSize = 5;
                var numBuckets = 4;
                var buckets = {};
                var dayHeatmap = {};
                var hourHeatMap = {};

                user.balances.forEach(function(bal) {
                    x2.push(new Date(bal.date));
                    bals.push(bal.balance);
                });
                user.trans.forEach(function(exp) {
                    if (exp.amount < 0) {
                        var timestamp = moment(exp.date).format('X');
                        var timestamp2 = moment().startOf('day').hours(moment(exp.date).hours()).format('X');
                        var amt = exp.amount * -1;
                        dayHeatmap[timestamp] = ~~amt;
                        if (!hourHeatMap[timestamp2]) {
                            hourHeatMap[timestamp2] = 0;
                        }
                        hourHeatMap[timestamp2] += ~~amt;
                        for (var i = 0; i <= numBuckets; i++) {
                            //console.log(amt, i*bucketSize, (i+1)*bucketSize)
                            if (i >= numBuckets || (amt > i * bucketSize && amt <= (i + 1) * bucketSize)) {
                                //console.log(i, amt)
                                buckets[i * bucketSize] ? buckets[i * bucketSize] += amt : buckets[i * bucketSize] = amt;
                                break;
                            }
                        }
                    }
                });

                var cal = new CalHeatMap();
                cal.init({
                  // itemSelector: "#animationDuration-a", //new
	                // domain: "day", //new
                  itemSelector: "#days",
                  start: fallstart,
                  range: 3,
                  previousSelector: "#animationDuration-previous",
                	nextSelector: "#animationDuration-next",
                	itemNamespace: "animationDuration-a",
                  domain: "month",
                  subDomain: "day",
                  highlight: new Date(),
                  data: dayHeatmap,
                  tooltip: true,
                  itemName: ["", ""],
                  subDomainTextFormat: function(date, value) {
                      return value ? value.toFixed() : "";
                    },
                  legendColors: {
                    min: "#fcffa3",
                    max: "#510d63",
                    empty: "white"
                    // Will use the CSS for the missing keys
                  },
                  legendVerticalPosition: "center",
                  legendOrientation: "vertical",
                  cellSize: 16
                });
                var cal2 = new CalHeatMap();
                cal2.init({
                    itemSelector: "#hours",
                    start: new Date(),
                    range: 1,
                    domain: "day",
                    subDomain: "hour",
                    domainLabelFormat: "",
                    subDomainDateFormat: function(date) {
                        return moment(date).format("ha"); // Use the moment library to format the Date
                    },
                    cellPadding: 5,
                    verticalOrientation: true,
                    colLimit: 12,
                    tooltip: true,
                    data: hourHeatMap,
                    itemName: ["", ""],
                    subDomainTextFormat: function(date, value) {
                        return value ? value.toFixed() : "";
                    },
                    legendColors: {
                      min: "#fcffa3",
                      max: "#510d63",
                      empty: "white"
                      // Will use the CSS for the missing keys
                    },
                    cellSize: 16
                });
            }
        });
});
//functions
function addDays(date, days) {
    var result = new Date(date);
    result.setDate(date.getDate() + days);
    return result;
}

function getFirstWeekday(dayOfWeek, day, month, year) {
    //gets the first specified weekday following the given month, year, day
    var myDate = new Date();
    myDate.setHours(0, 0, 0, 0);
    myDate.setYear(year);
    myDate.setDate(day);
    myDate.setMonth(month);
    // Find day of week.
    while (myDate.getDay() !== dayOfWeek) {
        myDate.setDate(myDate.getDate() + 1);
    }
    return myDate;
}

function format(input) {
    var formatted = moment(new Date(input)).format("MMMM Do YYYY, h:mm:ss a");
    return formatted;
}

(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
                        })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
ga('create', 'UA-45337794-1', 'foodpoints.herokuapp.com');
ga('send', 'pageview');
