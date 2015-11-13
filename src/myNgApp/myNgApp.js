angular.module('foodpoints', [])

.controller("AverageSpendingController", function($scope, $http) {
  var globalDaily;
  var globalWeekly;
  $http.get('/api/spending')
    .then(function(response) {
      $scope.average = parseFloat(response.data).toFixed(2);
      globalDaily = $scope.average;
    });
  $http.get('/api/personal')
    .then(function(res) {
      var checkDailyData = res.data;
      var personalDaily = parseFloat(checkDailyData.day);
      var personalWeekly = parseFloat(checkDailyData.week);
      $scope.dailyTotal = isNaN(personalDaily) ? "Coming Soon!" : personalDaily.toFixed(2);
      $scope.weeklyTotal = isNaN(personalWeekly) ? "Coming Soon!" : personalWeekly.toFixed(2);
    });
  $http.get('/api/spending/weekly')
    .then(function(res) {
      var weeklyTotal = res.data;
      // console.log("Response received for weekly total is " + weeklyTotal);
      var weekTotalFloat = parseFloat(weeklyTotal);
      globalWeekly = 7 * globalDaily;
      var weekTotalFloat = isNaN(weekTotalFloat) ? globalWeekly : weekTotalFloat.toFixed(2);
      $scope.wkAvg = weekTotalFloat;
    });
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
    // console.log(budget);
    $http.post('/api/budgets/', budget)
      .success(function(data, status, headers, config) {
        // console.log(data);
        getBudgets($scope, $http);
      });
  };
  $scope.delete = function(budget) {
    $http.delete('/api/budgets/' + budget._id)
      .success(function(data, status, headers, config) {
        getBudgets($scope, $http);
      });
  };
})

// a factory with getter function to return commonly used constants
.factory('infoFactory', function() {
  var service = {};
  var currdate = new Date();
  var acadyear = currdate.getMonth() > 6 ? currdate.getFullYear() : currdate.getFullYear() - 1;
  var FALL_LENGTH = 16 * 7;
  var SPRING_LENGTH = 16 * 7 + 4;
  var fallstart = getFirstWeekday(1, 19, 7, acadyear); //monday after aug 19 of acad year
  var fallend = addDays(fallstart, FALL_LENGTH);
  var springstart = getFirstWeekday(3, 2, 0, acadyear + 1); //wednesday after jan 2 of following year
  var springend = addDays(springstart, SPRING_LENGTH);
  var fall = currdate > fallstart && currdate < fallend;
  var spring = currdate > springstart && currdate < springend;
  var semStart = spring ? springstart : fallstart;
  var semEnd = spring ? springend : fallend;

  service.getInfo = function() {
    return {
      "UPDATE_INTERVAL": 200,
      "DEFAULT_FOOD_POINTS": 2152,
      "MAX_AMOUNT_BALANCEADDITION": 1500,
      "fall": fall,
      "spring": spring,
      "start": semStart,
      "end": semEnd,
      "fallstart": fallstart,
      "fallend": fallend,
      "springstart": springstart,
      "springend": springend
    };
  };
  return service;
})

// service to return user and change user if necessary
.service('UserService', function($rootScope, $http, $q, infoFactory) {
  var info = infoFactory.getInfo();
  this.User = $http.get('/api/user')
    .then(function(res) {
      console.log("Data fetched using UserService Factory");
      return res.data;
    })
    .then(function(res) {
      res.refresh_token_expire = format(res.refresh_token_expire);
      res.balance = res.balances[0].balance.toFixed(2);
      //filter out balances from previous semesters
      res.balances = res.balances.filter(function(b) {
        return new Date(b.date) > info.start && new Date(b.date) < info.end;
      });
      // parse balance list into list of transactions and favourites
      res.trans = getTrans(res.balances);
      res.favList = getFav(5, res.trans);
      return res;

    });

  this.UserChange = function(newUserObj) {
    this.User = newUserObj;
  };

});

// HELPER FUNCTIONS
// ----------------
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
addDays = function addDays(date, days) {
  var result = new Date(date);
  result.setDate(date.getDate() + days);
  return result;
};

getFirstWeekday = function(dayOfWeek, day, month, year) {
  //gets the first specified weekday following the given month, year, day
  var myDate = new Date();
  myDate.setHours(0, 0, 0, 0);
  myDate.setYear(year);
  myDate.setDate(day);
  myDate.setMonth(month);
  // Find day of week.
  while (myDate.getDay() !== dayOfWeek) {
    myDate.setDate(myDate.getDate() + 1);
  }
  return myDate;
};

// Should eventually replace server-side code for calculating a user's transactions
// Both for sidebar display and calculation of user's total daily and weekly spending values
// Currently used only by getFav method
function getTrans(bals, format) {
  var arr = [];
  for (var i = 0; i < bals.length; i++) {
    if (bals[i + 1]) {
      var diff = bals[i].balance - bals[i + 1].balance; //newer number subtract older number
      arr.push({
        amount: diff.toFixed(2), // duke api gives large number of decimal points
        date: bals[i].date
      });
    }
  }
  return arr;
}

// return array of arrays [[cost,freq],[cost2,freq2],...]
function getFreqs(trans) {
  var freqs = [[0, 0]];
  // get frequency of each amount spent in trans
  // trans comes in the form [{"amount":"-12.29","date":"2015-10-25T15:01:32.272Z"},{"amount":"-11.60","date":"2015-10-24T18:39:16.613Z"}]
  trans.forEach(function(x) {
    var found = false;
    for (var i = 0; i < freqs.length; i++) {
      if (freqs[i][0] === x.amount) {
        freqs[i][1]++;
        found = true;
      }
    }
    if (!found) freqs.push([x.amount, 1]);
  });
  return freqs;
}

// sort array of arrays [[costA,freqhighest],[costB,freqnexthighest],...] and return top n
function getFav(n, trans) {
  var freqs = getFreqs(trans);
  freqs.sort(function(a, b) {
    return b[1] - a[1];
  });
  return _.filter(freqs.slice(0, n), function(x) {
    return x[1] > 1; // we don't want frequencies of 0 and 1 in the top items.
  });
}

function format(input) {
  var formatted = moment(new Date(input)).format("MMMM Do YYYY, h:mm:ss a");
  return formatted;
}
