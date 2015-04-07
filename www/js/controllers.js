var ctrl = angular.module('kenuu.controllers', []);

ctrl.controller('QRCodeCtrl', [ '$scope', function($scope){
}]);

ctrl.controller('KenuuCtrl', [ '$scope', 'userFactory', '$state', function($scope,userFactory,$state){

	$scope.viewdata = {
        qrcode: "Kenuu",
        counter: 1,
        positions: [],
        user: {
            activity: ''
        }
    };

    userFactory.info.get(true,2)
        .then(function(data){
            $scope.viewdata.user = data;
            $scope.$apply();
            var userData = data;
            console.log(userData);
        })
        .catch(function(err){});

    $scope.getUserImage = function(){
    	if($scope.viewdata.user.Avatar){
    		return $scope.viewdata.user.Avatar;
    	} else {
    		return 'img/ionitron.png';
    	}
    };

    // console.log('STATE:',$state.current.name);

}]);

ctrl.controller('KenuuPricesCtrl', [ '$scope', 'rewardFactory', 'userFactory', function($scope,rewardFactory,userFactory){

	$scope.viewdata = {
        searchText: ''
    };

	rewardFactory.active.general(true)
        .then(function(data){
            $scope.viewdata.rewards = data.Elements;
            $scope.$apply();
        });

    userFactory.info.get(true,2)
        .then(function(data){
            $scope.viewdata.user = data;
            var userData = data;
            console.log(userData);
        })
        .catch(function(err){});

}]);

ctrl.controller('KenuuFavCommercesCtrl', [ '$scope', 'userFactory', function($scope,userFactory){

	$scope.viewdata = {
        commerces: {}
    };

    userFactory.activity.visits.commerce(2)
        .then(function(data){
            $scope.viewdata.commerces = data.VisitedCommerces;
            $scope.$apply();
            console.log($scope.viewdata.commerces);
        });

}]);

ctrl.controller('CommercesCtrl', [ '$scope', 'commerceFactory', function($scope, commerceFactory){

  	$scope.viewdata = {
        brands: ''
    };

    commerceFactory.general(2)
        .then(function(data){
            console.log('DATA!!!',data);
            $scope.viewdata.brands = data;
            $scope.$apply();
        });

}]);

ctrl.controller('CommercesDetailCtrl', [ '$scope', '$stateParams', 'commerceFactory', function($scope, $stateParams, commerceFactory){

  	$scope.viewdata = {
        commerceSelected: $stateParams.brandID,
        commerce: '',
        commerceStores: []
    };

    $scope.rateFunction = function(rating) {
        $scope.viewdata.rated = true;
        setTimeout(function(){
            $scope.viewdata.rated = false;
            $scope.$apply();
        },3000);
    };

    commerceFactory.general(2)
        .then(function(data){
            for(var i=0; i<data.length; i++){
                if(data[i].EntityID==$scope.viewdata.commerceSelected){
                    $scope.viewdata.commerce = data[i];
                    $scope.$apply();
                    console.log('COMMERCE SELECTED',$scope.viewdata.commerce);
                }
            }
        });

    commerceFactory.stores.general({tokenID:2,EntityID:$scope.viewdata.commerceSelected})
        .then(function(data){
            console.log('Stores of commerce:',data);
            $scope.viewdata.commerceStores = data;
        });
}]);

ctrl.controller('MapCtrl', [ '$scope', function($scope){
  	$scope.settings = {
    	enableFriends: true
  	};
}]);
