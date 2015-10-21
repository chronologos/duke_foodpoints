angular.module('foodpoints', [])

  .controller("AdvancedStatsController", function($scope) {
    $scope.advanced = false;
  })

  .controller("AverageSpendingController", function($scope, $http) {
    var globalDaily;
    var globalWeekly;
    $http.get('/api/spending')
      .then(function(response) {
        $scope.average = parseFloat(response.data).toFixed(2);
        globalDaily = $scope.average;
      }
  );
    $http.get('/api/personal')
      .then(function(res) {
        var checkDailyData = res.data;
        console.log("Response recieved is " + JSON.stringify(checkDailyData));
        var personalDaily = parseFloat(checkDailyData['day']);
        var personalWeekly = parseFloat(checkDailyData['week']);
        $scope.dailyTotal = isNaN(personalDaily) ? "Coming Soon!" : personalDaily.toFixed(2);
        $scope.weeklyTotal = isNaN(personalWeekly) ? "Coming Soon!" : personalWeekly.toFixed(2);
      }
  );
    $http.get('/api/spending/weekly')
      .then(function(res) {
        var weeklyTotal = res.data;
        console.log("Response received for weekly total is " + weeklyTotal);
        var weekTotalFloat = parseFloat(weeklyTotal);
        globalWeekly = 7 * globalDaily;
        var weekTotalFloat = isNaN(weekTotalFloat) ? globalWeekly : weekTotalFloat.toFixed(2);
        $scope.wkAvg = weekTotalFloat;
      });
})

  .controller("BudgetController", function($scope, $http) {
    $http.get('/api/cutoffs/')
      .success(function(data, status, headers, config) {
        $scope.periods = Object.keys(data);
        $scope.budget = {
          amount: 150,
          period: 'week'
        };
      });
    getBudgets($scope, $http);
    $scope.save = function(budget) {
      console.log(budget);
      $http.post('/api/budgets/', budget)
        .success(function(data, status, headers, config) {
          console.log(data);
          getBudgets($scope, $http);
        });
    };
    $scope.delete = function(budget) {
      $http.delete('/api/budgets/' + budget._id)
        .success(function(data, status, headers, config) {
          console.log(data);
          getBudgets($scope, $http);
        });
    };
  });

  function getBudgets($scope, $http) {
      $http.get('/api/budgets/').
      success(function(data, status, headers, config) {
          data.forEach(function(b) {
              b.percent = Math.min(b.spent / b.amount * 100, 100);
              b.elapsed = moment().diff(b.cutoff) / moment.duration(1, b.period).asMilliseconds() * 100;
              var classes = ["progress-bar-success", "progress-bar", "progress-bar-striped", "active"];
              classes[0] = b.percent > b.elapsed ? "progress-bar-warning" : classes[0];
              b.class = classes.join(" ");
              b.display = b.spent.toFixed() + " of " + b.amount + " this " + b.period;
          });
          $scope.budgets = data;
      });
  }
