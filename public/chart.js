var chart;
$(document).on('ready', function() {
    var x2 = ['x2']
    var bals = ['Food Points']
    var ideal = ['Ideal', numfoodpoints, 0]
    var x = ['x', start, end]
    var bucketSize = 5
    var numBuckets = 4
    var buckets = {}
    var cal = new CalHeatMap();
    var data = {}
    var data2 = {}
    //round results to 2 digits
    for(var key in data) {
        data[key] = Math.round(data[key] * 100) / 100
    }
    for(var key in data2) {
        data2[key] = Math.round(data2[key] * 100) / 100
    }
    user.balances.forEach(function(bal) {
        x2.push(bal.date)
        bals.push(bal.balance)
    })
    user.exps.forEach(function(exp) {
        var timestamp = ~~ (exp.date / 1000)
        var timestamp2 = moment().startOf('day').hours(moment(exp.date).hours()).format('X')
        var amt = exp.amount * -1
        data[timestamp] = amt
        if(!data2[timestamp2]) {
            data2[timestamp2] = 0
        }
        data2[timestamp2] += amt
        for(var i = 0; i <= numBuckets; i++) {
            //console.log(amt, i*bucketSize, (i+1)*bucketSize)
            if(i >= numBuckets || (amt > i * bucketSize && amt <= (i + 1) * bucketSize)) {
                console.log(i, amt)
                buckets[i * bucketSize] ? buckets[i * bucketSize] += amt : buckets[i * bucketSize] = amt
                break;
            }
        }
    })
    console.log(buckets)
    chart = c3.generate({
        bindto: "#chart",
        data: {
            xs: {
                'Ideal': 'x',
                'Food Points': 'x2'
            },
            columns: [
                x, x2, ideal, bals
            ]
        },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    fit: true,
                    format: '%m-%d'
                }
            },
            y: {
                padding: {
                    top: 0,
                    bottom: 1
                }
            }
        },
        zoom: {
            enabled: true
        }
    });
    //bucket by total, or by number?
    cols = []
    for(var key in buckets) {
        cols.push(["$" + key + "+"].concat(buckets[key]))
    }
    var pie = c3.generate({
        bindto: "#pie",
        data: {
            // iris data from R
            columns: cols,
            type: 'pie',
            onclick: function(d, i) {
                console.log("onclick", d, i);
            },
            onmouseover: function(d, i) {
                console.log("onmouseover", d, i);
            },
            onmouseout: function(d, i) {
                console.log("onmouseout", d, i);
            }
        }
    });
    cal.init({
        itemSelector: "#days",
        start: start,
        range: 5,
        domain: "month",
        subDomain: "day",
        data: data,
        tooltip: true,
        itemName: ["", ""],
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
        itemName: ["", ""],
        subDomainTextFormat: function(date, value) {
            return value ? value.toFixed() : "";
        },
        cellSize: 15,
        cellPadding: 1,
        domainGutter: 0
    });
})

function updateChart() {
    chart.load({
        columns: [
            ['Ideal', numfoodpoints, 0]
        ]
    })
}