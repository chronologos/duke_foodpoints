$(document).on('ready', function(){
    var cal = new CalHeatMap();
var data = {}
var data2 = {}
user.exps.forEach(function(exp){
    var timestamp = ~~(exp.date/1000)
    var timestamp2 = moment().startOf('day').hours(moment(exp.date).hours()).format('X')
    var amount = exp.amount*-1
    data[timestamp]=amount
    if (!data2[timestamp2]){
        data2[timestamp2]=0
    }
    data2[timestamp2]+=amount
})
//round results to 2 digits
for (var key in data){
    data[key]=Math.round(data[key]*100)/100
}
for(var key in data2){
    data2[key]=Math.round(data2[key]*100)/100
}

cal.init({
    itemSelector: "#days",
    start: start,
    range: 5,
    domain: "month",
    subDomain: "day",
    data: data,
    tooltip: true,
    itemName: ["",""],
    subDomainTextFormat: function(date, value) {
        return value ? value.toFixed() : "";
    },
    cellSize: 15
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
    data: data2,
    itemName: ["",""],
    subDomainTextFormat: function(date, value) {
        return value ? value.toFixed() : "";
    },
    cellSize:15,
    cellPadding: 1,
    domainGutter: 0
});
})
