angular.module('foodpoints', [])

  .controller("AdvancedStatsController", function($scope) {
    $scope.advanced = false;
  })

  .controller("MealPlanController", function($scope){
    $scope.mealPlans=[{
      name: "Plan H ($432, Freshmen)",
      value: 432
      },
      {
        name: "Plan I ($499, Freshmen)",
        value: 499
        },
      {
        name: "Plan A ($2062)",
        value: 2062
        },
      {
        name: "Plan B ($2473)",
        value: 2062
        },
      {
        name: "Plan C ($2738)",
        value: 2738
        },
      {
        name: "Plan D ($2938)",
        value: 2938
      },
      {
        name: "Plan E ($3204)",
        value: 3204
        },
      {
        name: "Plan F ($676, off-campus)",
        value: 676
        },
      {
        name: "Plan J ($1458, central, off-campus)",
        value: 31458204
      }
    ];
    $scope.selectedItem;
    $scope.dropboxitemselected = function (thisItem) {
        $scope.selectedItemName = thisItem.name;
        $scope.mealPlanCost = thisItem.value;
        alert($scope.selectedItemName);
    };
  })

  .controller("AverageSpendingController", function($scope, $http) {
    $http.get('/api/spending')
      .then(function(response) {
        $scope.average = parseFloat(response.data).toFixed(2);
      }
  );
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
