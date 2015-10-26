var DEBUG = true;
// Top Level Controller that fetches User json from server.
angular.module('foodpoints')
.controller("UserController", function($scope,$http,$interval,infoFactory){
  var info = infoFactory.getInfo();

  // a globally accessible $scope.user with several fields:
  $http.get('/api/user')
  .success(function(data, status, headers, config) {
    if (status === 200) {
      $scope.user = data;
      $scope.user.refresh_token_expire = format($scope.user.refresh_token_expire);
      $scope.balance = $scope.user.balances[0].balance.toFixed(2);
      // filter out balances from previous semesters
      $scope.user.balances = $scope.user.balances.filter(function(b) {
        return new Date(b.date) > info.start && new Date(b.date) < info.end;
      });
      if (DEBUG) {console.log("angular got a user, " + JSON.stringify($scope.user));}
      var trans = getTrans($scope.user.balances);
      $scope.user.trans = trans;
      console.log(trans);
      var favList = getFav(5,trans);
      $scope.user.allfavListFavs = favList;

    }
    else console.log("Error: " + status);
  });

  $scope.$watch('balance', function(newVal, oldVal){
    // fetching user from server takes a while, so we want to watch this for change and broadcast on change
    if(newVal!=oldVal)
    $scope.$broadcast('balanceChange',{"val":newVal});
  });

  $scope.$watch('user', function(newVal, oldVal){
    // fetching user from server takes a while, so we want to watch this for change and broadcast on change
    if(newVal!=oldVal)
    $scope.$broadcast('userChange',{"val":newVal});
  });
  if (!info.fall && !info.spring) {
    $scope.result = 0.00;
  }
  else {
    var a = $interval(function() {
      var currtime = new Date();
      var percent = (1 - (currtime - info.start) / (info.end - info.start));
      var foodpointsLeft = ($scope.user.balances[0].balance * percent).toFixed(4);
      $scope.remaining = foodpointsLeft;
      $("#progbar").width(percent * 100 + "%");
    }, UPDATE_INTERVAL);
  }
});

// Should eventually replace server-side code for calculating a user's transactions
// Both for sidebar display and calculation of user's total daily and weekly spending values
// Currently used only by getFav method
function getTrans(bals) {
  var arr = [];
  for (var i = 0; i < bals.length; i++) {
    if (bals[i + 1]) {
      var diff = bals[i].balance - bals[i + 1].balance; //newer number subtract older number
      arr.push({
        amount: diff.toFixed(2)*-1, // duke api gives large number of decimal points
        date: format(bals[i].date)
      });
    }
  }
  if (DEBUG) console.log("getTrans returned " + JSON.stringify(arr));
  return arr;
}

// return array of arrays [[cost,freq],[cost2,freq2],...]
function getFreqs(trans) {
  var freqs = [[0,0]];
  // get frequency of each amount spent in trans
  // trans comes in the form [{"amount":"-12.29","date":"2015-10-25T15:01:32.272Z"},{"amount":"-11.60","date":"2015-10-24T18:39:16.613Z"}]
  trans.forEach(function(x){
    var found = false;
    for (var i = 0; i<freqs.length; i++){
      if (freqs[i][0] === x.amount){
        freqs[i][1]++;
        found = true;
      }
    }
    if (!found) freqs.push([x.amount,1]);
  });
  return freqs;
}

// sort array of arrays [[costA,freqhighest],[costB,freqnexthighest],...] and return top n
function getFav(n,trans) {
  var freqs = getFreqs(trans);
  freqs.sort(function(a,b){
    return b[1] - a[1];
  });
  return _.filter(freqs.slice(0,n),function(x){
    return x[1] > 1; // we don't want frequencies of 0 and 1 in the top items.
  });
}

function format(input) {
  var formatted = moment(new Date(input)).format("MMMM Do YYYY, h:mm:ss a");
  return formatted;
}
