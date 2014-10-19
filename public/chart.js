$(document).on('ready', function(){
    var x2 = ['x2']
    var bals = ['Food Points']
    var ideal = ['Ideal', numfoodpoints, 0]
    var x = ['x', start, end]
    user.balances.forEach(function(bal) {
        x2.push(bal.date)
        bals.push(bal.balance)
    })
    var chart = c3.generate({
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
                padding: {top:0, bottom:1}
            }
        },
        zoom: {
            enabled: true
        }

    });
})
