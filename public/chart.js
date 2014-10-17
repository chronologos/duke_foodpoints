var dates = ['x']
var bals = ['Food Points']
user.balances.forEach(function(bal) {
    dates.push(bal.date)
    bals.push(bal.balance)
})
var chart = c3.generate({
    data: {
        x: 'x',
//        xFormat: '%Y%m%d', // 'xFormat' can be used as custom format of 'x'
        columns: [
            dates, bals
        ]
    },
    axis: {
        x: {
            type: 'timeseries',
            tick: {
                format: '%Y-%m-%d'
            }
        }
    }
});