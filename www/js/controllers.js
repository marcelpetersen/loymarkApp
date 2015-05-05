var ctrl = angular.module('kenuu.controllers', ['ja.qr']);

ctrl.controller('NoConnectionCtrl', ['$scope', '$state', function($scope, $state){    
}]);

ctrl.controller('LoginCtrl', ['$scope', '$cordovaKeyboard', 'loginSignUpFactory', 'userFactory', '$ionicLoading', 'referenceIDFactory', '$cordovaPush', 'deviceFactory', '$ionicHistory', '$state', function($scope, $cordovaKeyboard, loginSignUpFactory, userFactory, $ionicLoading, referenceIDFactory, $cordovaPush, deviceFactory, $ionicHistory, $state) {
    if (!devEnvironment) cordova.plugins.Keyboard.disableScroll(true);

    $scope.viewdata = {
        login: {
            email: loginSignUpFactory.login.email.get(),
            password: "",
            email_invalid: false,
            password_invalid: false
        },
        msgbox: {
            title: "",
            message: "",
            buttontext: ""
        }
    };

    $scope.DoLogin = function() {
        if (!devEnvironment) $cordovaKeyboard.close();
        if (($scope.viewdata.login.password === undefined)||($scope.viewdata.login.password === ""))
        {            
            ShowModalMsg('Oops!', 'Te hace falta ingresar tu password.', 'Ok');
            return;
        }

        $ionicLoading.show({template: 'Por favor espere <br><ion-spinner icon="dots" class="spinner"></ion-spinner>'});

        userFactory.session.login(
            {
                email: $scope.viewdata.login.email,
                password: $scope.viewdata.login.password                
            }
        )
        .then(function(data){            
            // Sets the flags indicating the user has already logged.
            localStorage.setItem('animationShown', false);
            referenceIDFactory.setReferenceID(data.ReferenceID);

            // $cordovaPush.register(iosConfig).then(
            //     function(deviceToken) 
            //     {
            //         console.log(deviceToken);
            //         // Device Token ID
            //         deviceFactory.device.registerdevice(deviceToken, $scope.viewdata.login.email)
            //             .then(function(response){
            //                 setTimeout(function(){
                                if (!devEnvironment) cordova.plugins.Keyboard.disableScroll(false);
                                $ionicLoading.hide();
                                $ionicHistory.clearHistory();
                                $ionicHistory.clearCache();
                                $ionicHistory.nextViewOptions({
                                    disableAnimate: true,
                                    disableBack: true,
                                    historyRoot: true
                                });
                                $state.go('tab.qrcode');
            //                 },800);              
            //             })
            //             .catch(function(response){
                            
            //             }); 
            //     }, 
            //     function(err) 
            //     {
            //         alert("Registration error: " + err)
            //     }
            // );

            console.log(data);
        })
        .catch(function(err){
            $ionicLoading.hide();
            console.log(err);
            ShowModalMsg("Oops!", "No puedes ingresar, inténtanlo de nuevo.", "Ok");
        });
    };

    function ShowModalMsg(title, message, buttontext) {
        if (!devEnvironment) $cordovaKeyboard.close();
        $scope.viewdata.msgbox.title = title;
        $scope.viewdata.msgbox.message = message;
        $scope.viewdata.msgbox.buttontext = buttontext;

        var modal = document.querySelector('#modal-msgbox-login'),
            close = modal.querySelector( '.md-close' );
        var overlay = document.querySelector( '.md-overlay' );
        classie.add( modal, 'md-show' );
        close.addEventListener( 'click', function( ev ) {
            ev.stopPropagation();
            classie.remove( document.querySelector('#modal-msgbox-login'), 'md-show' );
        });
    };
}]);

ctrl.controller('PasswordCreateCtrl', ['$scope', '$cordovaKeyboard', 'loginSignUpFactory', 'userFactory', '$ionicLoading', 'referenceIDFactory', '$cordovaPush', 'deviceFactory', '$ionicHistory', '$state', function($scope, $cordovaKeyboard, loginSignUpFactory, userFactory, $ionicLoading, referenceIDFactory, $cordovaPush, deviceFactory, $ionicHistory, $state) {
}]);

