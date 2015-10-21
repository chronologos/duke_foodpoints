var numfoodpoints;
var user;

var start;
var end;
var currdate = new Date();
//var currdate=new Date("3/3/2015"); //debug date
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
console.log(fallstart, fallend, springstart, springend);
var chart;

$(document).ready(function() {

    // function to format dates
    $('.format').each(function() {
        $(this).text(format($(this).text()));
    });

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

            var cookieVal = getCookie("numfoodpoints");
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
                // console.log(x, x2, ideal, bals);
                chart = c3.generate({
                    bindto: "#chart",
                    data: {
                        xs: {
                            'Ideal': 'x',
                            'Food Points': 'x2',
                            'Projection': 'x'
                        },
                        columns: [
                            x, x2, x, ideal, bals, proj
                        ]
                    },
                    axis: {
                        x: {
                            type: 'timeseries',
                            tick: {
                                format: '%m/%d'
                            }
                        },
                        y: {
                            padding: {
                                top: 0,
                                bottom: 1
                            }
                        }
                    },
                    tooltip: {
                        format: {
                            value: function(value, ratio, id) {
                                return value.toFixed(2);
                            }
                        }
                    },
                    zoom: {
                        enabled: false
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

function setCookie(c_name, value, exdays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays === null) ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = c_name + "=" + c_value;
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
    }
    return "";
}

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
