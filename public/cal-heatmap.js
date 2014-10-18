var cal = new CalHeatMap();
var data = {}
user.exps.forEach(function(exp){
    var timestamp = ~~(exp.date/1000)
    data[timestamp]=parseFloat(exp.amount.toFixed(2))
})
console.log(data)

cal.init({
    itemSelector: "#days",
    start: new Date(moment().subtract(5,'month')),
    range: 6,
    domain: "month",
    subDomain: "day",
    data: data,
    tooltip: true,
    itemName: ["spent", "spent"],
    subDomainTextFormat: function(date, value) {
        return value ? value.toFixed() : "";
    },
    cellSize: 15
});

var cal2 = new CalHeatMap();
cal2.init({
    itemSelector: "#hours",
    start: new Date(moment().subtract(13,'day')),
    range: 14,
    domain: "day",
    subDomain: "hour",
    label:
    {
        position: "left",
        offset: {x: 1, y: 8}
    },
    verticalOrientation: true,
    colLimit: 24,
    tooltip: true,
    data: data,
    itemName: ["spent", "spent"],
    cellSize:10,
    cellPadding: 0,
    domainGutter: 2
});
