angular.module('foodpoints')
.controller("ProjectionsController", function($scope,$http,infoFactory){
  var info = infoFactory.getInfo();
  $scope.userFetchedFromServer={"Fetched":"No","value":""};

  // wait for user to load in UserController before firing events here.
  $scope.$on('userChange', function(event, args){
       $scope.userFetchedFromServer.Fetched="Yes";
       $scope.userFetchedFromServer.value=args.val;

       var addedTotal = getDeposits($scope.user.trans);
       var firstBal = $scope.user.balances[0];
       var lastBal = $scope.user.balances[$scope.user.balances.length-1];
       var delta = lastBal.balance - firstBal.balance - addedTotal;
       var timedelta = moment(firstBal.date).diff(lastBal.date);
       var slope = delta / timedelta;
       //extrapolate line to semester start/end
       var projectionStart = moment(firstBal.date).diff(info.start) * slope + firstBal.balance;
       var projectionEnd = moment(firstBal.date).diff(info.end) * slope + firstBal.balance+addedTotal;
       console.log(firstBal);
       //compute estimated usages for day, week, month
       var day = moment.duration(1, 'day').asMilliseconds() * slope;
       var week = moment.duration(1, 'week').asMilliseconds() * slope;
       var month = moment.duration(1, 'month').asMilliseconds() * slope;
       $scope.projections = [{
           time: "Starting Balance",
           amount: projectionStart
       },{
           time:"Added Balance",
           amount: addedTotal
       }, {
           time: "Ending Balance",
           amount: projectionEnd
       }, {
           time: "Per day",
           amount: day
       }, {
           time: "Per week",
           amount: week
       }, {
           time: "Per month",
           amount: month
       }];
   });

});
//get amount of $ added to account
function getDeposits(trans){
  var deposits = [];
  trans.forEach(function(exp) {
    // exp.amount < 0 means money was added.
    if ((exp.amount < 0)&&(exp.amount < MAX_AMOUNT_BALANCEADDITION)) {
        deposits.push(exp.amount);
    }
  });
  return _.sum(deposits);
}
