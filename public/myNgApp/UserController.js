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

          console.log("Length of balances is " + $scope.user.balances.length);
          var trans = getTrans($scope.user.balances);
          //$scope.user.trans = trans;
          console.log("Number of different transactions detected for client: " + trans.length);

          var favInfo = getFav(trans);

          //$scope.user.fav = parseFloat(Math.abs(fav)).toFixed(2);
          $scope.user.fav = "" + parseFloat(Math.abs(favInfo[0])).toFixed(2);
          $scope.user.numFav = "" + favInfo[1];


          var favList = getNFavs(5, trans);
          console.log("Printing result of favList");
          for (var i = 0; i < favList.length; i ++) {
            console.log(favList[i][0] + " : " + favList[i][1]);
          }
          $scope.user.allFavs = favList;


          console.log("User's favorite item costs " + $scope.user.fav + " and it was bought " + $scope.user.numFav + " times");
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
    console.log("Type of input to getTrans method: " + typeof(bals));
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
    return arr;
  }

// Used by both getFav and getNFavs
function getFreqs(trans) {
  console.log("Type of input to getFreqs method: " + typeof(trans));
  var freqs = {};
  trans.forEach(function(x){
    if (!freqs["" + x.amount]) {
      freqs["" + x.amount] = 1;
    }
    else {
      freqs["" + x.amount] ++;
    }
  });
  return freqs;
}

// Naive O(N) implementation
  function getFav(trans) {

    /***
    console.log("Type of input to getFav method: " + typeof(trans));
    var freqs = {};
    trans.forEach(function(x){
      if (!freqs["" + x.amount]) {
        freqs["" + x.amount] = 1;
      }
      else {
        freqs["" + x.amount] ++;
      }
    });
    ***/
    var freqs = getFreqs(trans);
    var fav;
    var maxCount = 0;
    Object.keys(freqs).forEach(function(x){if (freqs[x] > maxCount){maxCount = freqs[x]; fav = x;}});
    console.log("Fav is " + fav + " which was bought " + maxCount + " times");
    return [fav, maxCount];
  }

// Temporary... Tried to avoid O(N^2) but failed miserably cos Javascript objects do not preserve key order :(
  function getNFavs(n, trans) {
    var freqs = getFreqs(trans);
    var keys = Object.keys(freqs);
    //var result = {};
    var topKeys = [];
    var result = []
    if (keys.length < n) {
      var sortedVals = keys.map(function(val, pos) {
        return freqs[val];
      }).sort().reverse();
      sortedVals.forEach(function(x) {
        keys.forEach(function(y) {
          if (freqs[y] === x && topKeys.indexOf(y) === -1) {
          //  result[y] = x;
            topKeys.push(y);
          }
        })
      });
      //return result;
      for (var i = 0; i < topKeys.length; i ++) {
        result.push([topKeys[i], sortedVals[i]]);
      }
      //return [topKeys, sortedVals];
      return result;
    }
    var firstKeys = keys.slice(0, n);
    var topFreqs = firstKeys.map(function(val, pos) {
      return freqs[val];
    }).sort().reverse();
    keys.slice(n).forEach(function(x) {
      if (freqs[x] > topFreqs[n-1]) {
        topFreqs.push(freqs[x]);
        firstKeys.push(x);
        topFreqs.sort().reverse();
        topFreqs.pop();
      //  var removed = topFreqs.pop();
      //  topKeys.forEach(function(y) {
      //for (var index = 0; index < topKeys.length; index ++) {
      //    if (freqs[topKeys[index]] === removed) {
      //     top
      //    }
      //  })
      //}
      }
    });
    var done = 0;
      topFreqs.forEach(function(x) {
      firstKeys.forEach(function(y) {
        if (freqs[y] === x && topKeys.indexOf(y) === -1 && done < n) {
        //  result[y] = x;
          topKeys.push(parseFloat(Math.abs(y)).toFixed(2));
          console.log("Added key " + y + " with value " + x);
          done ++;
        }
      });
    });
//      return [topKeys, topFreqs];
      for (var i = 0; i < topKeys.length; i ++) {
        result.push([topKeys[i], topFreqs[i]]);
      }
      //return [topKeys, sortedVals];
      return result;

    };

/***
// Sort Object by Value, returning array of 2 arrays with keys in one and values in another
    function sortObj(obj) {
      var keys = Object.keys(obj);
      var sortedVals = keys.map(function(val, pos) {
        return obj[val];
      }).sort().reverse();
      var rightKeys = [];
      sortedVals.forEach(function(x) {
        keys.forEach(function(y) {
          if (obj[y] === x && rightKeys.indexOf(y) === -1) {
            rightKeys.push(y);
          }
        });
      });
      return [rightKeys, sortedVals];
    }
    ***/