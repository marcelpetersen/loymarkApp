var ctrl = angular.module('kenuu.controllers', ['ja.qr']);

ctrl.controller('NoConnectionCtrl', ['$scope', '$state', function($scope, $state){    
}]);

ctrl.controller('WelcomeCtrl', ['$scope', '$timeout', '$state', '$ionicSlideBoxDelegate', 'userFactory', 'referenceIDFactory', '$ionicLoading', '$cordovaKeyboard', '$cordovaPush', 'deviceFactory', '$cordovaBarcodeScanner', '$ionicModal', function($scope, $timeout, $state, $ionicSlideBoxDelegate, userFactory, referenceIDFactory, $ionicLoading, $cordovaKeyboard, $cordovaPush, deviceFactory, $cordovaBarcodeScanner, $ionicModal){
    localStorage.setItem('animationShown', false);
    
    // cordova.plugins.Keyboard.disableScroll(true);

    $timeout(function(){
        $("#welcome-content").addClass("animated slideInUp");
        setTimeout(function(){
            $("#welcomeimg1").addClass("animated zoomIn");
            $ionicLoading.hide();
        }, 1100);        
    });

    $scope.viewdata = {
        signup: {
            email: "",
            password: "",
            email_invalid: false,
            password_invalid: false
        },
        login: {
            email: "",
            password: "",
            email_invalid: false,
            password_invalid: false
        }
    };

    var _currentSlideIndex = 0;

    var iosConfig = {
        "badge": true,
        "sound": true,
        "alert": true,
    };

    $scope.SignUp = function() {
        // Validates the information from the form
        if ($scope.viewdata.signup.email === "")
        {
            $scope.viewdata.signup.email_invalid = true;
            ShowFormErrorMsg("Te falta el correo!");
            return;
        }
        else
        {
            $scope.viewdata.signup.email_invalid = false;
        }
        if ($scope.viewdata.signup.password === "")
        {
            $scope.viewdata.signup.password_invalid = true;
            ShowFormErrorMsg("Te falta el password!");
            return;
        }
        else
        {
            $scope.viewdata.signup.password_invalid = false;
        }

        $ionicLoading.show({template: 'Por favor espere <br><ion-spinner icon="dots" class="spinner"></ion-spinner>'});

        userFactory.session.signup({email:$scope.viewdata.signup.email, password:$scope.viewdata.signup.password})
            .then(function(data){
                if ((data.status == true)||(data.status == "true"))
                {
                    // Sets the flags indicating the user has already logged.
                    localStorage.setItem('animationShown', false);

                    referenceIDFactory.setReferenceID(data.data.response.ReferenceID); 
                    // cordova.plugins.Keyboard.disableScroll(false);
                    $ionicLoading.hide();
                    ShowFormMsg('Listo!', 'Ya quedaste registrado.');
                    $state.go('tab.qrcode');   
                }
                else
                {
                    ShowFormErrorMsg("Oops!, no se pudo terminar el registro.");
                }
            })
            .catch(function(err){
                $ionicLoading.hide();

                if (err.data != undefined)
                {
                    if (err.data.responseCode == "MO0011") 
                    {
                        ShowFormErrorMsg(err.data.message);
                    }
                    else
                    {
                        ShowFormErrorMsg("Oops!, no se pudo terminar el registro.");
                    }
                } 
                else
                {
                    ShowFormErrorMsg(err);
                }               
            });
    };

    function ShowFormErrorMsg(msg) {
        $cordovaKeyboard.close();
        setTimeout(function(){            
            swal(
                {   
                    title: "Oops!",   
                    text: msg,   
                    type: "error",   
                    confirmButtonText: "Ok",
                    customClass: "modal-bg",
                    confirmButtonColor: "#8f04a9"
                }
            );
        }, 250);        
    };

    function ShowFormMsg(title, msg) {
        $cordovaKeyboard.close();
        setTimeout(function(){            
            swal(
                {   
                    title: title,   
                    text: msg,                          
                    confirmButtonText: "Ok",
                    customClass: "modal-bg",
                    confirmButtonColor: "#8f04a9"
                }
            );
        }, 250);        
    };

    $scope.ValidateEmail = function() {
        console.log("...")
        // If the email exists but no password is setup
        $ionicModal.fromTemplateUrl('templates/modalLogin.html', {
            scope: $scope,
            animation: 'slide-in-up'
        }).then(function(modal) {
            $scope.modal = modal;
            $scope.modal.show();
        });

        // If the email exists and there is already a password created
    };

    $scope.Enter = function() {
        // Validates the information from the form
        if ($scope.viewdata.login.email === "")
        {
            $scope.viewdata.login.email_invalid = true;
            ShowFormErrorMsg("Te falta el correo!");
            return;
        }
        else
        {
            $scope.viewdata.login.email_invalid = false;
        }
        if ($scope.viewdata.login.password === "")
        {
            $scope.viewdata.login.password_invalid = true;
            ShowFormErrorMsg("Te falta el password!");
            return;
        }
        else
        {
            $scope.viewdata.login.password_invalid = false;
        }

        $ionicLoading.show({template: 'Por favor espere <br><ion-spinner icon="dots" class="spinner"></ion-spinner>'});

        $cordovaKeyboard.close();
        setTimeout(function(){
            // Performs the Login Operation
            userFactory.session.login(
                {
                    email: $scope.viewdata.login.email,
                    password: $scope.viewdata.login.password
                }
            )
            .then(function(data) {
                // Sets the flags indicating the user has already logged.
                localStorage.setItem('animationShown', false);

                referenceIDFactory.setReferenceID(data.ReferenceID);            
                
                $("#viewWelcome").addClass("animated slideOutDown");
                
                $cordovaPush.register(iosConfig).then(
                    function(deviceToken) 
                    {
                        // Device Token ID
                        deviceFactory.device.registerdevice(deviceToken, $scope.viewdata.login.email)
                            .then(function(response){
                                setTimeout(function(){
                                    cordova.plugins.Keyboard.disableScroll(false);
                                    $ionicLoading.hide();
                                    $state.go('tab.qrcode');
                                },800);              
                            })
                            .catch(function(response){
                                
                            }); 
                    }, 
                    function(err) 
                    {
                        alert("Registration error: " + err)
                    }
                );
            })
            .catch(function(data){
                $ionicLoading.hide();
                ShowFormErrorMsg("Oops, no puedes entrar!");
            });
        }, 250);
    };

    $scope.nextSlide = function() {
        $cordovaKeyboard.close();
        $ionicSlideBoxDelegate.next();
    };

    $scope.gotoSlide = function(index) {
        // $cordovaKeyboard.close();
        $ionicSlideBoxDelegate.slide(index);
    };

    $scope.slideHasChanged = function(index) {
        _currentSlideIndex = index;
    };

    $scope.OpenScanner = function() {
        $cordovaBarcodeScanner
        .scan()
        .then(function(barcodeData) {
            // Success! Barcode data is here            
            if (barcodeData.cancelled == 0)
            {
                alert(barcodeData.text)
            }
            else
            {
                // TODO.
            }
        }, function(error) {
            // An error occurred
            alert("Error!");
        });
    };
}]);

