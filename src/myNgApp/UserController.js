angular.module('foodpoints')
  .controller("UserController", function($scope, $rootScope, $http, $interval, UserService, infoFactory) {
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

    function runBody() {
      // update "should have" progress barr continuously
      if (!info.fall && !info.spring) {
        $scope.result = 0.00;
      } else {
        var a = $interval(function() {
          $scope.mealPlanCost = docCookies.getItem("mealPlanCost") || 2152;
          var currtime = new Date();
          var percent = (1 - (currtime - info.start) / (info.end - info.start));
          $scope.shouldHave = ($scope.mealPlanCost * percent).toFixed(4);
          $("#progbar").width(percent * 100 + "%");
        }, info.UPDATE_INTERVAL);
      }
    }
  });
