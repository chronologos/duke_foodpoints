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
    $("#plan").on("change", function() {
        numfoodpoints = parseInt($("#plan").val());
        setCookie("numfoodpoints", numfoodpoints, 365);
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
    $("#result").html((numfoodpoints * percent).toFixed(6));
    $("#progbar").width(percent * 100 + "%");
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