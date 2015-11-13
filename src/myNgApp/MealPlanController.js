var UPDATE_INTERVAL = 500;
angular.module('foodpoints')
  .controller("MealPlanController", function($scope, $interval, infoFactory, UserService) {
    var info = infoFactory.getInfo();
    // set $scope.user to resolve the promise returned by UserService.User
    $scope.fetchUser = function() {
      UserService.User.then(function(results) {
        $scope.user = results;
      });
    };
    $scope.fetchUser();
    $scope.user = {};
    // wait for promise to resolve
    $scope.$watch('user', function(newVal, oldVal) {
      // fetching user from server takes a while, so we want to watch this for change and broadcast on change
      if (newVal != oldVal) {
        $scope.$broadcast('userChange', {
          "val": newVal
        });
        // console.log(newVal);
        runBody();
      }
    });
    // update "actually have" progress bar when meal plan changes
    function runBody() {
      var a = $interval(function() {
        $scope.mealPlanCost = docCookies.getItem("mealPlanCost") || 2152;
        $scope.selectedItemName = docCookies.getItem("mealPlan") || "Choose meal plan";
        var percent2 = Math.min($scope.user.balance / $scope.mealPlanCost, 1);
        $("#progbar2").width(percent2 * 100 + "%");
      }, info.UPDATE_INTERVAL);
    }

    // dynamically change progressbar size on change in food plan
    $scope.dropboxitemselected = function(thisItem) {
      $scope.selectedItemName = thisItem.name;
      $scope.mealPlanCost = thisItem.value;
      //store numfoodpoints and foodplan in cookies
      docCookies.setItem("mealPlanCost", $scope.mealPlanCost);
      docCookies.setItem("mealPlan", $scope.selectedItemName);

      numfoodpoints = $scope.mealPlanCost; //necessary cos foodpoints.js does updates progress bar text with this
    };

    //sadly we hardcode the foodplans into an array
    $scope.mealPlans = [{
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
        value: 2473
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
        value: 1458
    }
  ];

  });
