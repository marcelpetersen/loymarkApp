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
        // Sets the flags indicating the user has already logged.
        localStorage.setItem('animationShown', false);        
        localStorage.setItem('userAPIKey', "Prueba");
        
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

ctrl.controller('KenuuCtrl', [ '$scope', '$timeout', 'userFactory', 'commerceFactory', '$state', '$ionicLoading', function($scope, $timeout, userFactory, commerceFactory, $state, $ionicLoading){
    $scope.viewdata = {
        qrcode: "Kenuu",
        counter: 1,
        positions: [],
        user: {
            activity: ''
        }
    };

    $ionicLoading.show({template: 'Por favor espere <br><ion-spinner icon="dots" class="spinner"></ion-spinner>'});

    function ShowView() {
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
    };

    function ShowErrorView() {
        $("#viewKenuuError").show();
        $("#viewKenuuError").addClass("animated slideInUp");
    };

    function LoadData() {
        userFactory.info.get(true,2)
            .then(function(data){  
                $ionicLoading.hide();              
                $scope.viewdata.user = data;
                $scope.$apply();
                
                var userData = data;
                ShowView();
            })
            .catch(function(err){
                $ionicLoading.hide();
                ShowErrorView();
            });
    };

    // Code that runs when the View is finished rendering
    $timeout(function(){
        LoadData();        
    });
    
    $scope.ReloadData = function() {
        $("#viewKenuuError").hide();
        $ionicLoading.show({template: 'Por favor espere <br><ion-spinner icon="dots" class="spinner"></ion-spinner>'});
        setTimeout(function() {
            LoadData();    
        }, 150);
    };

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
        console.log(reward);
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
        console.log(commerce);
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

ctrl.controller('KenuuCommerceCtrl', ['$scope', '$state', 'rewardFactory', 'commerceFactory', 'userFactory', '$window', '$cordovaEmailComposer', function($scope, $state, rewardFactory, commerceFactory, userFactory, $window, $cordovaEmailComposer){
    $scope.viewdata = {
        selectedReward: rewardFactory.selectedReward.get(),
        selectedCommerce: commerceFactory.selectedCommerce.get()
    };
    
    userFactory.info.get(false, "")
        .then(function(data){            
            $("#pleaseWaitSpinner").addClass("animated slideOutUp");
            setTimeout(function() {
                $scope.viewdata.user = data;
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

    var imageserverurl = "http://dev.cis-solutions.com/kenuu/imgs/";

    $scope.gDate = function(date) {
        var _date = new Date(parseInt(date.substr(6)));
        return _date.getDate() + "/" + (_date.getMonth()+1) + "/" + _date.getFullYear();
    };

    $scope.GoToStores = function() {
        $state.go('tab.kenuu-stores');
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
    $scope.FormatField = function(data) {
        if ((!data)||(data === null)||(data===""))
        {
            return "No disponible";
        }
        else
        {
            return data;
        }
    };
    $scope.ComposeEmail = function(storeEmail) {
        var email = {
            to: storeEmail,
            cc: $scope.viewdata.user.Email,
            subject: 'Kenuu - Asistencia al Cliente',
            body: 'Quiero Ayuda!',
            isHtml: true
        };

        $cordovaEmailComposer.open(email).then(null, function () {
            // TODO...
        });
    };
}]);

ctrl.controller('KenuuStoresCtrl', ['$scope','rewardFactory', '$window', '$cordovaActionSheet', 'commerceFactory', 'userFactory', function($scope, rewardFactory, $window, $cordovaActionSheet, commerceFactory, userFactory) {
    $scope.viewdata = {
        selectedReward: rewardFactory.selectedReward.get(),
        selectedCommerce: commerceFactory.selectedCommerce.get(),
        stores: []
    };

    var imageserverurl = "http://dev.cis-solutions.com/kenuu/imgs/";

    userFactory.info.get(false, "")
        .then(function(data){
            $scope.viewdata.user = data;            

            commerceFactory.stores.general($scope.viewdata.user.AccountID, $scope.viewdata.selectedCommerce.EntityID)
                .then(function(data){                    
                    $("#pleaseWaitSpinner").addClass("animated slideOutUp");
                        setTimeout(function() {                                                       
                            $scope.viewdata.stores = data;
                            $scope.$apply();
                            $("#storesListDiv").show();
                            $("#storesListDiv").addClass("animated fadeIn"); 
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
        })
        .catch(function(err){
            console.log(err);
        });

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

    $scope.GoToAddress = function(address) {
        var options = {
            title: 'Cómo desea navegar hasta esa dirección?',
            buttonLabels: ['Usando Waze'],
            addCancelButtonWithLabel: 'Cancelar',
            androidEnableCancelButton : true,
            winphoneEnableCancelButton : true
            // addDestructiveButtonWithLabel : 'Vamos!'
        };
        $cordovaActionSheet.show(options)
            .then(function(btnIndex) {
                var index = btnIndex;
                if (index == 1) {
                    $window.open("waze://?q="+ address);
                }
            });
    };
}]);

ctrl.controller('KenuuProfileCtrl', ['$scope', '$timeout', 'userFactory', '$state', '$ionicHistory', function($scope, $timeout, userFactory, $state, $ionicHistory){
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

    $scope.DoLogout = function() {
        userFactory.session.logout();
        $ionicHistory.clearHistory();
        $ionicHistory.clearCache();
        $state.go("welcome");
    };
}]);

ctrl.controller('KenuuRewardDetailCtrl', ['$scope', '$timeout', 'userFactory', 'rewardFactory', 'commerceFactory', '$state', '$ionicLoading', function($scope, $timeout, userFactory, rewardFactory, commerceFactory, $state, $ionicLoading){

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
        swal(
            {   
                title: "Está seguro?",   
                text: "Desea canjear este premio?",   
                type: "warning",   
                showCancelButton: true,   
                confirmButtonColor: "#4E0F5B", 
                cancelButtonText:"No",  
                confirmButtonText: "Si, Canjear!",   
                closeOnConfirm: true 
            }, 
            function()
            {   
                $ionicLoading.show({template: 'Por favor espere <br><ion-spinner icon="dots" class="spinner"></ion-spinner>'});
                
                setTimeout(function() {
                    $ionicLoading.hide();
                    swal(
                    {
                        title: "Listo!",
                        text: "Ya tienes tu premio en la sección de 'mis premios'.",
                        confirmButtonColor: "#8f04a9",
                        type: "success" 
                    });
                }, 1500);
            }
        );
    };
}]);

// ctrl.controller('CommercesCtrl', [ '$scope', 'commerceFactory', function($scope, commerceFactory){

//   	$scope.viewdata = {
//         brands: ''
//     };

//     commerceFactory.general(2)
//         .then(function(data){
//             console.log('DATA!!!',data);
//             $scope.viewdata.brands = data;
//             $scope.$apply();
//         });
// }]);

// ctrl.controller('CommercesDetailCtrl', [ '$scope', '$stateParams', 'commerceFactory', function($scope, $stateParams, commerceFactory){

//   	$scope.viewdata = {
//         commerceSelected: $stateParams.brandID,
//         commerce: '',
//         commerceStores: []
//     };

//     $scope.rateFunction = function(rating) {
//         $scope.viewdata.rated = true;
//         setTimeout(function(){
//             $scope.viewdata.rated = false;
//             $scope.$apply();
//         },3000);
//     };

//     commerceFactory.general(2)
//         .then(function(data){
//             for(var i=0; i<data.length; i++){
//                 if(data[i].EntityID==$scope.viewdata.commerceSelected){
//                     $scope.viewdata.commerce = data[i];
//                     $scope.$apply();
//                     console.log('COMMERCE SELECTED',$scope.viewdata.commerce);
//                 }
//             }
//         });

//     commerceFactory.stores.general({tokenID:2,EntityID:$scope.viewdata.commerceSelected})
//         .then(function(data){
//             console.log('Stores of commerce:',data);
//             $scope.viewdata.commerceStores = data;
//         });
// }]);

ctrl.controller('MapCtrl', [ '$scope', 'commerceFactory', '$ionicLoading', function($scope, commerceFactory, $ionicLoading){
  	$scope.settings = {
    	enableFriends: true
  	};

    $scope.mapCreated = function(map) {
        $ionicLoading.show({template: 'Por favor espere <br><ion-spinner icon="dots" class="spinner"></ion-spinner>'});               

        commerceFactory.stores.general(0,0).
            then(function(data){                
                var j=data.length;
                for (var i=0;i<j;i++)
                {
                    var myLatlng = new google.maps.LatLng(data[i].LocationLatitude, data[i].LocationLongitude);
                    var marker = new google.maps.Marker({
                        position: myLatlng,
                        map: map,
                        title: data[i].Name
                    });
                }
                $ionicLoading.hide();
            })
            .catch(function(err){
                console.log(err);
            });
    };
}]);

ctrl.controller('SearchCtrl', [ '$scope', function($scope){
    $scope.viewdata = {
        doingSearch: false,
        searchResults: [],
        searchText: ""
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
    $scope.ClearSearch = function() {
        $scope.viewdata.searchText = "";
        $(".reward-searchpanel").addClass("reward-searchpanel-hidden");
    };
}]);

ctrl.controller('ActivityCtrl', [ '$scope', 'userFactory', function($scope, userFactory){
    
    $scope.viewdata = {        
        user: {
            activity: ''
        }
    };

    function LoadData() {
        LoadData_User();
        // LoadData_Activity();        
    };

    function LoadData_User() {
        userFactory.info.get(true,2)
            .then(function(data){                      
                $scope.viewdata.user = data;
                $scope.$apply();                
                var userData = data;
            })
            .catch(function(err){ 
                console.log(err)               
            });
    };

    function LoadData_Activity() {
        userFactory.activity.visits.general()
            .then(function(data){
                $("#pleaseWaitSpinner").addClass("animated slideOutUp");
                setTimeout(function() {
                    $scope.viewdata.user = data;
                    $scope.$apply();
                    var userData = data;
                    console.log(data);
                }, 150);            
            })
            .catch(function(err){ 
                console.log(err);           
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
