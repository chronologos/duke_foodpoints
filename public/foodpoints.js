var start;
var end;
var currdate = new Date();
//var currdate=new Date("3/3/2015"); //debug date
var DEFAULT_FOOD_POINTS = 2152;
var UPDATE_INTERVAL = 100;
var FALL_LENGTH = 16 * 7;
var SPRING_LENGTH = 16 * 7 + 3;
var numfoodpoints;
var fallstart = getNthDay(3, 1, 7, currdate.getFullYear()); //fourth monday august
var fallend = addDays(fallstart, FALL_LENGTH);
var springstart = getNthDay(1, 3, 0, currdate.getFullYear()); //second wednesday january
var springend = addDays(springstart, SPRING_LENGTH);
var chart;

$(document).ready(function() {
    //load user and generate user-specific visualizations
    $.ajax({
            url: "/api/user"
        }).always(function(data, status, err) {
            if (status === "success") {
                var user = data
                console.log(user)
            }

            var fall = currdate > fallstart && currdate < fallend;
            var spring = currdate > springstart && currdate < springend;
            start = spring ? springstart : fallstart;
            end = spring ? springend : fallend;

            var projectionStart = 0;
            var projectionEnd = 0;
            if (user) {
                $("#balance").html(user.balances[0].balance.toFixed(2));
                var percent2 = Math.min($("#balance").text() / numfoodpoints, 1);
                $("#progbar2").width(percent2 * 100 + "%");

                user.balances = user.balances.filter(function(b) {
                    return new Date(b.date) > start && new Date(b.date) < end
                })
                if (user.balances.length > 0) {
                    var first = user.balances[0]
                    var last = user.balances[user.balances.length - 1]
                    var delta = last.balance - first.balance
                    var timedelta = moment(first.date).diff(last.date)
                    var slope = delta / timedelta

                    //extrapolate line to semester start/end
                    projectionStart = moment(first.date).diff(start) * slope + first.balance
                    projectionEnd = moment(first.date).diff(end) * slope + first.balance

                    //compute estimated usages for day, week, month
                    var day = moment.duration(1, 'day').asMilliseconds() * slope
                    var week = moment.duration(1, 'week').asMilliseconds() * slope
                    var month = moment.duration(1, 'month').asMilliseconds() * slope

                    var projections = [{
                        time: "start",
                        amount: projectionStart
                    }, {
                        time: "end",
                        amount: projectionEnd
                    }, {
                        time: "day",
                        amount: day
                    }, {
                        time: "week",
                        amount: week
                    }, {
                        time: "month",
                        amount: month
                    }]
                    for (var i = 0; i < projections.length; i++) {
                        $("#projections").append("<tr><td>" + projections[i].time + "</td><td>" + projections[i].amount.toFixed(2) + "</td></tr>");
                    }
                }
            }

            var cookieVal = getCookie("numfoodpoints")
            var numfoodpoints = parseInt(cookieVal || projectionStart || DEFAULT_FOOD_POINTS);
            $("#plan").val(numfoodpoints);

            //start the countdown
            if (!fall && !spring) {
                $("#result").html("0.00");
            }
            else {
                setInterval(updateCountdown, UPDATE_INTERVAL);
            }

            $('.format').each(function() {
                $(this).text(format($(this).text()))
            })
            $("#plan").on("change", function() {
                numfoodpoints = parseInt($("#plan").val());
                setCookie("numfoodpoints", numfoodpoints, 365);
                if (user) {
                    chart.load({
                        columns: [
                            ['Ideal', numfoodpoints, 0]
                        ]
                    })
                }
            });
            if (user) {
                var bals = ['Food Points']
                var ideal = ['Ideal', numfoodpoints, 0]
                var proj = ['Projection', projectionStart, projectionEnd]
                var x = ['x', start, end]
                var x2 = ['x2']
                var bucketSize = 5
                var numBuckets = 4
                var buckets = {}
                var dayHeatmap = {}
                var hourHeatMap = {}
                user.balances.forEach(function(bal) {
                    x2.push(new Date(bal.date))
                    bals.push(bal.balance)
                })
                user.trans.forEach(function(exp) {
                    var timestamp = moment(exp.date).format('X')
                    var timestamp2 = moment().startOf('day').hours(moment(exp.date).hours()).format('X')
                    var amt = exp.amount * -1
                    dayHeatmap[timestamp] = ~~amt
                    if (!hourHeatMap[timestamp2]) {
                        hourHeatMap[timestamp2] = 0
                    }
                    hourHeatMap[timestamp2] += ~~amt
                    for (var i = 0; i <= numBuckets; i++) {
                        //console.log(amt, i*bucketSize, (i+1)*bucketSize)
                        if (i >= numBuckets || (amt > i * bucketSize && amt <= (i + 1) * bucketSize)) {
                            //console.log(i, amt)
                            buckets[i * bucketSize] ? buckets[i * bucketSize] += amt : buckets[i * bucketSize] = amt
                            break;
                        }
                    }
                })
                console.log(x, x2, ideal, bals)
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
                /*
                var cols = [];
                for (var key in buckets) {
                    cols.push(["$" + key + "+"].concat(buckets[key]))
                }
                var pie = c3.generate({
                    bindto: "#pie",
                    data: {
                        // iris data from R
                        columns: cols,
                        type: 'pie'
                    }
                });
                */
                var cal = new CalHeatMap();
                cal.init({
                    itemSelector: "#days",
                    start: start,
                    range: 5,
                    domain: "month",
                    subDomain: "day",
                    data: dayHeatmap,
                    tooltip: true,
                    itemName: ["", ""],
                    subDomainTextFormat: function(date, value) {
                        return value ? value.toFixed() : "";
                    },
                    cellSize: 13
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
                    colLimit: 24,
                    tooltip: true,
                    data: hourHeatMap,
                    itemName: ["", ""],
                    subDomainTextFormat: function(date, value) {
                        return value ? value.toFixed() : "";
                    },
                    cellSize: 13
                });
            }
        })
        /*
            //ajax call to get data for timeline
            $.ajax({
                url: "/venues"
            }).done(function(data) {
                var processedVenues = []
                data.forEach(function(v) {
                    if (v.open && v.close) {
                        v.content = "<a href='" + v.link + "'>" + v.name + "</a>"
                        v.start = moment(v.open, "MMMM-DD h:mma")
                        v.end = moment(v.close, "MMMM-DD h:mma")
                        if (v.end <= v.start) {
                            v.end.add(1, 'day')
                        }
                        processedVenues.push(v)
                    }
                })
                console.log(processedVenues)
                    // DOM element where the Timeline will be attached
                var container = document.getElementById('timeline');
                // Configuration for the Timeline
                var options = {
                    start: moment(new Date()).startOf('day'),
                    end: moment(new Date()).startOf('day').add(1, 'day'),
                    moveable: false
                };
                // Create a Timeline
                var timeline = new vis.Timeline(container, processedVenues, options);
            });
            */
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
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

function updateCountdown() {
    //calculates and updates the percentage of the semester elapsed

    var currtime = new Date();
    var percent = (1 - (currtime - start) / (end - start));
    $("#result").html((numfoodpoints * percent).toFixed(4));
    $("#progbar").width(percent * 100 + "%");
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(date.getDate() + days);
    return result;
}

function getNthDay(n, dayOfWeek, month, year) {
    //gets the nth (zero-indexed) instance of a specific day of the week in a month, year

    var myDate = new Date();
    myDate.setHours(0, 0, 0, 0);
    myDate.setYear(year);
    // get first day of month
    myDate.setDate(1);
    myDate.setMonth(month);
    // Find day of week.
    while (myDate.getDay() != dayOfWeek) {
        myDate.setDate(myDate.getDate() + 1);
    }
    // Add 7*n days (n weeks)
    myDate.setDate(myDate.getDate() + 7 * n);
    return myDate;
}

function format(input) {
    var format = moment(new Date(input)).format("MMMM Do YYYY, h:mm:ss a");
    return format
}

function getBudgets($scope, $http) {
    $http.get('/api/budgets/').
    success(function(data, status, headers, config) {
        data.forEach(function(b) {
            b.percent = Math.min(b.spent / b.amount * 100, 100)
            b.elapsed = moment().diff(b.cutoff)/moment.duration(1,b.period).asMilliseconds()*100;
            var classes = ["progress-bar-success", "progress-bar", "progress-bar-striped", "active"]
            classes[0] = b.percent > b.elapsed ? "progress-bar-warning" : classes[0]
            b.class = classes.join(" ")
            b.display = b.spent.toFixed() + " of " + b.amount + " this " + b.period
        })
        $scope.budgets = data
    })
}

angular.module('foodpoints', []).controller("BudgetController", function($scope, $http) {
    $http.get('/api/cutoffs/').success(function(data, status, headers, config) {
        $scope.periods = Object.keys(data)
        $scope.budget = {
            amount: 150,
            period: 'week'
        }
    })
    getBudgets($scope, $http)
    $scope.save = function(budget) {
        console.log(budget)
        $http.post('/api/budgets/', budget).success(function(data, status, headers, config) {
            console.log(data)
            getBudgets($scope, $http)
        })
    }
    $scope.delete = function(budget) {
        $http.delete('/api/budgets/' + budget._id).success(function(data, status, headers, config) {
            console.log(data)
            getBudgets($scope, $http)
        })
    }
})