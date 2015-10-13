angular.module('foodpoints')
.controller("MealPlanController", ['$scope',function($scope){
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

// a long chunk of code that essentially stores your selected mealplan in a cookie and uses it to update progbars
  $scope.init = function () {
    if (docCookies.getItem("foodplan")!==null){
      $scope.selectedItemName = docCookies.getItem("foodplan");
      $scope.mealPlanCost = docCookies.getItem("numfoodpoints");
      var percent2 = Math.min($("#balance").text() / $scope.mealPlanCost, 1);
      console.log(percent2);
      $("#progbar2").width(percent2 * 100 + "%");
      if (user && chart) {
          chart.load({
              columns: [
                  ['Ideal', $scope.mealPlanCost, 0]
              ]
          });
      }
      numfoodpoints = $scope.mealPlanCost; //necessary cos foodpoints.js does updates progress bar text with this
    }
    else {
      $scope.selectedItemName = "Choose meal plan";
    }
  };

  // dynamically change progressbar size on change in food plan
  $scope.dropboxitemselected = function (thisItem) {
      $scope.selectedItemName = thisItem.name;
      $scope.mealPlanCost = thisItem.value;
      // alert($scope.selectedItemName);
      var percent2 = Math.min($("#balance").text() / $scope.mealPlanCost, 1);

      $("#progbar2").width(percent2 * 100 + "%");

      //store numfoodpoints and foodplan as cookies
      docCookies.setItem("numfoodpoints", $scope.mealPlanCost, 31536e3);
      docCookies.setItem("foodplan", $scope.selectedItemName, 31536e3);

      if (user && chart) {
          chart.load({
              columns: [
                  ['Ideal', $scope.mealPlanCost, 0]
              ]
          });
      }
      numfoodpoints = $scope.mealPlanCost; //necessary cos foodpoints.js does updates progress bar text with this
  };
}])
.directive('ngwatchthis',['$interval', function($interval) {
  return {
    link: function(scope, element, attrs) {
       scope.$watch("ngwatchthis", function() {
         if (!isNaN(parseInt(element.html()))){
           console.log(parseInt(element.html())+".")
         }
         
        var a = setTimeout(function(){console.log("delayed " + element.html()+" "+ typeof(element.html()))},1000);
       });
    }
  };

  }

]);