ctrl.controller('QRCodeCtrl', ['$scope', '$timeout', 'userFactory', '$ionicLoading', '$ionicModal', '$cordovaPush', 'beaconsFactory', function($scope, $timeout, userFactory, $ionicLoading, $ionicModal, $cordovaPush, beaconsFactory){
    $timeout(function(){
        console.log("QR Code - timeout entered");
        $("#viewcontent-QR").show();
        $("#viewcontent-QR").addClass("animated slideInUp");
        $scope.$apply();
    });

    $scope.$on("$ionicView.enter", function(event, args){
        console.log("QR Code - View Enter");
        $("#viewcontent-QR").show();
        $("#viewcontent-QR").addClass("animated slideInUp");        
        $scope.$apply();
    });

    $scope.viewdata = {
        user: {},
        CardNumber: "",
        beaconsFound: []
    };

    userFactory.info.get()
        .then(function(data){              
            $scope.viewdata.user = data;
            $scope.$apply();

            $scope.viewdata.CardNumber = "1000000000000000502"; // data.AccountID;
        })
        .catch(function(err){
            // TODO
        });

    $scope.ShowBeaconsModal = function() {
        $scope.viewdata.beaconsFound = [];

        $ionicModal.fromTemplateUrl('templates/beaconsModal.html', {
            scope: $scope,
            animation: 'slide-in-up'
        })
        .then(function(modal) {
            $scope.modal = modal;
            $scope.modal.show();

            $scope.ScanBeacons();
        });
    };

    $scope.CloseModal = function() {
        var uuid = 'A77A1B68-49A7-4DBF-914C-760D07FBB87B';
        var identifier = 'Nuestra Tienda CIS';
        // var minor = 1;
        // var major = 1;
        var beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid);
        cordova.plugins.locationManager.stopRangingBeaconsInRegion(beaconRegion);
        $scope.modal.hide();
    };

    $scope.ScanBeacons = function() {
        var delegate = new cordova.plugins.locationManager.Delegate();
        cordova.plugins.locationManager.setDelegate(delegate);

        // required in iOS 8+
        // cordova.plugins.locationManager.requestWhenInUseAuthorization(); 
        cordova.plugins.locationManager.requestAlwaysAuthorization();

        delegate.didDetermineStateForRegion = function (pluginResult) {
            // Enters a region
            if (pluginResult.state == "CLRegionStateInside")
            {
                $scope.viewdata.beaconsFound.push({
                    name: pluginResult.region.identifier
                });

                $scope.$apply();

                $scope.scanResult = JSON.stringify(pluginResult);
                // cordova.plugins.locationManager.startRangingBeaconsInRegion(beaconRegion)
                   //  .fail(console.error)
                   //  .done();

                var _beaconRegion = new cordova.plugins.locationManager.BeaconRegion(pluginResult.region.identifier, pluginResult.region.uuid);
                cordova.plugins.locationManager.stopRangingBeaconsInRegion(_beaconRegion);
            }
        };

        // delegate.didStartMonitoringForRegion = function (pluginResult) {          
        // };

        // delegate.didRangeBeaconsInRegion = function (pluginResult) {
        //     if (pluginResult.beacons.length > 0)
        //     {
        //         var uuid = 'A77A1B68-49A7-4DBF-914C-760D07FBB87B';
        //         var identifier = 'Nuestra Tienda CIS';
        //         // var minor = 1;
        //         // var major = 1;
        //         var beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid);

        //         cordova.plugins.locationManager.stopRangingBeaconsInRegion(beaconRegion);
        //         cordova.plugins.locationManager.stopMonitoringForRegion(beaconRegion);
        //     };
        // };

        beaconsFactory.beacons.get()
            .then(function(data){
                $scope.viewdata.beaconsFound = data;

                var j = data.length;
                for (var i=0; i<j; i++)
                {
                    var beaconRegion = new cordova.plugins.locationManager.BeaconRegion(data[i].identifier, data[i].uuid);
                    cordova.plugins.locationManager.startMonitoringForRegion(beaconRegion)
                        .fail(console.error)
                        .done();
                }
            })
            .catch(function(err){

            })
    };

    var iosConfig = {
        "badge": true,
        "sound": true,
        "alert": true,
    };

    $cordovaPush.register(iosConfig).then(
        function(deviceToken) 
        {
        }
    );
}]);

