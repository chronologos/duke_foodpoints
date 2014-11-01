var chart;
$(document).on('ready', function() {
    var x2 = ['x2']
    var bals = ['Food Points']
    var ideal = ['Ideal', numfoodpoints, 0]
    var x = ['x', start, end]
    var bucketSize=5
    var numBuckets = 4
    var buckets={}
    user.balances.forEach(function(bal) {
        x2.push(bal.date)
        bals.push(bal.balance)
    })
    user.exps.forEach(function(exp){
        var amt = exp.amount*-1
        for (var i = 0;i<=numBuckets; i++){
            //console.log(amt, i*bucketSize, (i+1)*bucketSize)
            if (i>=numBuckets || (amt>i*bucketSize && amt<=(i+1)*bucketSize)){
                console.log(i, amt)
                buckets[i*bucketSize] ? buckets[i*bucketSize]+=amt : buckets[i*bucketSize]=amt
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
    cols=[]
    for (var key in buckets){
        cols.push(["$"+key+"+"].concat(buckets[key]))
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
                })

                function updateChart() {
                chart.load({
                columns: [
                ['Ideal', numfoodpoints, 0]
            ]
        })
    }