var UPDATE_INTERVAL = 500;
angular.module('foodpoints')
.controller("MealPlanController", function($scope,$interval,infoFactory){
  var info = infoFactory.getInfo();
  //sadly we hardcode the foodplans into an array
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
  if (docCookies.getItem("foodplan")!==null){
    $scope.selectedItemName = docCookies.getItem("foodplan");
    $scope.mealPlanCost = docCookies.getItem("numfoodpoints");
  }
  else {
    $scope.selectedItemName = "Choose meal plan";
  }

  $scope.balanceFetchedFromServer={"Fetched":"No","value":""};
  // watch for balance change when user loads and then fire this event.
  $scope.$on('balanceChange', function(event, args){
       console.log("balance fetched");
       $scope.balanceFetchedFromServer.Fetched="Yes";
       $scope.balanceFetchedFromServer.value=args.val;
       var percent2 = Math.min($scope.balanceFetchedFromServer.value / $scope.mealPlanCost, 1);
       console.log(percent2);
       $("#progbar2").width(percent2 * 100 + "%");

   });
   
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

      numfoodpoints = $scope.mealPlanCost; //necessary cos foodpoints.js does updates progress bar text with this
  };
});
