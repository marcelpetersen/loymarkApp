var ctrl = angular.module('kenuu.controllers', ['ja.qr']);

ctrl.controller('NoConnectionCtrl', ['$scope', '$state', function($scope, $state){    
}]);

ctrl.controller('WelcomeCtrl', [ '$scope', '$timeout', '$state', '$ionicSlideBoxDelegate', 'userFactory', 'referenceIDFactory', function($scope, $timeout, $state, $ionicSlideBoxDelegate, userFactory, referenceIDFactory){
    localStorage.setItem('animationShown', false);

    $timeout(function(){
        setTimeout(function(){
            $("#welcomeimg1").addClass("animated zoomIn");
        }, 1100);        
    });

    $scope.viewdata = {
        email: "",
        password: ""
    };

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

        // Performs the Login Operation
        userFactory.session.login(
            {
                email: $scope.viewdata.email,
                password: $scope.viewdata.password
            }
        )
        .then(function(data) {
            // Sets the flags indicating the user has already logged.
            localStorage.setItem('animationShown', false);

            referenceIDFactory.setReferenceID(data.ReferenceID);            
            
            $("#viewWelcome").addClass("animated slideOutDown");
            
            setTimeout(function(){
                $state.go('tab.kenuu');
            },800);
        })
        .catch(function(data){
            console.log(data)
            swal(
                {   
                    title: "!!!",   
                    text: "Nop! No puedes entrar",   
                    type: "error",   
                    confirmButtonText: "Ok",
                    customClass: "modal-bg",
                    confirmButtonColor: "#8f04a9"
                }
            );
        });

        // Sets the flags indicating the user has already logged.
        // localStorage.setItem('animationShown', false);        
        // localStorage.setItem('userAPIKey', "Prueba");
        
        // $("#viewWelcome").addClass("animated slideOutDown");
        
        // setTimeout(function(){
        //     $state.go('tab.kenuu');
        // },800);
    };

    $scope.nextSlide = function() {
        $ionicSlideBoxDelegate.next();
    };

    $scope.slideHasChanged = function(index) {
        _currentSlideIndex = index;
    };
}]);

ctrl.controller('QRCodeCtrl', [ '$scope', '$timeout', 'deviceFactory', function($scope, $timeout, deviceFactory){
    $timeout(function(){
        $("#viewcontent-QR").show();
        $("#viewcontent-QR").addClass("animated slideInUp");        
    });
}]);

