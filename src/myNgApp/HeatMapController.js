angular.module('foodpoints')
.controller("HeatMapController", function($scope,$http,infoFactory,UserService){
  var bucketSize = 5;
  var numBuckets = 4;
  var buckets = {};
  var dayHeatmap = {};
  var hourHeatMap = {};
  var info = infoFactory.getInfo();
  // set $scope.user to resolve the promise returned by UserService.User
  $scope.fetchUser = function() {
    UserService.User.then(function(results){
      $scope.user = results;
    });
  };
  $scope.fetchUser();
  $scope.user = {};
  // wait for promise to resolve
  $scope.$watch('user', function(newVal, oldVal){
  // fetching user from server takes a while, so we want to watch this for change and broadcast on change
    if(newVal!=oldVal){
      $scope.$broadcast('userChange',{"val":newVal});
      console.log(newVal);
      runBody();
    }
  });
  function runBody(){
    $scope.user.trans.forEach(function(exp) {
      if (exp.amount < 0) {
        var timestamp = moment(exp.date).format('X');
        var timestamp2 = moment().startOf('day').hours(moment(exp.date).hours()).format('X');
        var amt = exp.amount * -1;
        dayHeatmap[timestamp] = ~~amt;
        if (!hourHeatMap[timestamp2]) {
          hourHeatMap[timestamp2] = 0;
        }
        hourHeatMap[timestamp2] += ~~amt;
        for (var i = 0; i <= numBuckets; i++) {
          //console.log(amt, i*bucketSize, (i+1)*bucketSize)
          if (i >= numBuckets || (amt > i * bucketSize && amt <= (i + 1) * bucketSize)) {
            //console.log(i, amt)
            buckets[i * bucketSize] ? buckets[i * bucketSize] += amt : buckets[i * bucketSize] = amt;
            break;
          }
        }
      }
    });
    console.log(JSON.stringify(dayHeatmap));
    var cal = new CalHeatMap();
    cal.init({
      // itemSelector: "#animationDuration-a", //new
      // domain: "day", //new
      itemSelector: "#days",
      start: info.fallstart,
      range: 3,
      previousSelector: "#animationDuration-previous",
      nextSelector: "#animationDuration-next",
      itemNamespace: "animationDuration-a",
      domain: "month",
      subDomain: "day",
      highlight: new Date(),
      data: dayHeatmap,
      tooltip: true,
      itemName: ["", ""],
      subDomainTextFormat: function(date, value) {
        return value ? value.toFixed() : "";
      },
      legendColors: {
        min: "#fcffa3",
        max: "#510d63",
        empty: "white"
        // Will use the CSS for the missing keys
      },
      legendVerticalPosition: "center",
      legendOrientation: "vertical",
      cellSize: 16
    });
    var cal2 = new CalHeatMap();
    cal2.init({
      itemSelector: "#hours",
      start: new Date(),
      range: 1,
      domain: "day",
      subDomain: "hour",
      domainLabelFormat: "",
      subDomainDateFormat: function(date) {
        return moment(date).format("ha"); // Use the moment library to format the Date
      },
      cellPadding: 5,
      verticalOrientation: true,
      colLimit: 12,
      tooltip: true,
      data: hourHeatMap,
      itemName: ["", ""],
      subDomainTextFormat: function(date, value) {
        return value ? value.toFixed() : "";
      },
      legendColors: {
        min: "#fcffa3",
        max: "#510d63",
        empty: "white"
        // Will use the CSS for the missing keys
      },
      cellSize: 16
    });


  }


});
