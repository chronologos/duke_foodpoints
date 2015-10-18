angular.module('foodpoints', [])

  .controller("AdvancedStatsController", function($scope) {
    $scope.advanced = false;
  })

  .controller("AverageSpendingController", function($scope, $http) {
    $http.get('/api/spending')
      .then(function(response) {
        $scope.average = parseFloat(response.data).toFixed(2);
      }
  );
    $http.get('/api/personal')
      .then(function(res) {
 //       var checkDailyData = res.data;
 //       console.log("Response recieved is " + checkDailyData);
        var tryFloat = parseFloat(checkDailyData);
        var floatVal = isNaN(tryFloat) ?  "Coming Soon!" : tryFloat.toFixed(2);
 //       console.log("Float Value of that is: " + floatVal);
        //$scope.dailyTotal = floatVal || "Coming Soon!";
        $scope.dailyTotal = floatVal; //&& isNaN(floatVal) ? "Coming Soon!" : floatVal;
      }
  );
//      .then(function(response) {
//        $scope.dailyTotal = parseFloat(response.data).toFixed(2);
//        alert($scope.dailyTotal);
//      }
})

//  .controller("PersonalController", function($scope, $http) {
//    $http.get('/api/personal')
//      .then(function(response) {
//        $scope.dailyTotal = parseFloat(response.data).toFixed(2);
//        alert($scope.dailyTotal);
//      }
//  );
//})



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