ctrl.controller('KenuuCtrl', [ '$scope', '$timeout', 'userFactory', 'commerceFactory', '$state', '$ionicLoading', 'setupView', 'emailService', function($scope, $timeout, userFactory, commerceFactory, $state, $ionicLoading, setupView, emailService){
    $scope.viewdata = {
        qrcode: "Kenuu",
        counter: 1,
        positions: [],
        user: {
            activity: ''
        }
    };

    // DEBUG CODE
    $scope.gDate = function(date) {
        var _date = new Date(parseInt(date.substr(6)));
        console.log(_date);
        return _date.getDate() + "/" + (_date.getMonth()+1) + "/" + _date.getFullYear();
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

    // Required to Show the Top Bar Setup View
    $scope.ShowSetupView = function() {setupView.Show($scope);};
    $scope.CloseSetup = function() {setupView.Close($scope);};
    $scope.ContactUs = function() {emailService.ContactCustomerService();}
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

ctrl.controller('KenuuFavCommercesCtrl', [ '$scope', '$state', 'userFactory', 'commerceFactory', 'dateService', function($scope,$state,userFactory,commerceFactory,dateService){

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

    $scope.calcLapse = function(date) {        
        return dateService.lapseSince(date);
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
                        $("#pleaseWaitSpinner").hide();
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

    $scope.GoToCommerce = function(id) {        
        // TODO: Sacar el comercio asociado al premio y definirlo como el seleccionado
        commerceFactory.get("", id)
            .then(function(data){
                commerceFactory.selectedCommerce.set(data[0]);     
                $state.go('tab.kenuu-commerce');
            })
            .catch(function(err){
                console.log(err);
            });
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

ctrl.controller('MapCtrl', [ '$scope', 'commerceFactory', '$ionicLoading', '$cordovaGeolocation', function($scope, commerceFactory, $ionicLoading, $cordovaGeolocation){
  	$scope.settings = {
    	enableFriends: true
  	};

    var _map = false;
    var _locationMarkerCreated = false;

    $scope.GoToCommerce = function() {
        alert(1);
        //$state.go("tab.kenuu-commerce");
    };

    $scope.centerOnMe = function() {
        if (!_map) return;
        var posOptions = {timeout: 10000, enableHighAccuracy: false};
        $ionicLoading.show({template: 'Por favor espere <br><ion-spinner icon="dots" class="spinner"></ion-spinner>'});
        $cordovaGeolocation
            .getCurrentPosition(posOptions)
            .then(function (position) {

                var lat  = position.coords.latitude
                var long = position.coords.longitude

                var myLatlng = new google.maps.LatLng(lat, long);
                    
                if (!_locationMarkerCreated) {
                    var marker = new google.maps.Marker({
                        position: myLatlng,
                        title: "YO!",
                        map: _map                    
                    });    
                    _locationMarkerCreated = true;
                }                

                _map.setCenter(myLatlng);
                $ionicLoading.hide();

            }, function(err) {
                // error
                $ionicLoading.hide();
            }
        );
    };

    $scope.mapCreated = function(map) {
        $ionicLoading.show({template: 'Por favor espere <br><ion-spinner icon="dots" class="spinner"></ion-spinner>'});

        // Sets the map into a local variable.
        _map = map;        

        commerceFactory.stores.general(0,0).
            then(function(data){    
                console.log("Stores:");
                console.log(data);
                var infoWindow = new google.maps.InfoWindow();

                var j=data.length;
                for (var i=0;i<j;i++)
                {
                    var myLatlng = new google.maps.LatLng(data[i].LocationLatitude, data[i].LocationLongitude);
                    
                    var marker = new google.maps.Marker({
                        position: myLatlng,
                        title: data[i].Name,
                        desc: data[i].Description,
                        info: data[i].Address,
                        horario: "Pendiente",
                        telefono: data[i].Phone,                        
                        map: map,
                        entityID: data[i].SubEntityID,
                        icon: "./img/mapicon.png"
                    });

                    var infowindow = new google.maps.InfoWindow({});
                    google.maps.event.addListener(marker, 'click', (function(marker, i) {
                        return function() {
                            if (infowindow) {
                                infowindow.close();
                            }

                            var title = "";
                            title += "<div style='font-weight:bold'>" + marker.title + "</div>";
                            title += "<div>" + marker.desc + "</div>";
                            title += "<div class='text=center'><a ng-click='GoToCommerce()' class='button button-small button-calm profile-btn' style='width:110px;'>Ver Comercio</a></div>"


                            infoWindow.setContent(
                                "<div class='map-info-window'>" +
                                title +
                                "</div>"
                            );
                            infoWindow.open(map, marker);
                        }
                    })(marker));
                }

                $scope.centerOnMe();
                $ionicLoading.hide();
            })
            .catch(function(err){
                console.log(err);
                $ionicLoading.hide();
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

ctrl.controller('ActivityCtrl', [ '$scope', 'userFactory', 'socialSharing', function($scope, userFactory, socialSharing){
    
    $scope.viewdata = {        
        user: {
            activity: ''
        }
    };

    function LoadData() {
        LoadData_User();        
    };

    function LoadData_User() {
        userFactory.info.get(true,2)
            .then(function(data){                      
                $scope.viewdata.user = data;
                $scope.$apply();                
                LoadData_Activity($scope.viewdata.user.AccountID)
            })
            .catch(function(err){ 
                console.log(err)               
            });
    };

    function LoadData_Activity(userID) {
        userFactory.activity.all(userID)
            .then(function(data){
                $("#pleaseWaitSpinner").addClass("animated slideOutUp");

                setTimeout(function() {
                    $scope.viewdata.user.activity = data.Elements;
                    $scope.$apply();

                    $("#activityListDiv").show();
                    $("#activityListDiv").addClass("animated fadeIn");
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

    $scope.gDate = function(date) {
        var _date = new Date(parseInt(date.substr(6)));
        return _date.getDate() + "/" + (_date.getMonth()+1) + "/" + _date.getFullYear();
    };

    $scope.GetActivityIcon = function(activityType) {
        if (activityType === "V") return "ion-android-pin";
        if (activityType === "R") return "ion-ribbon-a";
    };

    $scope.GetActivityPointsLabel = function(activityType) {
        if (activityType === "V") return "Puntos Ganados:";
        if (activityType === "R") return "Puntos Canjeados:";
    };

    $scope.ShareViaFacebook = function(activity) {        
        var _msg = "";
        if (activity.ActivityType == "V")
        {
            _msg = "@kenuu - Fui a " + activity.SubEntityName;
        }

        if (activity.ActivityType == "R")
        {
            _msg = "@kenuu - Me gané ésto: " + activity.RewardName + " en " + activity.SubEntityName;
        }

        socialSharing.ShareViaFacebook(_msg, "", "")
            .then(
                function(result) {
                  // Success!
                }, function(err) {
                  // An error occurred. Show a message to the user
                }
            );
    };

    $scope.ShareViaTwitter = function(activity) {        
        var _msg = "";
        if (activity.ActivityType == "V")
        {
            _msg = "@kenuu - Fui a " + activity.SubEntityName;
        }

        if (activity.ActivityType == "R")
        {
            _msg = "@kenuu - Me gané ésto: " + activity.RewardName + " en " + activity.SubEntityName;
        }

        socialSharing.ShareViaTwitter(_msg, "", "")
            .then(
                function(result) {
                  // Success!
                }, function(err) {
                  // An error occurred. Show a message to the user
                }
            );
    };

    LoadData();
}]);

ctrl.controller('WhatsNewCtrl', ['$scope', '$cordovaInAppBrowser', function($scope, $cordovaInAppBrowser, setupView, emailService) {

    $scope.OpenTwitter = function() {
        var options = {
            location: 'yes',
            clearcache: 'yes',
            toolbar: 'yes'
        };

        $cordovaInAppBrowser.open('https://twitter.com/kenuupops', '_blank', options)
            .then(function(event) {
            // success
            })
            .catch(function(event) {
            // error
            });
    };
    $scope.OpenFacebook = function() {
        var options = {
            location: 'yes',
            clearcache: 'yes',
            toolbar: 'yes'
        };

        $cordovaInAppBrowser.open('http://www.facebook.com/kenuupops', '_blank', options)
            .then(function(event) {
            // success
            })
            .catch(function(event) {
            // error
            });
    };
}]);