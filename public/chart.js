var chart;
$(document).on('ready', function() {
    if(user) {
        var x2 = ['x2']
        var bals = ['Food Points']
        var ideal = ['Ideal', numfoodpoints, 0]
        var x = ['x', start, end]
        var bucketSize = 5
        var numBuckets = 4
        var buckets = {}
        var data = {}
        var data2 = {}
        user.balances.forEach(function(bal) {
            x2.push(new Date(bal.date))
            bals.push(bal.balance)
        })
        user.trans.forEach(function(exp) {
            var timestamp = moment(exp.date).format('X')
            var timestamp2 = moment().startOf('day').hours(moment(exp.date).hours()).format('X')
            var amt = exp.amount * -1
            data[timestamp] = ~~amt
            if(!data2[timestamp2]) {
                data2[timestamp2] = 0
            }
            data2[timestamp2] += ~~amt
            for(var i = 0; i <= numBuckets; i++) {
                //console.log(amt, i*bucketSize, (i+1)*bucketSize)
                if(i >= numBuckets || (amt > i * bucketSize && amt <= (i + 1) * bucketSize)) {
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
                enabled: false
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
                type: 'pie'
            }
        });
        var cal = new CalHeatMap();
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
            cellSize: 15
        });
    }
    //ajax call to get data for timeline
    $.ajax({
        url: "/venues"
    }).done(function(data) {
        var processedVenues = []
        data.forEach(function(v) {
            if(v.open && v.close) {
                v.content = v.name
                v.start = moment(v.open, "MMMM-DD h:mma")
                v.end = moment(v.close, "MMMM-DD h:mma")
                if(v.start === v.end) {
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
            start: new Date()
        };
        // Create a Timeline
        var timeline = new vis.Timeline(container, processedVenues, options);
    });
})

function updateChart() {
    chart.load({
        columns: [
            ['Ideal', numfoodpoints, 0]
        ]
    })
}