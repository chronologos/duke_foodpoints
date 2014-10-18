$(document).on('ready', function(){
    var x = ['x']
    var bals = ['Food Points']
    var ideal = ['Ideal', numfoodpoints, 0]
    var x2 = ['x2', start, end]
    user.balances.forEach(function(bal) {
        x.push(bal.date)
        bals.push(bal.balance)
    })
    var chart = c3.generate({
        data: {
            xs: {
                'Ideal': 'x2',
                'Food Points': 'x'  
            },
            columns: [
                x, x2, bals, ideal
            ]
        },
        axis: {
            x: {
                type: 'timeseries',
                tick: {
                    format: '%Y-%m-%d'
                }
            },
            y: {
                padding: {top:0, bottom:0}
            }
        }

    });
})
