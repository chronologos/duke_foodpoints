// Top Level Controller that fetches User json from server.
angular.module('foodpoints')
.controller("UserController", function($scope,$http){

  // a globally accessible $scope.user with several fields (see README):
  $http.get('/api/user')
    .success(function(data, status, headers, config) {
      if (status === 200) {
          $scope.user = data;
          $scope.balance = $scope.user.balances[0].balance.toFixed(2);
          console.log("angular got a user, " + JSON.stringify($scope.user));

          var trans = getTrans($scope.user.balances);
          console.log("Number of different transactions detected for client: " + trans.length);

          var fav = getFav(trans);

          $scope.user.fav = fav;

          console.log("Current value of favorite for user is " + $scope.user.fav);
      }
      else console.log("Error"+status);
    });

    $scope.$watch('balance', function(newVal, oldVal){
      // fetching user from server takes a while, so we want to watch this for change and broadcast on change
        if(newVal!=oldVal)
            $scope.$broadcast('balanceChange',{"val":newVal});
    });


});


// Should eventually replace server-side code for calculating a user's transactions
// Both for sidebar display and calculation of user's total daily and weekly spending values
// Currently used only by getFav method
  function getTrans(bals) {
    var arr = [];
    for (var i = 0; i < bals.length; i++) {
      if (bals[i + 1]) {
        //newer number subtract older number
        var diff = bals[i].balance - bals[i + 1].balance;
        arr.push({
          amount: diff,
          date: bals[i].date
        });
      }
    }
  }

// Naive O(N) implementation
  function getFav(trans) {
    var freqs = {};
    trans.forEach(function(x){
      if (!freqs["" + x]) {
        freqs["" + x] = 1;
      }
      else {
        freqs["" + x] ++;
      }
    });

    var fav;
    var maxCount = 0;
    Object.keys(freqs).forEach(function(x){if (freqs[x] > maxCount){maxCount = freqs[x]; fav = x;}});
    console.log("Fav is " + fav);
    return fav;
  }