ctrl.controller('SignUpCtrl', ['$scope', '$cordovaKeyboard', 'loginSignUpFactory', 'userFactory', '$ionicLoading', 'referenceIDFactory', '$cordovaPush', 'deviceFactory', '$ionicHistory', '$state', function($scope, $cordovaKeyboard, loginSignUpFactory, userFactory, $ionicLoading, referenceIDFactory, $cordovaPush, deviceFactory, $ionicHistory, $state) {
    if (!devEnvironment) cordova.plugins.Keyboard.disableScroll(true);

    $scope.viewdata = {
        signup: {
            email: loginSignUpFactory.login.email.get(),
            password: "",
            password_confirm: "",
            email_invalid: false,
            password_invalid: false,
            password_confirm_invalid: false
        },
        msgbox: {
            title: "",
            message: "",
            buttontext: ""
        }
    };

    $scope.DoSignUp = function() {
        if (!devEnvironment) $cordovaKeyboard.close();

        // Validates the information from the form
        if (($scope.viewdata.signup.password === undefined)||($scope.viewdata.signup.password === ""))
        {
            $scope.viewdata.signup.password_invalid = true;
            ShowModalMsg('Oops!', 'Te hace falta digitar tu password.', 'Ok');
            return;
        }
        else
        {
            $scope.viewdata.signup.password_invalid = false;
        }
        if (($scope.viewdata.signup.password_confirm === undefined)||($scope.viewdata.signup.password_confirm === ""))
        {
            $scope.viewdata.signup.password_confirm_invalid = true;
            ShowModalMsg('Oops!', 'Te hace falta confirmar tu password.', 'Ok');
            return;
        }
        else
        {
            $scope.viewdata.signup.password_invalid = false;
        }

        if ($scope.viewdata.signup.password_confirm != $scope.viewdata.signup.password)
        {
            ShowModalMsg('Oops!', 'Tus contraseñas no coinciden.', 'Ok');
            return;
        }

        $ionicLoading.show({template: 'Por favor espere <br><ion-spinner icon="dots" class="spinner"></ion-spinner>'});

        userFactory.session.signup({email:$scope.viewdata.signup.email, password:$scope.viewdata.signup.password})
            .then(function(data){
                // alert(JSON.stringify(data))
                if ((data.status == true)||(data.status == "true"))
                {
                    // alert(1);
                    // Sets the flags indicating the user has already logged.
                    localStorage.setItem('animationShown', false);

                    referenceIDFactory.setReferenceID(data.data.response.ReferenceID);

                    if (!devEnvironment) cordova.plugins.Keyboard.disableScroll(false);

                    $ionicLoading.hide();
                    $(".md-overlay").addClass("md-overlay-ok");
                    $(".md-content").addClass("md-content-ok");
                    ShowModalMsg_Ok("Listo!", "Ya quedaste registrado! Empieza a disfrutar de Kenuu.", "Ok");

                    setTimeout(function(){
                        $state.go('tab.qrcode');   
                    }, 3000);
                }
                else
                {
                    ShowModalMsg("Oops!" ,"No se pudo terminar el registro.", "Ok");
                }
            })
            .catch(function(err){
                $ionicLoading.hide();

                console.log("Error!");
                console.log(err);

                if (err.data != undefined)
                {
                    if (err.data.responseCode == "MO0011") 
                    {                        
                        ShowModalMsg("Oops!", err.data.message, "Ok");
                    }
                    else
                    {
                        ShowModalMsg("Oops!", "No se pudo terminar el registro.", "Ok");
                    }
                } 
                else
                {
                    ShowModalMsg("Oops!", "Ocurrió un error, por favor inténtalo de nuevo.", "Ok");
                }               
            });
    };

    function ShowModalMsg(title, message, buttontext) {
        if (!devEnvironment) $cordovaKeyboard.close();
        $(".md-overlay").removeClass("md-overlay-ok");
        $(".md-content").removeClass("md-content-ok");
        $scope.viewdata.msgbox.title = title;
        $scope.viewdata.msgbox.message = message;
        $scope.viewdata.msgbox.buttontext = buttontext;

        var modal = document.querySelector('#modal-msgbox-signup'),
            close = modal.querySelector( '.md-close' );
        var overlay = document.querySelector( '.md-overlay' );
        classie.add( modal, 'md-show' );
        close.addEventListener( 'click', function( ev ) {
            ev.stopPropagation();
            classie.remove( document.querySelector('#modal-msgbox-signup'), 'md-show' );
        });
    };

    function ShowModalMsg_Ok(title, message, buttontext) {
        if (!devEnvironment) $cordovaKeyboard.close();
        $scope.viewdata.msgbox.title = title;
        $scope.viewdata.msgbox.message = message;
        $scope.viewdata.msgbox.buttontext = buttontext;

        var modal = document.querySelector('#modal-msgbox-signup-ok'),
            close = modal.querySelector( '.md-close' );
        var overlay = document.querySelector( '.md-overlay' );
        classie.add( modal, 'md-show' );
    };

    function CloseModalMsg_Ok() {
        classie.remove( document.querySelector('#modal-msgbox-signup-ok'), 'md-show' );
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
}]);

ctrl.controller('WelcomeCtrl', ['$scope', '$timeout', '$state', '$ionicSlideBoxDelegate', 'userFactory', 'referenceIDFactory', '$ionicLoading', '$cordovaKeyboard', '$cordovaPush', 'deviceFactory', '$cordovaBarcodeScanner', 'signUpLoginView', 'loginSignUpFactory', function($scope, $timeout, $state, $ionicSlideBoxDelegate, userFactory, referenceIDFactory, $ionicLoading, $cordovaKeyboard, $cordovaPush, deviceFactory, $cordovaBarcodeScanner, signUpLoginView, loginSignUpFactory){
    localStorage.setItem('animationShown', false);
    
    if (!devEnvironment) cordova.plugins.Keyboard.disableScroll(true);

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
            password_confirm: "",
            email_invalid: false,
            password_invalid: false,
            password_confirm_invalid: false
        },
        login: {
            email: "",
            password: "",
            email_invalid: false,
            password_invalid: false
        },
        msgbox: {
            title: "",
            message: "",
            buttontext: ""
        }
    };

    var _currentSlideIndex = 0;

    var iosConfig = {
        "badge": true,
        "sound": true,
        "alert": true,
    };

    $scope.DoEmailSignUp = function() {
        // Validates the information from the form
        if (($scope.viewdata.login.email === undefined)||($scope.viewdata.login.email === ""))
        {
            $scope.viewdata.login.email_invalid = true;
            ShowModalMsg('Oops!', 'Te hace falta digitar un correo válido.', 'Ok');
            return;
        }
        else
        {
            $scope.viewdata.login.email_invalid = false;
        }

        $ionicLoading.show({template: 'Por favor espere <br><ion-spinner icon="dots" class="spinner"></ion-spinner>'});

        userFactory.datavalidation.emailvalidation($scope.viewdata.login.email)
            .then(function(response){
                console.log(response);
                if (response.status)
                {
                    loginSignUpFactory.login.email.set($scope.viewdata.login.email);

                    // Email already exists and user is also created
                    if (response.data.responseCode == 1)
                    {                           
                        $ionicLoading.hide();
                        $state.go("login");
                    }

                    // Email does not exists
                    if (response.data.responseCode == 0)
                    {   
                        $ionicLoading.hide();
                        $state.go("signup");
                    }

                    // Email exists but the user hasn't been created
                    if (response.data.responseCode == -1)
                    {   
                        $ionicLoading.hide(); 
                        $state.go("passwordcreate");                       
                    }
                }
                else
                {
                    ShowModalMsg('Oops!', "No pudimos verificar tu correo, por favor inténtanlo de nuevo.", "Ok");
                }
            })
            .catch(function(err){
                ShowModalMsg('Oops!', "No pudimos verificar tu correo, por favor inténtanlo de nuevo.", "Ok");
            }); 
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
                    if (!devEnvironment) cordova.plugins.Keyboard.disableScroll(false);
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

    function ShowModalMsg(title, message, buttontext) {
        if (!devEnvironment) $cordovaKeyboard.close();
        $scope.viewdata.msgbox.title = title;
        $scope.viewdata.msgbox.message = message;
        $scope.viewdata.msgbox.buttontext = buttontext;

        var modal = document.querySelector('#modal-msgbox'),
            close = modal.querySelector( '.md-close' );
        var overlay = document.querySelector( '.md-overlay' );
        classie.add( modal, 'md-show' );
        close.addEventListener( 'click', function( ev ) {
            ev.stopPropagation();
            classie.remove( document.querySelector('#modal-msgbox'), 'md-show' );
        });
    };

    // ***********************************

    $scope.nextSlide = function() {
        $cordovaKeyboard.close();
        $ionicSlideBoxDelegate.next();
    };

    $scope.gotoSlide = function(index) {
        $cordovaKeyboard.close();
        $ionicSlideBoxDelegate.slide(index);
    };

    $scope.slideHasChanged = function(index) {
        $cordovaKeyboard.close();
        _currentSlideIndex = index;
    };
}]);

