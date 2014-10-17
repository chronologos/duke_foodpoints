var cal = new CalHeatMap();
var m = moment().subtract(11,'month');
var w = moment().subtract(89,'day');
var data = {}
user.exps.forEach(function(exp){
    var timestamp = ~~(exp.date/1000)
    data[timestamp]=exp.amount
})
console.log(data)
cal.init({
    start: new Date(m),
	range: 12,
	domain: "month",
	subDomain: "day",
    data: data,
    tooltip: true,
    legend: [1,2,3,4],
    itemName: ["point"],
    subDomainTextFormat: function(date, value) {
		//return value;
	},
    cellSize: 15
});

/*
cal.init({
    start: new Date(w),
    range: 90,
    domain: "day",
    subDomain: "hour",
    label:
{
    position: "left"
},
    domainLabelFormat: "",
    verticalOrientation: true,
    colLimit: 24,
    data: data,
    cellSize:5,
    cellPadding:1,
    domainGutter:1
});
*/