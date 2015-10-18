// Top Level Controller that fetches User json from server.
angular.module('foodpoints')
.controller("UserController", function($scope,$http){

  $http.get('/api/user')
    .success(function(data, status, headers, config) {
      if (status === 200) {
          $scope.user = data;
          $scope.balance = $scope.user.balances[0].balance.toFixed(2);
          console.log("angular got a user, " + JSON.stringify($scope.user));
      }
      else console.log("Error"+status);
    });

    $scope.$watch('balance', function(newVal, oldVal){
      // fetching user from server takes a while, so we want to watch this for change and broadcast on change
        if(newVal!=oldVal)
            $scope.$broadcast('balanceChange',{"val":newVal});
    });


});
