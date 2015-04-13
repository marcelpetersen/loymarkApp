var ctrl = angular.module('kenuu.controllers', ['ja.qr']);

ctrl.controller('WelcomeCtrl', [ '$scope', '$timeout', '$state', '$ionicSlideBoxDelegate', function($scope, $timeout, $state, $ionicSlideBoxDelegate){
    localStorage.setItem('animationShown', false);

    var _currentSlideIndex = 0;

    $scope.SignUp = function() {
        swal(
            {   
                title: "Error!",   
                text: "Here's my error message!",   
                type: "error",   
                confirmButtonText: "Cool",
                customClass: "modal-bg",
                confirmButtonColor: "#8f04a9"
            }
        );
    };

    $scope.Enter = function() {
        localStorage.setItem('animationShown', false);
        localStorage.setItem('userAPIKey', "");
        $("#viewWelcome").addClass("animated slideOutDown");
        setTimeout(function(){
            $state.go('tab.kenuu');
        },800);
    };

    $scope.nextSlide = function() {
        $ionicSlideBoxDelegate.next();
    };

    $scope.slideHasChanged = function(index) {
        _currentSlideIndex = index;
    };
}]);

ctrl.controller('QRCodeCtrl', [ '$scope', '$timeout', function($scope, $timeout){
    $timeout(function(){
        $("#viewcontent-QR").addClass("animated slideInUp");
    });
}]);

ctrl.controller('KenuuCtrl', [ '$scope', '$timeout', 'userFactory', 'commerceFactory', '$state', function($scope, $timeout, userFactory, commerceFactory, $state){
    // Code that runs when the View is finished rendering
    $timeout(function(){
        
        var animationShown = localStorage.getItem('animationShown');
        if (animationShown != undefined) animationShown = JSON.parse(animationShown);
        
        if (animationShown) 
        {
            $("#viewKenuu").removeClass("animated slideInUp");
        }
        else 
        { 
            localStorage.setItem('animationShown', true); 
            $("#viewKenuu").show();
            $("#viewKenuu").addClass("animated slideInUp");
            setTimeout(function(){
                $("#viewKenuu").removeClass("animated slideInUp");
            }, 800);
        }
        
        // $("#viewKenuu").show();
    });

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
        })
        .catch(function(err){});

    $scope.getUserImage = function(){
    	if($scope.viewdata.user.Avatar){
    		return $scope.viewdata.user.Avatar;
    	} else {
    		return 'img/ionitron.png';
    	}
    };

    $scope.GoToProfile = function() {
        $state.go("tab.kenuu-profile");
    };

    $scope.GoToRewards = function() {
        commerceFactory.selectedCommerce.clearSelection();
        $state.go("tab.kenuu-prices");
    };
}]);

ctrl.controller('KenuuPricesCtrl', [ '$scope', '$state', 'rewardFactory', 'userFactory', 'commerceFactory', function($scope,$state,rewardFactory,userFactory,commerceFactory){

	$scope.viewdata = {
        searchText: '',
        searchResults: [],
        rewards: [],
        commerceSelected: commerceFactory.selectedCommerce.isSelected(),
        selectedCommerce: commerceFactory.selectedCommerce.get()        
    };

    var imageserverurl = "http://dev.cis-solutions.com/kenuu/imgs/";

    if ($scope.viewdata.commerceSelected)
    {
        alert("Comercio Seleccionado!");
    }

	function LoadData() {
        rewardFactory.active.general(true)
            .then(function(data){
                $("#pleaseWaitSpinner").addClass("animated slideOutUp");
                setTimeout(function() {
                    $scope.viewdata.rewards = data.Elements;
                    console.log($scope.viewdata.rewards);

                    $scope.$apply();                
                }, 150);
            })
            .catch(function(err){                
                $("#pleaseWaitSpinner").addClass("animated slideOutUp");
                
                setTimeout(function() { 
                    $("#errorWhenLoadingDiv").removeClass("animated slideOutUp");
                    setTimeout(function(){
                        $("#errorWhenLoadingDiv").show();                    
                        $("#errorWhenLoadingDiv").addClass("animated slideInDown");    
                    }, 150);                    
                }, 220);
            });
    };    

    userFactory.info.get(true,2)
        .then(function(data){
            $scope.viewdata.user = data;
            var userData = data;            
        })
        .catch(function(err){});

    $scope.OpenRewardDetail = function(reward) {
        rewardFactory.selectedReward.set(reward);
        $state.go('tab.kenuu-rewarddetail');
    };

    $scope.ShowSideMenu = function() {
        $(".reward-sidemenu").removeClass('reward-sidemenu-hidden');
    };

    $scope.HideSideMenu = function() {        
        $(".reward-sidemenu").addClass('reward-sidemenu-hidden');  
    };

    $scope.gDate = function(date) {
        var _date = new Date(parseInt(date.substr(6)));
        return _date.getDate() + "/" + (_date.getMonth()+1) + "/" + _date.getFullYear();
    };

    $scope.$watch('viewdata.searchText', function() {
        if ($scope.viewdata.searchText != "")
        {
            $(".reward-searchpanel").removeClass("reward-searchpanel-hidden");
        }
        else
        {
            $(".reward-searchpanel").addClass("reward-searchpanel-hidden");   
        }
    });    

    $scope.CancelSearch = function() {
        $scope.viewdata.searchText = "";
        $(".reward-searchpanel").removeClass("reward-searchpanel-hidden");
    };

    $scope.Reload = function() {
        $("#errorWhenLoadingDiv").addClass("animated slideOutUp");
        setTimeout(function(){
            $("#pleaseWaitSpinner").removeClass("slideOutUp");
            $("#pleaseWaitSpinner").addClass("animated slideInDown");
            LoadData();
        }, 200);        
    };

    LoadData();
}]);