ctrl.controller('KenuuCtrl', ['$scope', '$timeout', 'userFactory', 'commerceFactory', '$state', '$ionicLoading', 'setupView', 'emailService', 'navigationFactory', function($scope, $timeout, userFactory, commerceFactory, $state, $ionicLoading, setupView, emailService, navigationFactory){
    $scope.$on("$ionicView.enter", function(event, args){
        console.log("Kenuu Entered")
        navigationFactory.setDefaults();
        LoadData();
    });

    $scope.viewdata = {
        qrcode: "",
        counter: 1,
        positions: [],
        user: {
            activity: ''
        }
    };

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
        userFactory.info.get()
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

ctrl.controller('KenuuPricesCtrl', ['$scope', '$state', 'rewardFactory', 'userFactory', 'commerceFactory', '$ionicLoading', 'navigationFactory', function($scope,$state,rewardFactory,userFactory,commerceFactory,$ionicLoading,navigationFactory){

	$scope.viewdata = {
        searchText: '',
        searchResults: [],
        rewards: [],
        commerceSelected: commerceFactory.selectedCommerce.isSelected(),
        selectedCommerce: commerceFactory.selectedCommerce.get()        
    };

    var imageserverurl = "http://dev.cis-solutions.com/kenuu/imgs/";

    userFactory.info.get()
        .then(function(data){
            $scope.viewdata.user = data;
            var userData = data;            
        })
        .catch(function(err){});

    function LoadData(entityID) {
        rewardFactory.active.general(true, entityID)
            .then(function(data){
                $("#pleaseWaitSpinner").addClass("animated slideOutUp");
                setTimeout(function() {
                    $scope.viewdata.rewards = data.Elements;
                    $("#rewardsListContainer").show();                    
                    $scope.$apply();
                    $ionicLoading.hide();
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

    $scope.$on("$ionicView.beforeEnter", function(event, args){
        $("#rewardsListContainer").hide();
    });

    $scope.$on("$ionicView.enter", function(event, args){
        $scope.viewdata.commerceSelected = commerceFactory.selectedCommerce.isSelected();
        $scope.viewdata.selectedCommerce = commerceFactory.selectedCommerce.get();

        if ($scope.viewdata.commerceSelected)
        {
            $ionicLoading.show({template: 'Por favor espere <br><ion-spinner icon="dots" class="spinner"></ion-spinner>'});
            $scope.viewdata.rewards = [];
            $scope.$apply();
            setTimeout(function(){
                LoadData($scope.viewdata.selectedCommerce.EntityID);
            }, 800);            
        }
        else
        {
            console.log("Nop, no hay comercio!");
            LoadData();
        }
    });

    $scope.OpenRewardDetail = function(reward) {
        rewardFactory.selectedReward.set(reward);
        console.log("Selected Reward:");
        console.log(reward);
        $state.go(navigationFactory.rewardDetail.get());
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
}]);

ctrl.controller('KenuuFavCommercesCtrl', ['$scope', '$state', 'userFactory', 'commerceFactory', 'dateFxService', function($scope,$state,userFactory,commerceFactory,dateFxService){

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
        return dateFxService.lapseSince(date);
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

ctrl.controller('KenuuCommerceCtrl', ['$scope', '$state', 'rewardFactory', 'commerceFactory', 'userFactory', '$window', '$cordovaEmailComposer', 'dateFxService', 'navigationFactory', function($scope, $state, rewardFactory, commerceFactory, userFactory, $window, $cordovaEmailComposer, dateFxService, navigationFactory){
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

                // verifies if the client has performed any activity with the commerce
                if ($scope.viewdata.selectedCommerce.LastVisitDateEntity === null)
                {
                    $("#commerce-noactivity").show();
                }
                else
                {
                    $("#commerce-myactivity").show();
                }

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
        if (date === null) return "";
        if (date ===undefined) return "";
        var _date = new Date(date);
        return _date.getDate() + "/" + (_date.getMonth()+1) + "/" + _date.getFullYear();
    };
    $scope.GoToStores = function() {
        $state.go(navigationFactory.stores.get());
    };
    $scope.GoToRewards = function() {
        $state.go(navigationFactory.rewards.get());
    };
    $scope.GetCommerceBalance = function(balance) {
        if (balance === null) return 0;
        if (balance === undefined) return 0;
        else return balance;
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
    $scope.lapseSinceLastVisit = function(date) {
        return dateFxService.lapseSince(date);
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

    userFactory.info.get()
        .then(function(data){
            $scope.viewdata.user = data;            

            commerceFactory.stores.general($scope.viewdata.selectedCommerce.EntityID)
                .then(function(data){
                    
                    $("#pleaseWaitSpinner_Stores").addClass("animated slideOutUp");
                    
                    setTimeout(function() {                                                       
                        $scope.viewdata.stores = data;
                        console.log($scope.viewdata.stores);
                        $scope.$apply();
                        $("#pleaseWaitSpinner_Stores").hide();
                        $("#storesListDiv").show();
                        $("#storesListDiv").addClass("animated fadeIn"); 
                    }, 150); 
                })
                .catch(function(err){
                    $("#pleaseWaitSpinner_Stores").addClass("animated slideOutUp");
                
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

ctrl.controller('KenuuProfileCtrl', ['$scope', '$timeout', 'userFactory', '$state', '$ionicHistory', 'msgBox', '$ionicLoading', function($scope, $timeout, userFactory, $state, $ionicHistory, msgBox, $ionicLoading){
    $scope.viewdata = {
        qrcode: "Kenuu",
        counter: 1,
        positions: [],
        user: {
            name: '',
            lastname: '',
            activity: ''
        }
    };

    userFactory.info.get(true,2)
        .then(function(data){
            $scope.viewdata.user = data;
            $scope.$apply();
            var userData = data;
            $scope.viewdata.user.name = userData.FirstName;
            $scope.viewdata.user.lastname = userData.LastName;
            console.log(userData);
        })
        .catch(function(err){});

    $scope.SaveProfile = function() {
        $ionicLoading.show({template: 'Por favor espere <br><ion-spinner icon="dots" class="spinner"></ion-spinner>'});

        userFactory.info.update({
            FirstName: $scope.viewdata.user.name,
            LastName: $scope.viewdata.user.lastname,
            UpdatePassword: false,
            Password: ""
        })
        .then(function(response){
            $ionicLoading.hide();
            if ((response.status=="true")||(response.status==true))
            {
                userFactory.info.get(true,2)
                .then(function(data){
                    msgBox.showOk("Listo!", "Actualizaste tu perfil.");
                })
                .catch(function(err){});                
            }
            else
            {

            }
        })
        .catch(function(err){
            $ionicLoading.hide();
            console.log(err);
        });
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
        },
        commerce: {}
    };

    $scope.$on("$ionicView.enter", function(event, args){
        commerceFactory.selectedCommerce.clearSelection(); 
    });

    var imageserverurl = "http://dev.cis-solutions.com/kenuu/imgs/";

    userFactory.info.get()
        .then(function(data){
            $scope.viewdata.user = data;

            if ($scope.viewdata.selectedReward.Points <= $scope.viewdata.user.PointsAvailable) {
                $("#btnRedeem").show();
            }
            var userData = data;

            // Gets the Commerce Information
            commerceFactory.get($scope.viewdata.selectedReward.EntityID)
                .then(function(data){
                    $scope.viewdata.commerce = data[0]; 
                    console.log(data[0])
                    $scope.$apply();
                })
                .catch(function(err){
                    console.log(err);
                });
        })
        .catch(function(err){
            console.log(err);
        });

    $scope.viewdata.rewardId = $scope.viewdata.selectedReward.SRewardID.toString();

    $scope.GetCommerceBalance = function(balance) {
        if (balance === null) return 0;
        if (balance === undefined) return 0;
        else return balance;
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

    $scope.gDate = function(date) {
        var _date = new Date(parseInt(date.substr(6)));
        return _date.getDate() + "/" + (_date.getMonth()+1) + "/" + _date.getFullYear();
    };

    $scope.GoToCommerce = function() {
        commerceFactory.selectedCommerce.set($scope.viewdata.commerce);                         
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

ctrl.controller('MapCtrl', ['$scope', 'commerceFactory', '$ionicLoading', '$cordovaGeolocation', function($scope, commerceFactory, $ionicLoading, $cordovaGeolocation){
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

ctrl.controller('SearchCtrl', ['$scope', 'searchFactory', '$state', 'commerceFactory', '$ionicModal', 'navigationFactory', function($scope, searchFactory, $state, commerceFactory, $ionicModal, navigationFactory){

    $scope.viewdata = {
        doingSearch: false,
        searchResults: [],
        searchText: ""
    };

    $scope.$on("$ionicView.enter", function(event, args){
        console.log("Entered!")
        if ($scope.viewdata.searchText != "")
        {
            doSearch();
        }
    });

    function sortByKey(array, key) {
        return array.sort(function(a, b) {
            var x = a[key]; var y = b[key];
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    };

    function doSearch() {
        searchFactory.doSearch($scope.viewdata.searchText)
            .then(function(data){ 
                console.log(data);               
                $scope.viewdata.searchResults = data.response.Elements;
                $scope.viewdata.searchResults = sortByKey($scope.viewdata.searchResults, "Type");
                $scope.$apply();
            })
            .catch(function(data){
                console.log(data);
            })
    };

    $scope.$watch('viewdata.searchText', function() {
        if ($scope.viewdata.searchText != "")
        {
            $(".reward-searchpanel").removeClass("reward-searchpanel-hidden");
            doSearch();
        }
        else
        {
            $(".reward-searchpanel").addClass("reward-searchpanel-hidden");   
            $scope.viewdata.searchResults = [];
        }
    }); 

    $scope.ClearSearch = function() {
        $scope.viewdata.searchText = "";
        $(".reward-searchpanel").addClass("reward-searchpanel-hidden");
    };

    $scope.OpenCommerce = function(entityID) {
        console.log("Entity ID: ", entityID);
        commerceFactory.get(entityID)
            .then(function(response){
                commerceFactory.selectedCommerce.set(response[0]);
                navigationFactory.stores.setTab("tab.search-stores");
                navigationFactory.rewards.setTab("tab.search-prices");
                navigationFactory.rewardDetail.setTab("tab.search-rewarddetail");                
                $state.go("tab.search-commerce");
            })
            .catch(function(response){
                console.log("Error when getting the commerce.")
                console.log(response);
            })
        
    };

    $scope.OpenStore = function(entityID, SubEntityID) {};

    $scope.OpenReward = function(entityID, SubEntityID, rewardID) {
        // tab.search-rewarddetail
    };
}]);

ctrl.controller('ActivityCtrl', ['$scope', 'userFactory', 'socialSharing', function($scope, userFactory, socialSharing){
    
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

ctrl.controller('WhatsNewCtrl', ['$scope', '$cordovaInAppBrowser', '$ionicSlideBoxDelegate', function($scope, $cordovaInAppBrowser, setupView, emailService, $ionicSlideBoxDelegate) {

    $scope.$on("$ionicView.enter", function(event, args){
        $ionicSlideBoxDelegate.slide(0);
    });

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