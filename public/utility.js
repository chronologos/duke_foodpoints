function setCookie(c_name, value, exdays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value = escape(value) + ((exdays == null) ? "" : "; expires=" + exdate.toUTCString());
    document.cookie = c_name + "=" + c_value;
}

function getCookie(c_name) {
    var c_value = document.cookie;
    var c_start = c_value.indexOf(" " + c_name + "=");
    if(c_start == -1) {
        c_start = c_value.indexOf(c_name + "=");
    }
    if(c_start == -1) {
        c_value = null;
    } else {
        c_start = c_value.indexOf("=", c_start) + 1;
        var c_end = c_value.indexOf(";", c_start);
        if(c_end == -1) {
            c_end = c_value.length;
        }
        c_value = unescape(c_value.substring(c_start, c_end));
    }
    return c_value;
}
//sets field to cookie value or default value

function checkCookie(defaultval) {
    var numfoodpoints = getCookie("numfoodpoints");
    if(numfoodpoints != null && numfoodpoints != "") {
        //set value of text field
        $("#plan").val(numfoodpoints);
    } else {
        $("#plan").val(defaultval)
    }
}
var start;
var end;
var currdate = new Date();
var DEFAULT_FOOD_POINTS = 2152;
var UPDATE_INTERVAL = 100;
var FALL_LENGTH = 16 * 7;
var SPRING_LENGTH = 16 * 7 + 3;
var numfoodpoints;
var fallstart = getNthDay(3, 1, 7, currdate.getFullYear()); //fourth monday august
var fallend = addDays(fallstart, FALL_LENGTH);
var springstart = getNthDay(1, 3, 0, currdate.getFullYear()); //second wednesday january
var springend = addDays(springstart, SPRING_LENGTH);
//var currdate=new Date("8/1/2013"); //debug date
$(document).ready(function() {
    $("#plan").on("keyup", function() {
        numfoodpoints = parseInt($("#plan").val());
        setCookie("numfoodpoints", numfoodpoints, 365);
        updateChart()
    });
    checkCookie(DEFAULT_FOOD_POINTS);
    numfoodpoints = parseInt($("#plan").val());
    //if between, set to these
    if(currdate > fallstart && currdate < fallend) {
        start = fallstart;
        end = fallend;
        setInterval(calculatePercentSemester, UPDATE_INTERVAL);
    } else if(currdate > springstart && currdate < springend) {
        start = springstart;
        end = springend;
        setInterval(calculatePercentSemester, UPDATE_INTERVAL);
    }
    //else not in session
    else {
        $("#result").html("Not currently in semester");
    }
    /*
    console.log(fallstart);
    console.log(fallend);
    console.log(springstart);
    console.log(springend);
    console.log(start);
    console.log(end);
    console.log(currdate);
    console.log(numfoodpoints);
    */
});
//calculates and updates the percentage of the semester elapsed

function calculatePercentSemester() {
    var currtime = new Date();
    //var currtime=new Date("12/1/2013"); //debug time
    var percent = (1 - (currtime - start) / (end - start));
    var percent2 = Math.min($("#balance").text() / numfoodpoints, 1);
    $("#result").html((numfoodpoints * percent).toFixed(5));
    $("#progbar").width(percent * 100 + "%");
    $("#progbar2").width(percent2 * 100 + "%");
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(date.getDate() + days);
    return result;
}
//gets the nth (zero-indexed) instance of a specific day of the week in a month, year

function getNthDay(n, dayOfWeek, month, year) {
    var myDate = new Date();
    myDate.setHours(0, 0, 0, 0);
    myDate.setYear(year);
    // get first day of month
    myDate.setDate(1);
    myDate.setMonth(month);
    // Find day of week.
    while(myDate.getDay() != dayOfWeek) {
        myDate.setDate(myDate.getDate() + 1);
    }
    // Add 7*n days (n weeks)
    myDate.setDate(myDate.getDate() + 7 * n);
    return myDate;
}
$(document).ready(function() {
    $('#transactions').DataTable({
        searching: false,
        lengthChange: false,
        ordering: false,
        "pagingType": "simple"
    });
})
angular.module('foodpoints', []).controller("BudgetController", function($scope, $http) {
    $http.get('/api/cutoffs/').
    success(function(data, status, headers, config) {
        $scope.periods = Object.keys(data)
        $scope.budget = {
            amount: 150,
            period: 'week'
        }
    })
    getBudgets($scope, $http)
    $scope.save = function(budget) {
        console.log(budget)
        $http.post('/api/budgets/', budget).
        success(function(data, status, headers, config) {
            console.log(data)
            getBudgets($scope, $http)
        })
    }
    $scope.delete = function(budget) {
        $http.delete('/api/budgets/' + budget._id).
        success(function(data, status, headers, config) {
            console.log(data)
            getBudgets($scope, $http)
        })
    }
})

function getBudgets($scope, $http) {
    $http.get('/api/budgets/').
    success(function(data, status, headers, config) {
        data.forEach(function(b) {
            b.percent = Math.min(b.spent / b.amount * 100, 100)
            var classes = ["progress-bar-success", "progress-bar", "progress-bar-striped", "active"]
            classes[0] = b.percent > 66 ? "progress-bar-warning" : classes[0]
            classes[0] = b.percent > 90 ? "progress-bar-danger" : classes[0]
            b.class = classes.join(" ")
            b.display = b.spent.toFixed() + " of " + b.amount + " per " + b.period
        })
        $scope.budgets = data
    })
}