ctrl.controller('KenuuCommerceCtrl', ['$scope', '$state', 'rewardFactory', 'commerceFactory', function($scope, $state, rewardFactory, commerceFactory){
    $scope.viewdata = {
        selectedReward: rewardFactory.selectedReward.get(),
        selectedCommerce: commerceFactory.selectedCommerce.get()
    };
    
    var imageserverurl = "http://dev.cis-solutions.com/kenuu/imgs/";

    $scope.GoToStores = function() {
        $state.go('tab.kenuu-stores')
    };
    $scope.GoToRewards = function() {
        $state.go('tab.kenuu-prices');
    };
    $scope.GetCommerceImage = function(image) {
        if (image != undefined) 
        {
            if (image != "")
            {
                return imageserverurl + image;
            }
        }

        return "./img/empty.png";
    };
}]);

ctrl.controller('KenuuStoresCtrl', ['$scope','rewardFactory', function($scope, rewardFactory) {
    $scope.viewdata = {
        selectedReward: rewardFactory.selectedReward.get()
    };
}]);

ctrl.controller('KenuuFavCommercesCtrl', [ '$scope', '$state', 'userFactory', 'commerceFactory', function($scope,$state,userFactory,commerceFactory){

	$scope.viewdata = {
        commerces: []
    };

    function LoadData() {
        userFactory.activity.visits.commerce(2)
        .then(function(data){
            $("#favCommercePleaseWaitSpinner").addClass("animated slideOutUp");
            
            setTimeout(function() {                
                $scope.viewdata.commerces = data.VisitedCommerces;
                console.log($scope.viewdata.commerces);

                $("#favcommerces-list").show();
                $("#favcommerces-list").addClass("animated fadeIn");

                $scope.$apply();                
            }, 150);
        })
        .catch(function(err){                
            $("#favCommercePleaseWaitSpinner").addClass("animated slideOutUp");
            
            setTimeout(function() { 
                $("#errorWhenLoadingDiv").removeClass("animated slideOutUp");
                setTimeout(function(){
                    $("#errorWhenLoadingDiv").show();                    
                    $("#errorWhenLoadingDiv").addClass("animated slideInDown");    
                }, 150);                    
            }, 220);
        });;    
    };

    $scope.gDate = function(date) {
        var _date = new Date(parseInt(date.substr(6)));
        return _date.getDate() + "/" + (_date.getMonth()+1) + "/" + _date.getFullYear();
    };

    $scope.GoToCommerce = function(commerce) {
        commerceFactory.selectedCommerce.set(commerce);
        $state.go('tab.kenuu-commerce');
    };

    $scope.Reload = function() {
        $("#errorWhenLoadingDiv").addClass("animated slideOutUp");
        setTimeout(function(){
            $("#favCommercePleaseWaitSpinner").removeClass("slideOutUp");
            $("#favCommercePleaseWaitSpinner").addClass("animated slideInDown");
            LoadData();
        }, 200);        
    };

    LoadData();
}]);

ctrl.controller('KenuuProfileCtrl', ['$scope', '$timeout', 'userFactory', '$state', function($scope, $timeout, userFactory, $state){
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
        })
        .catch(function(err){});

    $scope.SaveProfile = function() {

    };
}]);

ctrl.controller('KenuuRewardDetailCtrl', ['$scope', '$timeout', 'userFactory', 'rewardFactory', 'commerceFactory', '$state', function($scope, $timeout, userFactory, rewardFactory, commerceFactory, $state){

    $scope.viewdata = {
        selectedReward: rewardFactory.selectedReward.get(),
        rewardId: '',
        user: {
            activity: ''
        }
    };

    var imageserverurl = "http://dev.cis-solutions.com/kenuu/imgs/";

    userFactory.info.get(true, 2)
        .then(function(data){
            $scope.viewdata.user = data;

            if ($scope.viewdata.selectedReward.Points <= $scope.viewdata.user.PointsAvailable) {
                $("#btnRedeem").show();
            }
            
            $scope.$apply();
            var userData = data;
        })
        .catch(function(err){});

    $scope.viewdata.rewardId = $scope.viewdata.selectedReward.SRewardID.toString();

    $scope.GetCommerceImage = function(image) {
        if (image != undefined) 
        {
            if (image != "")
            {
                return imageserverurl + image;
            }
        }

        return "./img/empty.png";
    };

    $scope.gDate = function(date) {
        var _date = new Date(parseInt(date.substr(6)));
        return _date.getDate() + "/" + (_date.getMonth()+1) + "/" + _date.getFullYear();
    };

    $scope.GoToCommerce = function() {
        // TODO: Sacar el comercio asociado al premio y definirlo como el seleccionado
        // commerceFactory.selectedCommerce.set(commerce);
        $state.go('tab.kenuu-commerce');
    };

    $scope.RedeemReward = function() {
        swal({   title: "Está seguro?",   text: "Desea canjear este premio?",   type: "warning",   showCancelButton: true,   confirmButtonColor: "#4E0F5B", cancelButtonText:"No",  confirmButtonText: "Si, Canjear!",   closeOnConfirm: false }, 
            function(){   swal("Deleted!", "Your imaginary file has been deleted.", "success"); 
        });
    };
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