ctrl.controller('QRCodeCtrl', ['$scope', '$timeout', 'userFactory', '$ionicLoading', '$ionicModal', '$cordovaPush', 'beaconsFactory', 'codeScannerFactory', 'deviceFactory', function($scope, $timeout, userFactory, $ionicLoading, $ionicModal, $cordovaPush, beaconsFactory, codeScannerFactory, deviceFactory){
    $timeout(function(){
        $("#viewcontent-QR").show();
        $("#viewcontent-QR").addClass("animated slideInUp");
        $scope.$apply();
    });

    $scope.$on("$ionicView.enter", function(event, args){        
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

            $scope.viewdata.CardNumber = data.CardNumber; // data.AccountID;

            if (!devEnvironment)
            { 
                var iosConfig = {
                    "badge": true,
                    "sound": true,
                    "alert": true,
                };

                $cordovaPush.register(iosConfig).then(
                    function(deviceToken) 
                    {
                        deviceFactory.device.registerdevice(deviceToken, data.Email)
                        .then(function(response){
                            console.log("Device Register Ok!")
                            console.log(response)
                        })
                        .catch(function(err){
                            console.log("Device Register Error!")
                            console.log(err)
                        })
                    }
                );
            }
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
        if(!devEnvironment) beaconRegion = new cordova.plugins.locationManager.BeaconRegion(identifier, uuid);
        if(!devEnvironment) cordova.plugins.locationManager.stopRangingBeaconsInRegion(beaconRegion);
        $scope.modal.hide();
    };

    $scope.ScanBeacons = function() {
        if(devEnvironment) return;
        if(!devEnvironment) delegate = new cordova.plugins.locationManager.Delegate();
        if(!devEnvironment) cordova.plugins.locationManager.setDelegate(delegate);

        // required in iOS 8+
        // cordova.plugins.locationManager.requestWhenInUseAuthorization(); 
        if(!devEnvironment) cordova.plugins.locationManager.requestAlwaysAuthorization();

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
                if(!devEnvironment) cordova.plugins.locationManager.stopRangingBeaconsInRegion(_beaconRegion);
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

    

    $scope.OpenScanner = function() {
        codeScannerFactory.scan()
        .then(function(response){

        })
        .catch(function(err){
            
        })
    };
}]);

ctrl.controller('KenuuCtrl', ['$scope', '$timeout', 'userFactory', 'commerceFactory', '$state', '$ionicLoading', 'setupView', 'emailService', 'navigationFactory', function($scope, $timeout, userFactory, commerceFactory, $state, $ionicLoading, setupView, emailService, navigationFactory){
    $scope.$on("$ionicView.enter", function(event, args){
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
        selectedCommerce: commerceFactory.selectedCommerce.get(),
        sorter: 'Name'
    };
    $scope.nameSorter = "rewards-filter-header-selected";

    var imageserverurl = "http://dev.cis-solutions.com/kenuu/imgs/";

    var itemColorArray = [
        "#82D275", // Green
        "#FEB45A", // Orange
        "#7FAEE3", // Blue
        "#E27CBD", // Purple
        "#DA7C79"  // Papaya
    ];
    var colorIndex = 0;

    function GetBorderColor() {
        if (colorIndex === 4) colorIndex = 0;
        return itemColorArray[colorIndex++];
    };

    userFactory.info.get()
        .then(function(data){
            $scope.viewdata.user = data;
            var userData = data;            
        })
        .catch(function(err){});

    function SetColorForItem(array) {
        var j=array.length;
        for (var i=0; i<j; i++)
        {
            array[i]["bordercolor"] = GetBorderColor();
        }
        return array;
    };

    function LoadData(entityID) {
        $ionicLoading.show({template: 'Por favor espere <br><ion-spinner icon="dots" class="spinner"></ion-spinner>'});
        rewardFactory.active.general(true, entityID)
            .then(function(data){
                $("#pleaseWaitSpinner").addClass("animated slideOutUp");
                setTimeout(function() {                    
                    $scope.viewdata.rewards = data.Elements;
                    $scope.viewdata.rewards = SetColorForItem($scope.viewdata.rewards);
                    $("#rewardsListContainer").show();                    
                    $scope.$apply();
                    $ionicLoading.hide();
                    $scope.$broadcast('scroll.refreshComplete');                    
                }, 150);
            })
            .catch(function(err){                
                $("#pleaseWaitSpinner").addClass("animated slideOutUp");
                $scope.$broadcast('scroll.refreshComplete');
                
                setTimeout(function() { 
                    $("#errorWhenLoadingDiv").removeClass("animated slideOutUp");
                    setTimeout(function(){
                        $ionicLoading.hide();
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
            LoadData();
        }
    });

    $scope.OpenRewardDetail = function(reward) {
        rewardFactory.selectedReward.set(reward);
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

    $scope.doRefresh = function() { 
        $scope.Reload();
    };

    $scope.sortBy = function(sortOption) {        
        if (sortOption == "Nombre") 
        {
            $scope.viewdata.sorter = "Name";
            $scope.nameSorter = "rewards-filter-header-selected";
            $scope.pointsSorter = "";
        }
        else 
        {
            $scope.viewdata.sorter = "Points";
            $scope.nameSorter = "";
            $scope.pointsSorter = "rewards-filter-header-selected";
        }

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

ctrl.controller('KenuuCommerceCtrl', ['$scope', '$state', 'rewardFactory', 'commerceFactory', 'userFactory', '$window', '$cordovaEmailComposer', 'dateFxService', 'navigationFactory', '$stateParams', function($scope, $state, rewardFactory, commerceFactory, userFactory, $window, $cordovaEmailComposer, dateFxService, navigationFactory, $stateParams){
    $scope.viewdata = {
        selectedReward: rewardFactory.selectedReward.get(),
        selectedCommerce: commerceFactory.selectedCommerce.get()
    };

    if ($stateParams.entityID != undefined)
    {
        commerceFactory.get($stateParams.entityID)
        .then(function(response){            
            $scope.viewdata.selectedCommerce = response[0];
            commerceFactory.selectedCommerce.set(response[0]);
        })
        .catch(function(err){
            console.log("Error")
        })
    }
    
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
        });
    };

    $scope.DoLogout = function() {
        userFactory.session.logout();
        $ionicHistory.clearHistory();
        $ionicHistory.clearCache();
        $state.go("welcome");
    };
}]);

ctrl.controller('KenuuRewardDetailCtrl', ['$scope', '$timeout', 'userFactory', 'rewardFactory', 'commerceFactory', '$state', '$ionicLoading', 'navigationFactory', function($scope, $timeout, userFactory, rewardFactory, commerceFactory, $state, $ionicLoading, navigationFactory){

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
                    $scope.$apply();
                })
                .catch(function(err){
                    
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
        $state.go(navigationFactory.commerce.get());
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

ctrl.controller('MapCtrl', ['$scope', 'commerceFactory', '$ionicLoading', '$cordovaGeolocation', '$stateParams', function($scope, commerceFactory, $ionicLoading, $cordovaGeolocation, $stateParams){
  	$scope.settings = {
    	enableFriends: true
  	};

    $scope.$on("$ionicView.enter", function(event, args){
        
    });

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
                        entityID: data[i].EntityID,
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
                            title += "<div class='text=center'><a href='#/tab/map/store/" + marker.entityID + "' class='button button-small button-calm profile-btn' style='width:110px;'>Ver Comercio</a></div>"


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
                $scope.viewdata.searchResults = data.response.Elements;
                $scope.viewdata.searchResults = sortByKey($scope.viewdata.searchResults, "Type");
                $scope.$apply();
            })
            .catch(function(data){
                
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
        $state.go("tab.search-rewarddetail");
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
        // $ionicSlideBoxDelegate.slide(0);
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