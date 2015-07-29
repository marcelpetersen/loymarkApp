var ctrl = angular.module('kenuu.controllers', ['ja.qr']);

var imageserverurl = "http://dev.cis-solutions.com/kenuu/imgs/";

// Near Me Tab

    ctrl.controller('NearMeCtrl', ['$scope', '$state', '$ionicLoading', '$timeout', '$cordovaPush', '$cordovaGeolocation', '$cordovaKeyboard', 'loadingBox', 'searchFactory', 'commerceFactory', 'navigationFactory', 'deviceFactory', 'userFactory', 'navigationFactory', 'locationFactory', 'storeFactory', '$cordovaInAppBrowser', 'signupSetupFactory', function($scope, $state, $ionicLoading, $timeout, $cordovaPush, $cordovaGeolocation, $cordovaKeyboard, loadingBox, searchFactory, commerceFactory, navigationFactory, deviceFactory, userFactory, navigationFactory, locationFactory, storeFactory, $cordovaInAppBrowser, signupSetupFactory){
        
        $scope.viewdata = {
            locationSet: true,
            showLocationMessage: true,
            searchResults: [],
            searchText: "",
            user: {},
            CardNumber: "",
            storePage: 0,
            kilometers: 0, // Cuando es 0 se marca el elemento "Todos"
            pleaseWaitMessage: "Buscando tiendas...",
            pullFreshMemberDataFromServer: userFactory.info.pullFreshMemberDataFromServer.get(),
            reloadLocation: false,
            allStoresList: [],
            pageSize: 5,
            currentPage: 0,
            loadMoreButtonMessage: "Ver más...",
            showLoadMoreButton: false,
            orderList: 'Distance',
            showLocationInfoLabel: false,
            showGettingLocationSpinner: false
        };

        $scope.$on("$ionicView.enter", function(event, args){
            // Everytime the app enters into the Near Me view, the selected store is reset so the stack is cleared.
            storeFactory.selectedStore.reset();
            SetButtonActiveEffectForAndroid();
            ViewInitialization();
        });

        $scope.$on('$ionicView.beforeEnter', function(event, args){
            $("#nearme-content").hide();
            $("#nearme-content").removeClass('animated fadeIn');
        });

        $scope.$on('$ionicView.afterEnter', function(event, args){ 
            $("#nearme-content").addClass('animated fadeIn');
            $("#nearme-content").show();
        });

        function sortByKey(array, key) {
            return array.sort(function(a, b) {
                var x = a[key]; var y = b[key];
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        };

        function SetButtonActiveEffectForAndroid() {
            if (navigator.userAgent.toLowerCase().indexOf("android") > -1) {
                $(".nearme-search-item-btn")
                    .bind("touchstart", function () {
                        $(this).addClass("activity-topbtn-fake-active");
                    })
                    .bind("touchend", function() {
                        $(this).removeClass("activity-topbtn-fake-active");
                    });
            }
        };

        $scope.getSpinnerByPlatform = function() {
            var spinner = "android";
            if (deviceFactory.device.device().platform == "iOS") {
                spinner = "ios-small";
            }
            return spinner;
        };

        $scope.ReloadList = function() {
            $scope.viewdata.currentPage = 0;
            $scope.viewdata.reloadLocation = true;
            $scope.viewdata.searchResults = [];
            $scope.viewdata.allStoresList = [];            
            ViewInitialization();
        };

        function HideLocationMessage() {
            $scope.viewdata.showLocationMessage = false;          
            $("#locationMessage").hide();
        };

        function ShowLocationMessage() {
            $scope.viewdata.showLocationMessage = true;          
            $("#locationMessage").show();
        };

        function GetMemberData() {
            return new Promise(function(resolve,reject){

                userFactory.info.email.set("");

                // Pulls the member information
                userFactory.info.get($scope.viewdata.pullFreshMemberDataFromServer)
                    .then(function(data){
                        userFactory.info.pullFreshMemberDataFromServer.set(false);
                        $scope.viewdata.pullFreshMemberDataFromServer = false;
                        $scope.viewdata.user = data;
                        $scope.viewdata.CardNumber = data.CardNumber;
                        userFactory.info.email.set(data.Email);
                        userFactory.info.cardNumber.set(data.CardNumber);
                        resolve(data);
                    })
                    .catch(function(err) {                    
                        reject(err);
                    });
            });
        };

        function RegisterDevice(email) {
            return new Promise(function(resolve,reject){
                var iosConfig = {
                    "badge": true,
                    "sound": true,
                    "alert": true,
                };
                var androidConfig = {
                    "senderID": "671633506930"
                };

                deviceFactory.device.registeredUser.set(email);

                if (deviceFactory.device.platform() == "iOS")
                {
                    $cordovaPush.register(iosConfig)
                        .then(
                            function(deviceToken)
                            {
                                deviceFactory.device.registerdevice(deviceToken, email)
                                    .then(function(response){                             
                                        resolve(response);
                                    })
                                    .catch(function(err){                                        
                                        reject(err);
                                    });
                            },
                            function(err) {
                                reject(err);
                            }
                        );
                }

                if (deviceFactory.device.platform() == "Android")
                {
                    $cordovaPush.register(androidConfig).then(function(result) {
                            // Success
                            resolve(result);
                        }, function(err) {
                            // Error
                            reject(err);
                        });
                }
            });
        };

        $scope.ClearLocationMessage = function() {
            $("#locationMessage").hide();
            $scope.viewdata.showLocationMessage = false;
        };

        function GetLocation() {
            return new Promise(function(resolve, reject){
                // Gets the User's location
                $scope.viewdata.showGettingLocationSpinner = true;
                $scope.viewdata.locationSet = false;

                var posOptions = {timeout: 10000, enableHighAccuracy: false};

                if (locationFactory.location.isSet() && !$scope.viewdata.reloadLocation)
                {
                    $scope.viewdata.locationSet = true;
                    $scope.viewdata.showGettingLocationSpinner = false;
                    resolve();
                }
                else
                {
                    $cordovaGeolocation
                        .getCurrentPosition(posOptions)
                        .then(function (position) {   
                            $scope.viewdata.showGettingLocationSpinner = false;                     
                            $scope.viewdata.locationSet = true;
                            $scope.ClearLocationMessage();
                            var _lat  = position.coords.latitude;
                            var _long = position.coords.longitude;
                            locationFactory.location.set(_lat, _long);
                            $scope.viewdata.reloadLocation = false;
                            resolve();
                        })
                        .catch(function(err){   
                            $scope.viewdata.showGettingLocationSpinner = false;
                            $scope.viewdata.locationSet = false;
                            ShowLocationMessage();
                            reject(err);
                        });
                }
            });
        };

        function GetNearbyStores() {
            var _location = locationFactory.location.get();
            return new Promise(function(resolve, reject){  

                if (!_location.isSet) {
                    ShowLocationMessage();
                    return;
                }

                $scope.viewdata.orderList = "Distance";  
                $scope.viewdata.showLocationInfoLabel = true;

                loadingBox.show($scope.viewdata.pleaseWaitMessage);
                var lat  = _location.lat;
                var long = _location.long;

                $scope.viewdata.allStoresList = [];

                commerceFactory.stores.nearby(0, long, lat, $scope.viewdata.storePage, $scope.viewdata.kilometers)
                    .then(function(data){   
                        $scope.$broadcast('scroll.refreshComplete');                                                 
                        loadingBox.hide();
                        if ($scope.viewdata.storePage == 0) $scope.viewdata.allStoresList = data;                            
                        else
                        {
                            var j = data.length;
                            for (var i=0; i<j; i++)
                            {
                                // $scope.viewdata.searchResults.push(data[i]);
                                $scope.viewdata.allStoresList.push(data[i]);
                            }
                        }
                        resolve($scope.viewdata.allStoresList);
                    })
                    .catch(function(err){
                        $scope.$broadcast('scroll.refreshComplete');
                        loadingBox.hide();
                        reject(err);
                    });
            });
        };

        function GetAllStores() {
            return new Promise(function(resolve, reject){
                $scope.viewdata.orderList = "Name";
                $scope.viewdata.showLocationInfoLabel = false;
                loadingBox.show($scope.viewdata.pleaseWaitMessage);
                commerceFactory.stores.general(0, '')
                    .then(function(data){                        
                        loadingBox.hide();
                        $scope.$broadcast('scroll.refreshComplete');
                        data = sortByKey(data, "Name");
                        $scope.viewdata.allStoresList = data;
                        resolve(data);
                    })
                    .catch(function(err){
                        console.log("GetAllStores - Error:");
                        console.log(err);
                        $scope.$broadcast('scroll.refreshComplete');
                        loadingBox.hide();
                        reject(err);
                    });
            });
        };

        function GetStoresByTextSearch() {
            return new Promise(function(resolve, reject){
                $scope.viewdata.currentPage = 0;
                $scope.viewdata.reloadLocation = true;
                $scope.viewdata.searchResults = [];
                $scope.viewdata.allStoresList = [];  
                $scope.viewdata.showLoadMoreButton = false;

                loadingBox.show($scope.viewdata.pleaseWaitMessage);
                commerceFactory.stores.general(0, $scope.viewdata.searchText)
                    .then(function(data){
                        loadingBox.hide();
                        $scope.viewdata.searchResults = data;                                   
                        $scope.$apply();
                        resolve();
                    })
                    .catch(function(err){
                        console.log(err);
                        loadingBox.hide();
                        reject(err);
                    });
            });
        };

        function SetStoresIntoList(stores) {
            var count = stores.length;
            var currentPage = $scope.viewdata.currentPage;
            var pageSize = $scope.viewdata.pageSize;
            var pageCount = Math.ceil(count / pageSize);

            var startPos = currentPage * pageSize;
            var endPos = startPos + pageSize;

            if (count <= pageSize) {
                $scope.viewdata.showLoadMoreButton = false;
            }
            else {
                if ((pageCount-1) == currentPage)
                {
                    $scope.viewdata.showLoadMoreButton = false;    
                }
                else {
                    $scope.viewdata.showLoadMoreButton = true;
                }                
            }

            for (var i=startPos; i<endPos; i++)
            {
                if (stores[i] != undefined) {
                    $scope.viewdata.searchResults.push(stores[i]);    
                }                
            }
        };

        $scope.SetActivityPageToShow = function() {
            var stores = $scope.viewdata.allStoresList;
            $scope.viewdata.currentPage++;
            SetStoresIntoList(stores);
        };

        function ViewInitialization() {
            var TAG = "";

            loadingBox.show($scope.viewdata.pleaseWaitMessage);

            GetMemberData()
                .then(function(response){                    
                    if (!devEnvironment)
                    {
                        // Verifies if the user authorized Kenuu to register for PUSH Notifications
                        if (signupSetupFactory.pushNotifications.get())
                        {
                            RegisterDevice(response.Email)
                                .then(function(response){
                                    console.log("RegisterDevice Ok!");
                                    
                                })
                                .catch(function(err){
                                    console.log("RegisterDevice:");
                                    console.log(err);                                
                                    loadingBox.hide();
                                });    
                        }                        

                        // Verifies if the user has already said that the location
                        // services are not enabled.
                        if (signupSetupFactory.location.get())
                        {
                            
                        }                       
                    }

                    loadingBox.hide();
                    $scope.ChangeKilometers(0); // By default pulls all the stores                    
                })
                .catch(function(err){
                    console.log("GetMemberData:");
                    console.log(err);
                    loadingBox.hide();
                });
        };

        function ResetSearch() {
            $scope.viewdata.storePage = 0;
            $scope.viewdata.currentPage = 0;
            $scope.viewdata.reloadLocation = true;
            $scope.viewdata.searchResults = [];
            $scope.viewdata.allStoresList = []; 
            $scope.viewdata.showLoadMoreButton = false;

            if ($scope.viewdata.locationSet) 
            {
                if ($scope.viewdata.searchText === "")
                {
                    // GetNearbyStores()
                    //     .then(function(response){
                    //         if (!devEnvironment) $cordovaKeyboard.close();
                    //     })
                    //     .catch(function(err){
                    //         if (!devEnvironment) $cordovaKeyboard.close();
                    //     });
                    
                    if (!devEnvironment) $cordovaKeyboard.close();
                    $scope.ChangeKilometers(0);
                }
                else
                {
                    GetStoresByTextSearch()
                        .then(function(response){
                            if (!devEnvironment) $cordovaKeyboard.close();
                        })
                        .catch(function(err){
                            if (!devEnvironment) $cordovaKeyboard.close();
                        });
                }
            }
            else
            {
                if ($scope.viewdata.searchText === "")
                {
                    // GetAllStores()
                    //     .then(function(response){
                    //         if (!devEnvironment) $cordovaKeyboard.close();
                    //     })
                    //     .catch(function(err){
                    //         if (!devEnvironment) $cordovaKeyboard.close();
                    //     });

                    if (!devEnvironment) $cordovaKeyboard.close();
                    $scope.ChangeKilometers(0);
                }
                else
                {
                    GetStoresByTextSearch()
                        .then(function(response){
                            if (!devEnvironment) $cordovaKeyboard.close();
                        })
                        .catch(function(err){
                            if (!devEnvironment) $cordovaKeyboard.close();
                        });
                }
            }
        };

        $scope.GetMoreStores = function(){
            if (!$scope.viewdata.locationSet) return;     // If location services is disabled, do not search for more stores. 
            if ($scope.viewdata.searchText != "") return; // The infinite scroll does not apply to the search by text.

            $scope.viewdata.storePage++;
            
            GetNearbyStores()
                .then(function(){                    
                })
                .catch(function(response){
                });        
        };

        $scope.SearchFieldEnterPressed = function() {
            if (!devEnvironment) $cordovaKeyboard.close();

            if ($scope.viewdata.searchText != "")
            {
                GetStoresByTextSearch()
                    .then(function(response){                    
                    })
                    .catch(function(err){                    
                    });
            }
        };

        $scope.ChangeKilometers = function(kilometers){
            HideLocationMessage();
            $scope.viewdata.showLoadMoreButton = false;

            $scope.viewdata.kilometers = kilometers;
            $scope.viewdata.storePage = 0;

            $scope.viewdata.currentPage = 0;
            $scope.viewdata.reloadLocation = true;
            $scope.viewdata.searchResults = [];
            $scope.viewdata.allStoresList = []; 
            
            if (kilometers == 0)
            {
                GetAllStores()
                    .then(function(response){
                        SetStoresIntoList(response);
                    })
                    .catch(function(error){
                    });
            }
            else
            {
                if (signupSetupFactory.location.get())
                {
                    $scope.viewdata.showGettingLocationSpinner = true;

                    GetLocation()
                        .then(function(response){
                            GetNearbyStores()
                                .then(function(response){
                                    $scope.viewdata.showGettingLocationSpinner = false;
                                    SetStoresIntoList(response);
                                })
                                .catch(function(response){
                                    setTimeout(function(){
                                        $scope.viewdata.showGettingLocationSpinner = false;    
                                    }, 800);
                                });
                        })
                        .catch(function(err){
                            setTimeout(function(){
                                $scope.viewdata.showGettingLocationSpinner = false;    
                            }, 800);
                        });
                }
                else {
                    $scope.viewdata.showGettingLocationSpinner = false;
                }                
            }
        };

        // Executed when the view is loaded
        $timeout(function(){
            $("#nearme-list").show();
            $("#nearme-list").addClass("animated fadeIn");
            $scope.viewdata.locationSet = false;
        });

        $scope.$on('$cordovaPush:notificationReceived', function(event, notification) {
            if (deviceFactory.device.platform() == 'iOS')
            {
                // iOS
                if (notification.alert) {
                    swal(notification.message);
                }

                if (notification.sound) {
                    var snd = new Media(event.sound);
                    snd.play();
                }

                if (notification.badge) {
                    $cordovaPush.setBadgeNumber(notification.badge).then(
                        function(result) {
                            // Success!
                        },
                        function(err) {
                            // An error occurred. Show a message to the user
                        }
                    );
                }
            }
            else
            {
                // Android
                switch(notification.event) {
                    case 'registered':
                        if (notification.regid.length > 0 ) {
                            // alert('registration ID = ' + notification.regid);

                            var tokenId = notification.regid;
                            var email = deviceFactory.device.registeredUser.get();

                            deviceFactory.device.registerdevice(tokenId, email)
                                .then(function(response){
                                    // OK
                                })
                                .catch(function(err){
                                    // Error
                                });
                         }
                      break;

                    case 'message':
                      // this is the actual push notification. its format depends on the data model from the push server
                      // alert('message = ' + notification.message + ' msgCount = ' + notification.msgcnt);
                      swal(notification.message);
                      break;

                    case 'error':
                      alert('GCM error = ' + notification.msg);
                      break;

                    default:
                      alert('An unknown GCM event has occurred');
                      break;
                };
            }
        });

        $scope.SearchBlur = function() {
            if (!devEnvironment) $cordovaKeyboard.close();
        };

        $scope.ClearSearch = function() {
            $("#btnClearSearch").hide();
            $("#searchText").blur();
            $scope.viewdata.searchText = "";            
            ResetSearch();
        };

        $scope.$watch('viewdata.searchText', function() {
            if ($scope.viewdata.searchText.length > 0) $("#btnClearSearch").show();
        });


        $scope.GetAvatarImage = function(img) {
            if (img == undefined) return "";
            if (img == null) return "";
            if (img == "") return ""

            return imageserverurl + img;
        };

        $scope.OpenStore = function(store) {
            // Opens the selected Store
            storeFactory.selectedStore.set(store);
            loadingBox.hide();
            var _state = navigationFactory.store.get();                    
            $state.go(_state);
        };

        $scope.OpenMap = function() {
            $state.go("tab.nearme-map");
        };

        function sortByKey(array, key) {
            return array.sort(function(a, b) {
                var x = a[key]; var y = b[key];
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        };

        $scope.formatDistance = function(distance) {
            if (distance == null) return 0;
            if (distance == undefined) return 0;
            if (distance == '') return 0;
            distance = Math.round(distance * 100) / 100;
            return distance;
        };
    }]);

    // Commerce Detail
    ctrl.controller('CommerceWithRewardsCtrl', ['$scope', '$state', '$stateParams', '$ionicLoading', '$timeout', 'loadingBox', 'commerceFactory', 'rewardFactory', 'deviceFactory', 'rewardDetailModal', 'navigationFactory', '$cordovaSocialSharing', '$cordovaKeyboard', '$cordovaAppAvailability', '$cordovaInAppBrowser', 'emailService', '$cordovaActionSheet', 'formatServices', function($scope, $state, $stateParams, $ionicLoading, $timeout, loadingBox, commerceFactory, rewardFactory, deviceFactory, rewardDetailModal, navigationFactory, $cordovaSocialSharing, $cordovaKeyboard, $cordovaAppAvailability, $cordovaInAppBrowser, emailService, $cordovaActionSheet, formatServices){
        $scope.viewdata = {
            commerce: commerceFactory.selectedCommerce.get(),
            rewards: [],
            imageserverurl: imageserverurl,
            selectedreward: {},
            socialmediaapps: {
                twitter: false,
                facebook: false
            }
        };

        $scope.$on('$ionicView.beforeEnter', function(event, args){
            $("#commercewr-content").hide();
            $("#commercewr-content").removeClass('animated fadeIn');
        });

        $scope.$on('$ionicView.afterEnter', function(event, args){ 
            $("#commercewr-content").addClass('animated fadeIn');
            $("#commercewr-content").show();
        });

        $scope.$on("$ionicView.enter", function(event, args){
            $scope.viewdata.commerce = commerceFactory.selectedCommerce.get();
            LoadData($scope.viewdata.commerce.EntityID);
        });

        $timeout(function(){
            loadingBox.hide();
            IsTwitterInstalled();
            IsFacebookInstalled();
        });

        $scope.ReloadCommerceInfo = function() {
            loadingBox.show("Actualizando la información del comercio...");
            commerceFactory.get($scope.viewdata.commerce.EntityID, "")
                .then(function(response){                    
                    
                    $scope.$broadcast('scroll.refreshComplete');

                    if (response.length > 0)
                    {
                        commerceFactory.selectedCommerce.set(response[0]);
                        $scope.viewdata.commerce = response[0];

                        LoadData($scope.viewdata.commerce.EntityID);
                    }
                    else
                    {
                        loadingBox.hide();
                    }
                })
                .catch(function(err){
                    loadingBox.hide();
                    $scope.$broadcast('scroll.refreshComplete');
                });
        };

        function LoadData(entityID) {
            // Pulls the rewards for the Commerce      
            rewardFactory.active.general(true, entityID)
                .then(function(data){                
                    loadingBox.hide();
                    $scope.viewdata.rewards = data.Elements;
                })
                .catch(function(err){
                    loadingBox.hide();
                });
        };

        if ($stateParams.entityID != undefined)
        {
            commerceFactory.get($stateParams.entityID)
            .then(function(response){            
                $scope.viewdata.commerce = response[0];
                commerceFactory.selectedCommerce.set(response[0]);
                LoadData($scope.viewdata.commerce.EntityID);
            })
            .catch(function(err){
                loadingBox.hide();
            })
        }
        else
        {
            LoadData($scope.viewdata.commerce.EntityID);
        }

        function GetMonthName(month) {
            switch(month)
            {
                case 1: return "Enero";
                case 2: return "Febrero";
                case 3: return "Marzo";
                case 4: return "Abril";
                case 5: return "Mayo";
                case 6: return "Junio";
                case 7: return "Julio";
                case 8: return "Agosto";
                case 9: return "Setiembre";
                case 10: return "Octubre";
                case 11: return "Noviembre";
                case 12: return "Diciembre";
            }
        };

        function formatAMPM(date) {
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0'+minutes : minutes;
            var strTime = hours + ':' + minutes + ' ' + ampm;
            return strTime;
        };

        $scope.gDate = function(date) {
            // the date is received with a format "dd/mm/yyyyThh:mm:ss"
            return formatServices.FormatDateWithT(date);
        };

        $scope.gTime = function(startTime, endTime) {
            var _default = "Horario no disponible"
            if (startTime == undefined) return _default;
            if (endTime == undefined) return _default;
            if (startTime == "") return _default;
            if (endTime == "") return _default;

            // Formats the date with AM PM
            var cDate = new Date()
            var _date1 = new Date(cDate.getFullYear(), cDate.getMonth(), cDate.getDate(), startTime.substring(0, 2), startTime.substring(3, 5));
            var _date2 = new Date(cDate.getFullYear(), cDate.getMonth(), cDate.getDate(), endTime.substring(0, 2), endTime.substring(3, 5));

            return formatAMPM(_date1) + " - " + formatAMPM(_date2);
        };

        $scope.GetVal = function(val) {
            if (val == undefined) return 0;
            if (val == null) return 0;
            if (val == "") return 0;
            return val;
        };

        $scope.GetVisitCount = function(commerce) {
            if (commerce.TotalVisits != undefined) return $scope.GetVal(commerce.TotalVisits);
            if (commerce.TotalVisitsEntity != undefined) return $scope.GetVal(commerce.TotalVisitsEntity);
            return 0;
        };

        function GetMonthName(month) {
            switch(month)
            {
                case 1: return "Enero";
                case 2: return "Febrero";
                case 3: return "Marzo";
                case 4: return "Abril";
                case 5: return "Mayo";
                case 6: return "Junio";
                case 7: return "Julio";
                case 8: return "Agosto";
                case 9: return "Setiembre";
                case 10: return "Octubre";
                case 11: return "Noviembre";
                case 12: return "Diciembre";
            }
        };

        $scope.GetLastVisitDate = function(commerce) {
            if (commerce.LastVisit != undefined) 
            {
                var _date = formatServices.FormatDateWithT(commerce.LastVisit);                
                return _date;
            }
            if (commerce.LastVisitDateEntity != undefined) 
            {
                var _date = formatServices.FormatDateWithT(commerce.LastVisitDateEntity);                               
                return _date;
            }
            return "N/A";
        };

        $scope.GetAvatarImage = function(img) {
            if (img == undefined) return "";
            if (img == null) return "";
            if (img == "") return ""

            return imageserverurl + img;
        };

        $scope.GetRewardImage = function(img) {
            if (img == null) return "img/default-1.jpg";
            else return $scope.viewdata.imageserverurl + img;
        };

        $scope.GetPointsClass = function(availablepoints, rewardpoints) {
            if (availablepoints > rewardpoints)
            {
                return "commercewr-points-list";
            }
            else
            {
                return "commercewr-points-notlist";
            }
        };

        $scope.GetRewardAvailableCheckClass = function(availablepoints, rewardpoints) {
            if (availablepoints > rewardpoints)
            {
                return "commercewr-reward-available";
            }
            else
            {
                return "commercewr-reward-unavailable";
            }
        };

        function OpenMapsActionSheet(options, lat, long) {
            $cordovaActionSheet.show(options)
                .then(function(btnIndex) {
                    var index = btnIndex;
                    
                    switch(index)
                    {
                        case 1:
                            var url = "";
                            if (deviceFactory.device.platform() == "iOS")
                            {
                                url = "maps://maps.apple.com/?q=" + lat + "," + long;
                            }
                            else
                            {
                                url = "http://maps.google.com/?q=" + lat + "," + long;
                            }

                            window.open(url, "_system");
                            break;
                        case 2: 
                            if (deviceFactory.device.platform() == "iOS")
                            {
                                url = "waze://?ll=" + lat + "," + long + "&navigate=yes";
                                window.open(url, "_system");
                            }
                            else
                            {
                                url = "waze://?ll=" + lat + "," + long + "&navigate=yes";
                                WazeLink.open( url );
                            }
                            break;
                    }
                });
        };

        $scope.OpenMaps = function(lat, long) {

            // Maps options
            var options = {
                title: '¿Cómo llegar?',
                buttonLabels: ['Ir a mapas'],
                addCancelButtonWithLabel: 'Cancelar',
                androidEnableCancelButton : true,
                winphoneEnableCancelButton : true
            };

            IsWazeInstalled()
                .then(function(response){
                    if (response) {                     
                        options.buttonLabels.push('Usar Waze');    
                    }

                    OpenMapsActionSheet(options, lat, long);
                })
                .catch(function(err){

                })
        };

        $scope.OpenStores = function() {
            $state.go(navigationFactory.stores.get());
        };

        $scope.OpenRewardDetail = function(reward) {
            // console.log(reward);
            $scope.viewdata["availablepoints"] = $scope.viewdata.commerce.PointsAvailable;
            $scope.viewdata.selectedreward = reward;                        
            rewardDetailModal.Show($scope);
        };

        $scope.CloseRewardDetailModal = function() {
            rewardDetailModal.Close();
        };

        $scope.RewardDetailDatesAvailable = function(date1, date2) {
            if (date1 == undefined) return false;
            if (date1 == "") return false;
            if (date1 == null) return false;
            if (date2 == undefined) return false;
            if (date2 == "") return false;
            if (date2 == null) return false;
            return true;
        };

        $scope.GetAvailablePoints = function(availablepoints) {
            if (availablepoints == null) return 0;
            return availablepoints;
        };

        function IsTwitterInstalled() {
            if (!devEnvironment) 
            {
                var URI = "com.twitter.android";                
                if (deviceFactory.device.platform() == "iOS") URI = "twitter://";
                $cordovaAppAvailability.check(URI)
                    .then(function() {
                        // is available
                         $scope.viewdata.socialmediaapps.twitter = true;                     
                    }, function () {
                        // not available
                        $scope.viewdata.socialmediaapps.twitter = false;                    
                    });
            }
        };

        function IsFacebookInstalled() {
            if (!devEnvironment) 
            {
                var URI = "com.facebook.katana";
                if (deviceFactory.device.platform() == "iOS") URI = "fb://";
                $cordovaAppAvailability.check(URI)
                    .then(function() {
                        // is available
                         $scope.viewdata.socialmediaapps.facebook = true;                     
                    }, function () {
                        // not available
                        $scope.viewdata.socialmediaapps.facebook = false;                    
                    });
            }
        };

        function IsWazeInstalled() {
            return new Promise(function(resolve,reject){
                if (!devEnvironment) 
                {
                    if (deviceFactory.device.platform() == "Android") {
                        resolve(true);
                        return;
                    }

                    var URI = "waze://";                
                    if (deviceFactory.device.platform() == "iOS") URI = "waze://";
                    $cordovaAppAvailability.check(URI)
                        .then(function() {
                            // is available
                            resolve(true);
                        }, function () {
                            // not available
                            resolve(false);
                        });
                }
                else
                {
                    resolve(false);
                }
            });
        };

        $scope.OpenShareMenu = function() {

            // Maps options
            var options = {
                title: 'Compártalo usando...',
                buttonLabels: ['Facebook', 'Twitter'],
                addCancelButtonWithLabel: 'Cancelar',
                androidEnableCancelButton : true,
                winphoneEnableCancelButton : true
            };

            OpenShareActionSheet(options);
        };

        function OpenShareActionSheet(options) {
            $cordovaActionSheet.show(options)
                .then(function(btnIndex) {
                    var index = btnIndex;
                    
                    switch(index)
                    {
                        case 1:
                            $scope.ShareViaFacebook($scope.viewdata.commerce);
                            break;
                        case 2: 
                            $scope.ShareViaTwitter($scope.viewdata.commerce);
                            break;
                    }
                });
        };

        $scope.ShareViaTwitter = function(commerce) {
            var message = commerce.Name;
            $cordovaSocialSharing
                .shareViaTwitter(message)
                .then(function(result) {
                    // Success!
                }, function(err) {
                    // An error occurred. Show a message to the user
                    ShowModalMsg('Oops!', 'No se puede compartir en Twitter, por favor verifique que tenga instalada el App.', 'Ok');
                });
        };

        $scope.ShareViaFacebook = function(commerce) {
            var message = commerce.Name;
            $cordovaSocialSharing
                .shareViaFacebook(message)
                .then(function(result) {
                    // Success!
                }, function(err) {
                    // An error occurred. Show a message to the user
                });
        };

        $scope.GetRewardProgress = function(availablepoints, itempoints) {
            if (availablepoints == null) return 0;            

            var progress = (availablepoints * 100) / itempoints;
            if (progress > 100) return 100;
            else return progress;
        };

        $scope.GetRewardsProgressClass = function(availablepoints, itempoints) {
            var progress = $scope.GetRewardProgress(availablepoints, itempoints);            
            if (progress == 100)
            {
                return "commercewr-progressoverlay-completed";
            }
            else
            {
                return "commercewr-progressoverlay";   
            }
        };

        $scope.GetRewardProcessStyle = function(availablepoints, itempoints) {
            var progress = $scope.GetRewardProgress(availablepoints, itempoints);            
            return {"width":progress + "%"};
        };

        $scope.OpenPage = function(pageUrl) {
            var options = {
                location: 'yes',
                clearcache: 'yes',
                toolbar: 'yes'
            };

            $cordovaInAppBrowser.open(pageUrl, '_blank', options)
                .then(function(event) {
                // success
                })
                .catch(function(event) {
                // error
                });
        };

        $scope.EmailTo = function(to) {
            emailService.EmatilTo(to);
        };

        $scope.DoPhoneCall = function(phonenum) {
            var call = "tel:" + phonenum;
            document.location.href = call;
        }
    }]);

    ctrl.controller('MapCtrl', ['$scope', 'commerceFactory', '$ionicLoading', '$cordovaGeolocation', '$stateParams', '$compile', 'loadingBox', 'locationFactory', 'storeFactory', 'navigationFactory', '$state', function($scope, commerceFactory, $ionicLoading, $cordovaGeolocation, $stateParams, $compile, loadingBox, locationFactory, storeFactory, navigationFactory, $state){
        $scope.settings = {
            enableFriends: true
        };

        $scope.$on("$ionicView.enter", function(event, args){        
        });

        $scope.viewdata = {
            stores: [],
            locationSet: false,
            showLocationMessage: true
        };

        var _map = false;
        var _locationMarkerCreated = false;
        var longitude = '';
        var latitude = '';

        $scope.ClearLocationMessage = function() {
            $("#locationMessageMap").hide();
            $scope.viewdata.showLocationMessage = false;
        };

        function ShowLocationMessage() {
            $scope.viewdata.locationSet = false;
            $scope.viewdata.showLocationMessage = true;
            $("#locationMessageMap").show();
        };

        $scope.GoToCommerce = function() {        
        };

        $scope.centerOnMe = function() {            
            if (!_map) return;
            var posOptions = {timeout: 100000, enableHighAccuracy: false};
            // loadingBox.show('Buscando tiendas cerca suyo...');
            $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(
                    function (position) 
                    {
                        $scope.viewdata.locationSet = true;
                        $scope.viewdata.showLocationMessage = false;

                        var lat  = position.coords.latitude;
                        var long = position.coords.longitude;

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
                        // LoadStores();
                    }, function(err) {
                        // error
                        ShowLocationMessage();
                        $scope.viewdata.locationSet = false;
                        $scope.viewdata.showLocationMessage = true;
                        
                        swal(
                            {   
                                title: "Oops!",   
                                text: "No tiene activados los servicios de ubicación.",   
                                type: "warning",   
                                showConfirmButton: true,
                                showCancelButton: false,                       
                                confirmButtonText: "Ok",   
                                closeOnConfirm: true 
                            }, 
                            function(){   
                                
                            }
                        );
                    });
        };

        function GetStoreFromList(SubEntityID) {
            var j=$scope.viewdata.stores.length;
            for (var i=0;i<j;i++)
            {
                if ($scope.viewdata.stores[i]["SubEntityID"] == SubEntityID) return $scope.viewdata.stores[i];
            }
            return undefined;
        };

        $scope.InfoWindowTapped = function(subEntityID) {
            var store = GetStoreFromList(subEntityID);
            storeFactory.selectedStore.set(store);
            var _state = navigationFactory.store.get();            
            $state.go(_state);
        };

        function LoadStores() {
            commerceFactory.stores.general(0,"").
                then(function(data){
                    loadingBox.hide();

                    var infoWindow = new google.maps.InfoWindow();
                    var j=data.length;
                    for (var i=0;i<j;i++){
                        var myLatlng = new google.maps.LatLng(data[i].LocationLatitude, data[i].LocationLongitude);
                        var marker = new google.maps.Marker({
                            position: myLatlng,
                            title: data[i].Name,
                            desc: data[i].Description,
                            info: data[i].Address,
                            horario: "Pendiente",
                            telefono: data[i].Phone,
                            map: _map,
                            entityID: data[i].EntityID,
                            subEntityID: data[i].SubEntityID,
                            icon: "./img/popmap.png"
                        });
                        var infowindow = new google.maps.InfoWindow({});
                        google.maps.event.addListener(marker, 'click', (function(marker, i) {
                            return function() {
                                if (infowindow) {
                                    infowindow.close();
                                }
                                var contentString   =  "<div class='map-info-window'>"; 
                                contentString       += "<div style='font-weight:bold'>" + marker.title + "</div>"; 
                                contentString       += "<button class='button button-clear button-positive' ng-click='InfoWindowTapped(" + marker.subEntityID + ")'>Detalle</button>";
                                contentString       += "</div>";
                                var compiled = $compile(contentString)($scope);

                                infoWindow.setContent(compiled[0]);
                                infoWindow.open(_map, marker);
                            };
                        })(marker));
                    }

                    if ($scope.viewdata.locationSet)
                    {
                        $scope.centerOnMe();    
                    }
                    
                })
                .catch(function(err){
                    loadingBox.hide();                       
                });
        };

        function LoadStoresNearBy(lat, lon) {
            commerceFactory.stores.nearby(0,lon,lat,0)
                .then(function(data){
                    loadingBox.hide();

                    var infoWindow = new google.maps.InfoWindow();
                    var j=data.length;
                    
                    $scope.viewdata.stores = data;

                    for (var i=0;i<j;i++){
                        var myLatlng = new google.maps.LatLng(data[i].LocationLatitude, data[i].LocationLongitude);
                        var marker = new google.maps.Marker({
                            position: myLatlng,
                            title: data[i].Name,
                            desc: data[i].Description,
                            info: data[i].Address,
                            horario: "Pendiente",
                            telefono: data[i].Phone,
                            map: _map,
                            entityID: data[i].EntityID,
                            subEntityID: data[i].SubEntityID,                                    
                            icon: "./img/popmap.png"
                        });
                        var infowindow = new google.maps.InfoWindow({});
                        google.maps.event.addListener(marker, 'click', (function(marker, i) {
                            return function() {
                                if (infowindow) {
                                    infowindow.close();
                                }
                                
                                var contentString   =  "<div class='map-info-window'>"; 
                                contentString       += "<div style='font-weight:bold'>" + marker.title + "</div>"; 
                                contentString       += "<button class='button button-clear button-positive' ng-click='InfoWindowTapped(" + marker.subEntityID + ")'>Detalle</button>";
                                contentString       += "</div>";
                                var compiled = $compile(contentString)($scope);

                                infoWindow.setContent(compiled[0]);
                                infoWindow.open(_map, marker);
                            };
                        })(marker));
                    }
                })
                .catch(function(err){
                });
        };

        $scope.mapCreated = function(map) {
            loadingBox.show('Buscando tiendas cercanas...');

            // Sets the map into a local variable.
            _map = map;
            var posOptions = {timeout: 10000, enableHighAccuracy: false};

            $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(function (position) {
                    var lat = position.coords.latitude;
                    var lon = position.coords.longitude;

                    $scope.viewdata.locationSet = true;
                    $scope.viewdata.showLocationMessage = false;
                    
                    LoadStoresNearBy(lat, lon);                                      
                    
                })
                .catch(function(err){
                    // No location services are available
                    ShowLocationMessage();
                    LoadStores();
                });  
        };
    }]);

    // Stores Associated to a Commerce
    ctrl.controller('CommerceWithRewardsStoresCtrl', ['$scope', '$state', '$ionicLoading', 'loadingBox', 'commerceFactory', 'storeFactory', 'navigationFactory', '$cordovaActionSheet', '$cordovaAppAvailability', 'deviceFactory', '$cordovaSocialSharing', function($scope, $state, $ionicLoading, loadingBox, commerceFactory, storeFactory, navigationFactory, $cordovaActionSheet, $cordovaAppAvailability, deviceFactory, $cordovaSocialSharing){
        $scope.viewdata = {
            commerce: commerceFactory.selectedCommerce.get(),
            stores: [],
            searchtext: "",
            pullingStoresMessage: 'Buscando las tiendas...'
        };

        loadingBox.show($scope.viewdata.pullingStoresMessage);
        commerceFactory.stores.general($scope.viewdata.commerce.EntityID)
            .then(function(response){
                // console.log(response)
                loadingBox.hide();
                $scope.viewdata.stores = response;
            })
            .catch(function(err){
                loadingBox.hide();
                // console.log(err)
            });

        function OpenMapsActionSheet(options, lat, long) {
            $cordovaActionSheet.show(options)
                .then(function(btnIndex) {
                    var index = btnIndex;
                    
                    switch(index)
                    {
                        case 1:
                            var url = "";
                            if (deviceFactory.device.platform() == "iOS")
                            {
                                url = "maps://maps.apple.com/?q=" + lat + "," + long;
                            }
                            else
                            {
                                url = "http://maps.google.com/?q=" + lat + "," + long;;
                            }

                            window.open(url, "_system");
                            break;
                        case 2: 
                            if (options.buttonLabels.length > 1)
                            {
                                url = "waze://?ll=" + lat + "," + long + "&navigate=yes";
                                window.open(url, "_system");
                            }
                            break;
                    }
                });
        };

        function OpenShareActionSheet(options) {
            $cordovaActionSheet.show(options)
                .then(function(btnIndex) {
                    var index = btnIndex;
                    
                    switch(index)
                    {
                        case 1:
                            $scope.ShareViaFacebook($scope.viewdata.commerce);
                            break;
                        case 2: 
                            $scope.ShareViaTwitter($scope.viewdata.commerce);
                            break;
                    }
                });
        };

        $scope.GoToAddress = function(lat, long) {
            // Maps options
            var options = {
                title: '¿Cómo llegar?',
                buttonLabels: ['Ir a mapas'],
                addCancelButtonWithLabel: 'Cancelar',
                androidEnableCancelButton : true,
                winphoneEnableCancelButton : true
            };

            IsWazeInstalled()
                .then(function(response){
                    if (response) {
                        options.buttonLabels.push('Usar Waze');    
                    }

                    OpenMapsActionSheet(options, lat, long);
                })
                .catch(function(err){

                });

            // url = "waze://?ll=" + lat + "," + long + "&navigate=yes";        
            // window.open(url, "_system");
        };

        function IsWazeInstalled() {
            return new Promise(function(resolve,reject){
                if (!devEnvironment) 
                {
                    var URI = "waze://";                
                    if (deviceFactory.device.platform() == "iOS") URI = "waze://";
                    $cordovaAppAvailability.check(URI)
                        .then(function() {
                            // is available
                            resolve(true);
                        }, function () {
                            // not available
                            resolve(false);
                        });
                }
                else
                {
                    resolve(false);
                }
            });
        };

        $scope.ClearSearch = function() {
            $scope.viewdata.searchtext = "";
        };

        $scope.OpenStore = function(store) {
            storeFactory.selectedStore.set(store);            
            var _state = navigationFactory.store.get();            
            $state.go(_state);
        };

        $scope.OpenShareMenu = function() {

            // Maps options
            var options = {
                title: 'Compártalo usando...',
                buttonLabels: ['Facebook', 'Twitter'],
                addCancelButtonWithLabel: 'Cancelar',
                androidEnableCancelButton : true,
                winphoneEnableCancelButton : true
            };

            OpenShareActionSheet(options);
        };

        $scope.ShareViaTwitter = function(store) {
            var message = store.Name;
            $cordovaSocialSharing
                .shareViaTwitter(message)
                .then(function(result) {
                    // Success!
                }, function(err) {
                    // An error occurred. Show a message to the user                    
                });
        };

        $scope.ShareViaFacebook = function(store) {
            var message = store.Name;
            $cordovaSocialSharing
                .shareViaFacebook(message)
                .then(function(result) {
                    // Success!
                }, function(err) {
                    // An error occurred. Show a message to the user
                });
        };
    }]);

    ctrl.controller('StoreDetailCtrl', ['$scope', '$timeout', '$state', '$stateParams', 'storeFactory', 'loadingBox', 'commerceFactory', 'rewardFactory', 'navigationFactory', 'deviceFactory', 'rewardDetailModal', '$cordovaAppAvailability', '$cordovaSocialSharing', '$cordovaInAppBrowser', 'emailService', '$cordovaActionSheet', 'beaconFactory', 'formatServices', function($scope, $timeout, $state, $stateParams, storeFactory, loadingBox, commerceFactory, rewardFactory, navigationFactory, deviceFactory, rewardDetailModal, $cordovaAppAvailability, $cordovaSocialSharing, $cordovaInAppBrowser, emailService, $cordovaActionSheet, beaconFactory, formatServices){
        
        //loadingBox.show();
        $scope.viewdata = {
            store: storeFactory.selectedStore.get(),
            rewards: [],
            imageserverurl: imageserverurl,
            selectedreward: {},
            loadingCommerceMessage: 'Buscando el comercio...',
            socialmediaapps: {
                twitter: false,
                facebook: false
            },
            // Beacons variables
            foundBeacons: [],
            storeBeaconFound: false,
            deviceInfo: deviceFactory.device.device(),
            popSelectedStore: true // Everytime the user leaves the view, the selected store must be popped, the only case where it shouldn't is when going to the commerce detail
        };

        $scope.$on("$ionicView.enter", function(event, args){
            $scope.viewdata.popSelectedStore = true;
            loadingBox.hide();
            $scope.viewdata.store = storeFactory.selectedStore.get();            
            $scope.ReloadStoreInfo();            
            IsTwitterInstalled();
            IsFacebookInstalled();
        });

        $scope.$on('$ionicView.beforeEnter', function(event, args){
            $("#storedetail-content").hide();
            $("#storedetail-content").removeClass('animated fadeIn');
        });

        $scope.$on('$ionicView.afterEnter', function(event, args){ 
            $("#storedetail-content").addClass('animated fadeIn');
            $("#storedetail-content").show();
        });

        $scope.$on("$ionicView.leave", function(event, args){
            // When the user leaves the view, the selected store is removed from the stack
            if ($scope.viewdata.popSelectedStore) storeFactory.selectedStore.pop();
        });

        function OpenMapsActionSheet(options, lat, long) {
            $cordovaActionSheet.show(options)
                .then(function(btnIndex) {
                    var index = btnIndex;
                    
                    switch(index)
                    {
                        case 1:
                            var url = "";
                            if (deviceFactory.device.platform() == "iOS")
                            {
                                url = "maps://maps.apple.com/?q=" + lat + "," + long;
                            }
                            else
                            {
                                url = "http://maps.google.com/?q=" + lat + "," + long;;
                            }

                            window.open(url, "_system");
                            break;
                        case 2: 
                            if (options.buttonLabels.length > 1)
                            {
                                if (deviceFactory.device.platform() == "iOS")
                                {
                                    url = "waze://?ll=" + lat + "," + long + "&navigate=yes";
                                    window.open(url, "_system");
                                }
                                else
                                {
                                    url = "waze://?ll=" + lat + "," + long + "&navigate=yes";
                                    WazeLink.open( url );
                                }
                            }
                            break;
                    }
                });
        };

        function OpenShareActionSheet(options) {
            $cordovaActionSheet.show(options)
                .then(function(btnIndex) {
                    var index = btnIndex;
                    
                    switch(index)
                    {
                        case 1:
                            $scope.ShareViaFacebook($scope.viewdata.store);
                            break;
                        case 2: 
                            $scope.ShareViaTwitter($scope.viewdata.store);
                            break;
                    }
                });
        };

        $scope.OpenMaps = function(lat, long) {

            // Maps options
            var options = {
                title: '¿Cómo llegar?',
                buttonLabels: ['Ir a mapas'],
                addCancelButtonWithLabel: 'Cancelar',
                androidEnableCancelButton : true,
                winphoneEnableCancelButton : true
            };

            IsWazeInstalled()
                .then(function(response){
                    if (response) {
                        options.buttonLabels.push('Usar Waze');    
                    }

                    OpenMapsActionSheet(options, lat, long);
                })
                .catch(function(err){

                })
        };

        $scope.OpenShareMenu = function() {

            // Maps options
            var options = {
                title: 'Compártalo usando...',
                buttonLabels: ['Facebook', 'Twitter'],
                addCancelButtonWithLabel: 'Cancelar',
                androidEnableCancelButton : true,
                winphoneEnableCancelButton : true
            };

            OpenShareActionSheet(options);
        };

        $scope.OpenCommerce = function(entityID) {
            loadingBox.show($scope.viewdata.loadingCommerceMessage);
            commerceFactory.get(entityID, "")
                .then(function(response){
                    commerceFactory.selectedCommerce.set(response[0]);
                    var _state = navigationFactory.commerce.get();
                    loadingBox.hide();
                    $scope.viewdata.popSelectedStore = false;
                    $state.go(_state);
                })
                .catch(function(response){
                    console.log(response)
                    alert("Error!")
                    loadingBox.hide();
                })
        };

        $scope.GetAvatarImage = function(img) {
            if (img == undefined) return "";
            if (img == null) return "";
            if (img == "") return ""

            return imageserverurl + img;
        };

        $scope.GetVal = function(val) {
            if (val == undefined) return 0;
            if (val == null) return 0;
            if (val == "") return 0;
            return val;
        };

        $scope.GetVisitCount = function(commerce) {
            if (commerce.TotalVisits != undefined) return $scope.GetVal(commerce.TotalVisits);
            if (commerce.TotalVisitsEntity != undefined) return $scope.GetVal(commerce.TotalVisitsEntity);
            return 0;
        };

        function GetMonthName(month) {
            switch(month)
            {
                case 1: return "Enero";
                case 2: return "Febrero";
                case 3: return "Marzo";
                case 4: return "Abril";
                case 5: return "Mayo";
                case 6: return "Junio";
                case 7: return "Julio";
                case 8: return "Agosto";
                case 9: return "Setiembre";
                case 10: return "Octubre";
                case 11: return "Noviembre";
                case 12: return "Diciembre";
            }
        };

        $scope.GetLastVisitDate = function(commerce) {
            if (commerce.LastVisit != undefined) 
            {
                var _date = formatServices.FormatDateWithT(commerce.LastVisit);                
                return _date;
            }
            if (commerce.LastVisitDateEntity != undefined) 
            {
                var _date = formatServices.FormatDateWithT(commerce.LastVisitDateEntity);                               
                return _date;
            }
            return "N/A";
        };

        function LoadData(entityID, subEntityID) {
            // Pulls the rewards for the Commerce      
            rewardFactory.active.general(true, entityID, subEntityID)
                .then(function(data){                
                    loadingBox.hide();                    
                    $scope.viewdata.rewards = data.Elements;
                })
                .catch(function(err){
                    loadingBox.hide();
                });
        };

        $scope.ReloadStoreInfo = function() {
            loadingBox.show("Actualizando la información de la tienda...");

            // Entity ID, Search Text and Sub EntityID
            // Entity ID = 0 To search specific store
            // "" = No search field is sent as filter
            commerceFactory.stores.general(0, "", $scope.viewdata.store.SubEntityID)
                .then(function(response){                   
                    
                    $scope.$broadcast('scroll.refreshComplete');
                    if (response.length > 0)
                    {
                        $scope.viewdata.store = response[0];
                        LoadData($scope.viewdata.store.EntityID, $scope.viewdata.store.SubEntityID);
                    }
                    else {
                        loadingBox.hide();
                    }                    
                }).catch(function(err){
                    loadingBox.hide();
                    console.log(err);
                    $scope.$broadcast('scroll.refreshComplete');
                });
        };

        $scope.GetRewardImage = function(img) {
            if (img == null) return "img/default-1.jpg";
            else return $scope.viewdata.imageserverurl + img;
        };

        $scope.GetRewardProgress = function(availablepoints, itempoints) {
            if (availablepoints == null) return 0;            

            var progress = (availablepoints * 100) / itempoints;
            if (progress > 100) return 100;
            else return progress;
        };

        $scope.GetRewardsProgressClass = function(availablepoints, itempoints) {
            var progress = $scope.GetRewardProgress(availablepoints, itempoints);            
            if (progress == 100)
            {
                return "commercewr-progressoverlay-completed";
            }
            else
            {
                return "commercewr-progressoverlay";   
            }
        };

        $scope.GetRewardProcessStyle = function(availablepoints, itempoints) {
            var progress = $scope.GetRewardProgress(availablepoints, itempoints);            
            return {"width":progress + "%"};
        };

        $scope.OpenRewardDetail = function(reward) {
            $scope.viewdata["availablepoints"] = $scope.viewdata.store.PointsAvailable;
            $scope.viewdata.selectedreward = reward;             
            rewardDetailModal.Show($scope);
        };

        $scope.CloseRewardDetailModal = function() {
            rewardDetailModal.Close();
        };

        $scope.RewardDetailDatesAvailable = function(date1, date2) {
            if (date1 == undefined) return false;
            if (date1 == "") return false;
            if (date1 == null) return false;
            if (date2 == undefined) return false;
            if (date2 == "") return false;
            if (date2 == null) return false;
            return true;
        };

        function formatAMPM(date) {
            var hours = date.getHours();
            var minutes = date.getMinutes();
            var ampm = hours >= 12 ? 'pm' : 'am';
            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'
            minutes = minutes < 10 ? '0'+minutes : minutes;
            var strTime = hours + ':' + minutes + ' ' + ampm;
            return strTime;
        };

        $scope.gDate = function(date) {
            // the date is received with a format "dd/mm/yyyyThh:mm:ss"            
            return formatServices.FormatDateWithT(date);
        };

        $scope.isOpenForBusiness = function(startTime, endTime) {
            var _default = ""
            if (startTime == undefined) return _default;
            if (endTime == undefined) return _default;
            if (startTime == "") return _default;
            if (endTime == "") return _default;

            // Formats the date with AM PM
            var cDate = new Date()
            var _date1 = new Date(cDate.getFullYear(), cDate.getMonth(), cDate.getDate(), startTime.substring(0, 2), startTime.substring(3, 5));
            var _date2 = new Date(cDate.getFullYear(), cDate.getMonth(), cDate.getDate(), endTime.substring(0, 2), endTime.substring(3, 5));

            if (cDate < _date1) {
                return "Cerrado";
            }
            if (cDate > _date2) {
                return "Cerrado";
            }

            return "Abierto";
        };

        $scope.gTime = function(startTime, endTime) {
            var _default = "Horario no disponible"
            if (startTime == undefined) return _default;
            if (endTime == undefined) return _default;
            if (startTime == "") return _default;
            if (endTime == "") return _default;

            // Formats the date with AM PM
            var cDate = new Date()
            var _date1 = new Date(cDate.getFullYear(), cDate.getMonth(), cDate.getDate(), startTime.substring(0, 2), startTime.substring(3, 5));
            var _date2 = new Date(cDate.getFullYear(), cDate.getMonth(), cDate.getDate(), endTime.substring(0, 2), endTime.substring(3, 5));

            return formatAMPM(_date1) + " - " + formatAMPM(_date2);
        };

        $scope.GetAvailablePoints = function(store) {
            if (store.PointsAvailable != undefined) 
            {
                return store.PointsAvailable;
            }
            else
            {
                if (store.Points != undefined)
                {
                    return store.Points;
                }
                else
                {
                    return 0;
                }
            }
        };

        function IsTwitterInstalled() {
            if (!devEnvironment) 
            {
                var URI = "com.twitter.android";                
                if (deviceFactory.device.platform() == "iOS") URI = "twitter://";
                $cordovaAppAvailability.check(URI)
                    .then(function() {
                        // is available
                         $scope.viewdata.socialmediaapps.twitter = true;
                    }, function () {
                        // not available
                        $scope.viewdata.socialmediaapps.twitter = false;                    
                    });
            }
        };

        function IsWazeInstalled() {
            return new Promise(function(resolve,reject){
                if (!devEnvironment) 
                {
                    if (deviceFactory.device.platform() == "Android")
                    {
                        resolve(true);
                        return;
                    }

                    var URI = "http://waze.to";
                    if (deviceFactory.device.platform() == "iOS") URI = "waze://";

                    $cordovaAppAvailability.check(URI)
                        .then(function() {
                            // is available
                            resolve(true);
                        }, function () {
                            // not available
                            resolve(false);
                        });
                }
                else
                {
                    resolve(false);
                }
            });
        };

        function IsFacebookInstalled() {
            if (!devEnvironment) 
            {
                var URI = "com.facebook.katana";
                if (deviceFactory.device.platform() == "iOS") URI = "fb://";
                $cordovaAppAvailability.check(URI)
                    .then(function() {
                        // is available
                         $scope.viewdata.socialmediaapps.facebook = true;                     
                    }, function () {
                        // not available
                        $scope.viewdata.socialmediaapps.facebook = false;                    
                    });
            }
        };

        $scope.ShareViaTwitter = function(store) {
            var message = store.Name;
            $cordovaSocialSharing
                .shareViaTwitter(message)
                .then(function(result) {
                    // Success!
                }, function(err) {
                    // An error occurred. Show a message to the user                    
                });
        };

        $scope.ShareViaFacebook = function(store) {
            var message = store.Name;
            $cordovaSocialSharing
                .shareViaFacebook(message)
                .then(function(result) {
                    // Success!
                }, function(err) {
                    // An error occurred. Show a message to the user
                });
        };

        $scope.OpenPage = function(pageUrl) {
            var options = {
                location: 'yes',
                clearcache: 'yes',
                toolbar: 'yes'
            };

            $cordovaInAppBrowser.open(pageUrl, '_blank', options)
                .then(function(event) {
                // success
                })
                .catch(function(event) {
                // error
                });
        };

        $scope.EmailTo = function(to) {
            emailService.EmatilTo(to);
        };

        $scope.DoPhoneCall = function(phonenum) {
            var call = "tel:" + phonenum;
            document.location.href = call;
        };

        // Beacon Methods
        function ProcessFoundBeacon(beacon) {
            for (var i=0; i<$scope.viewdata.foundBeacons.length; i++)
            {
                if (beacon.uuid==$scope.viewdata.foundBeacons[i].uuid)
                {
                    return;
                }
            }

            $scope.viewdata.foundBeacons.push(beacon);
            $scope.$apply();            
        };

        function ProcessEmptyBeaconRegion(pluginResult) {
            for (var i=0; i<$scope.viewdata.foundBeacons.length; i++)
            {
                if (pluginResult.region.uuid==$scope.viewdata.foundBeacons[i].uuid)
                {
                    $scope.viewdata.foundBeacons.splice(i,1);
                    $scope.$apply();
                    return;
                }
            }
        };

        function bgTimer() {
            return new Promise(function(resolve,reject){
                setTimeout(function() {
                    if (!$scope.viewdata.storeBeaconFound) {
                        loadingBox.hide();
                        beaconFactory.beaconScanner.stop($scope.viewdata.store.EntityID, $scope.viewdata.store.SubEntityID);

                        swal(
                            {   
                                title: "Oops!",   
                                text: "Parece que la tienda no está cerca.",   
                                type: "warning",   
                                showConfirmButton: true,
                                showCancelButton: false,                       
                                confirmButtonText: "Ok",   
                                closeOnConfirm: true 
                            }
                        );
                    }
                }, 10000);
            });
        };

        $scope.StartScan = function() {
            $scope.viewdata.storeBeaconFound = false;
            loadingBox.show("Escaneando la tienda...");              
            beaconFactory.beaconScanner.start($scope.viewdata.store.EntityID, $scope.viewdata.store.SubEntityID);
            bgTimer();
        };

        $scope.StopScan = function() {
                 
            beaconFactory.beaconScanner.stop($scope.viewdata.store.EntityID, $scope.viewdata.store.SubEntityID); 
        };

        $scope.$on('beaconFound', function(event, beacon) {
            if (!$scope.viewdata.storeBeaconFound)
            {
                $scope.viewdata.storeBeaconFound = true;
                ProcessFoundBeacon(beacon);                
                loadingBox.hide();
                beaconFactory.beaconScanner.stop($scope.viewdata.store.EntityID, $scope.viewdata.store.SubEntityID); 
                swal(
                    {   
                        title: "Listo!",   
                        text: "Se chequeó en la tienda.",   
                        type: "success",   
                        showConfirmButton: true,
                        showCancelButton: false,                       
                        confirmButtonText: "Ok",   
                        closeOnConfirm: true 
                    }
                );
            }            
        });

        $scope.$on('beaconRegionEmpty', function(event, pluginResult){
            ProcessEmptyBeaconRegion(pluginResult);
        });
    }]);

// QR Tab

    ctrl.controller('QRCodeCtrl', ['$scope', '$timeout', 'userFactory', '$ionicLoading', '$ionicModal', '$cordovaPush', 'beaconFactory', 'codeScannerFactory', 'deviceFactory', function($scope, $timeout, userFactory, $ionicLoading, $ionicModal, $cordovaPush, beaconFactory, codeScannerFactory, deviceFactory){
        $timeout(function(){
            $("#viewcontent-QR").show();
            // $("#viewcontent-QR").addClass("animated slideInUp");
            $scope.$apply();
        });

        $scope.$on("$ionicView.enter", function(event, args){
            $("#viewcontent-QR").show();
            
            $scope.viewdata.CardNumber = userFactory.info.cardNumber.get();

            userFactory.info.get(true)
                .then(function(data){              
                    $scope.viewdata.user = data;
                    $scope.$apply();
                })
                .catch(function(err){
                    // TODO
                });

            $scope.$apply();
        });

        $scope.$on('$ionicView.beforeEnter', function(event, args){            
            $("#qrcode-content").hide();
            $("#qrcode-content").removeClass('animated fadeIn');
        });

        $scope.$on('$ionicView.afterEnter', function(event, args){ 
            $("#qrcode-content").addClass('animated fadeIn');
            $("#qrcode-content").show();
        });

        $scope.viewdata = {
            user: {},
            CardNumber: "",
            beaconsFound: []
        };

        $scope.SetupQRCode = function(cardNumber) {
            // return "'" + cardNumber + "'";
            return cardNumber;
        };

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

            beaconFactory.beacons.get()
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

// My Kenuu
 
    ctrl.controller('KenuuCtrl', ['$scope', '$timeout', 'loadingBox', 'userFactory', 'commerceFactory', '$state', '$ionicLoading', 'setupView', 'emailService', 'navigationFactory', '$cordovaActionSheet', '$cordovaCamera', '$cordovaImagePicker', '$cordovaFile', 'imageFunctions', 'appVersionFactory', '$ionicHistory', '$cordovaPush', 'deviceFactory', '$cordovaInAppBrowser', 'signupSetupFactory', 'storeFactory', 'formatServices', function($scope, $timeout, loadingBox, userFactory, commerceFactory, $state, $ionicLoading, setupView, emailService, navigationFactory, $cordovaActionSheet, $cordovaCamera, $cordovaImagePicker, $cordovaFile, imageFunctions, appVersionFactory, $ionicHistory, $cordovaPush, deviceFactory, $cordovaInAppBrowser, signupSetupFactory, storeFactory, formatServices){
        $scope.$on("$ionicView.enter", function(event, args){
            $scope.viewdata.pullMemberFromServer = true;
            storeFactory.selectedStore.reset();
            navigationFactory.setDefaults();
            LoadData();
            LoadCommerceData();            
        });

        $scope.viewdata = {
            qrcode: "",
            counter: 1,
            positions: [],
            user: {
                activity: '',
                Avatar: ''
            },
            defaultAvatarImg_male: 'img/default.png',
            defaultAvatarImg_female: 'img/default_female.png',
            appVersion: '',
            pleaseWaitMessage: 'Buscando su información...',
            pullMemberFromServer: true,
            registerForNotifications: signupSetupFactory.pushNotifications.get() // used on the setup modal
        };

        $scope.$on('$ionicView.beforeEnter', function(event, args){
            $("#mykenuu-content").hide();
            $("#mykenuu-content").removeClass('animated fadeIn');
        });

        $scope.$on('$ionicView.afterEnter', function(event, args){ 
            $("#mykenuu-content").addClass('animated fadeIn');
            $("#mykenuu-content").show();
        });

        $scope.gDate = function(date) {
            return formatServices.FormatDateWithT(date);
            // var _date = new Date(parseInt(date.substr(6)));
            // console.log(_date);
            // return _date.getDate() + "/" + (_date.getMonth()+1) + "/" + _date.getFullYear();
        };

        $scope.getMenuIcon = function() {
            if (!devEnvironment) {
                if (deviceFactory.device.device().platform == "iOS") return "icon ion-navicon";
                else return "icon ion-android-more-vertical";    
            }
            else return "icon ion-android-more-vertical";
        };

        loadingBox.show($scope.viewdata.pleaseWaitMessage);

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
                $("#viewKenuu").addClass("animated fadeIn");
                setTimeout(function(){
                    $("#viewKenuu").removeClass("animated fadeIn");
                }, 800);
            }        
        };

        function ShowErrorView() {
            $("#viewKenuuError").show();
            $("#viewKenuuError").addClass("animated slideInUp");
        };

        $scope.doRefresh = function() {
            loadingBox.show('Actualizando la información del perfil...');
            userFactory.info.get(true)
                .then(function(data){
                    $scope.viewdata.pullMemberFromServer = false;
                    loadingBox.hide();              
                    $scope.viewdata.user = data;
                    $scope.$broadcast('scroll.refreshComplete');
                });
        };

        function LoadData() {
            userFactory.info.get($scope.viewdata.pullMemberFromServer)
                .then(function(data){
                    $scope.viewdata.pullMemberFromServer = false;
                    loadingBox.hide();              
                    $scope.viewdata.user = data;

                    // TODO: pending to implement the pull image from the profile that comes from the service
                    // $scope.profileimage = localStorage.getItem('profile_picture');
                    // if ($scope.profileimage == undefined) $scope.profileimage = '';

                    // Sets the Avatar Image when there is no image defined
                    var _gender = localStorage.getItem('profile_gender');                    
                    $scope.viewdata["gender"] = _gender;


                    if (($scope.viewdata.user.AvatarMobile == '')||($scope.viewdata.user.AvatarMobile == undefined))
                    {
                        if (_gender != undefined) {  
                            if (_gender == "M") {
                                $scope.viewdata.user.AvatarMobile = $scope.viewdata.defaultAvatarImg_female;
                            }
                            else {
                                $scope.viewdata.user.AvatarMobile = $scope.viewdata.defaultAvatarImg_male;
                            }
                        }
                        else {
                            $scope.viewdata.user.AvatarMobile = $scope.viewdata.defaultAvatarImg_male;   
                        }
                    }

                    $scope.$apply();
                    
                    var userData = data;
                    ShowView();
                })
                .catch(function(err){
                    loadingBox.hide();
                    ShowErrorView();
                });
        };

        // Code that runs when the View is finished rendering
        $timeout(function(){
            LoadData();
            LoadCommerceData();
            $scope.GetAppVersion();
        });
        
        $scope.ReloadData = function() {
            $("#viewKenuuError").hide();
            loadingBox.show($scope.viewdata.pleaseWaitMessage);
            setTimeout(function() {
                LoadData();    
            }, 150);
        };

        $scope.getUserImage = function(){
            if(($scope.viewdata.user.Avatar)&&($scope.viewdata.Avatar !='')){
                return $scope.viewdata.user.Avatar;
            } else {
                return 'img/default.png';
            }
        };

        $scope.GetCommerceImage = function(image) {
            if (image == null) return '';
            if (image == undefined) return '';
            if (image == '') return '';

            return imageserverurl + image;
        };

        $scope.GoToProfile = function() {

            $state.go("tab.kenuu-profile");
        };

        $scope.GoToRewards = function() {
            commerceFactory.selectedCommerce.clearSelection();
            $state.go("tab.kenuu-prices");
        };

        function LoadCommerceData() {
            loadingBox.show($scope.viewdata.pleaseWaitMessage);        
            userFactory.activity.visits.commerce()
                .then(function(data){
                    setTimeout(function() {
                        $scope.viewdata.commerces = data.VisitedCommerces;
                        $scope.$apply();
                        loadingBox.hide();                
                    }, 150);
                })
                .catch(function(err){
                    setTimeout(function() { 
                        setTimeout(function(){
                            loadingBox.hide();
                        }, 150);                    
                    }, 220);
                }); 
        };

        $scope.GoToCommerce = function(commerce) {
            navigationFactory.store.setTab("tab.kenuu-storedetail");
            navigationFactory.stores.setTab("tab.kenuu-commercestores");
            navigationFactory.commerce.setTab("tab.kenuu-commerce");
            commerceFactory.selectedCommerce.set(commerce);
            $state.go(navigationFactory.commerce.get());
        };

        $scope.ChangeProfilePic = function() {
            var actionsheetoptions = {
                buttonLabels: ['Escogerla...', 'Tomar Foto'],
                addCancelButtonWithLabel: 'Cancel',
                androidEnableCancelButton : true,
                winphoneEnableCancelButton : true
            };

            $cordovaActionSheet.show(actionsheetoptions)
                .then(function(btnIndex) {
                    var index = btnIndex;
                    if (index == 1) PickImage();
                    if (index == 2) TakePicture();
                });
        };

        function makeid() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i=0; i < 5; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            return text;
        };

        function onCopySuccess(entry) {
            $scope.$apply(function () {
                $scope.profileimage = entry.nativeURL;
                localStorage.setItem('profile_picture', entry.nativeURL);
                $scope.viewdata.user.Avatar = $scope.profileimage;

                localStorage.setItem('profile_picture', $scope.profileimage);            

                imageFunctions.ConvertImgToBase64URL($scope.profileimage, function(imagedata) {
                    userFactory.info.updateAvatar(imagedata)
                        .then(function(response){
                            if ((response.status == 'true')||(response.status == true))
                            {
                                var imageUrl = "http://201.201.150.159/avatar/"
                                var updateData = {
                                    FirstName: $scope.viewdata.user.FirstName, // data.FirstName,
                                    LastName: $scope.viewdata.user.LastName, // data.LastName,
                                    UpdatePassword: $scope.viewdata.user.UpdatePassword,
                                    Password: $scope.viewdata.user.Password,
                                    AvatarMobile: imageUrl + response.data
                                }
                                // console.log('UPDATE DATA');
                                // console.log(updateData);
                                userFactory.info.update(updateData)
                                    .then(function(updateResponse){
                                        // console.log('UPDATE RESPONSE!!!');
                                        // console.log(updateResponse);
                                        localStorage.setItem('profile_picture_urlfilename', response.data);
                                        $scope.viewdata.user.AvatarMobile = imageUrl + response.data;
                                        $scope.$apply();
                                    })
                                    .catch(function(err){
                                        // console.log("ERRRRROOOOORRRR!!! 2");
                                        // console.log(JSON.stringify(err));
                                        loadingBox.hide();
                                        ShowModalMsg('Oops!', 'No se pudo guardar tu foto de perfil.', 'Ok');
                                    });
                            }
                            else
                            {
                                // ShowModalMsg('Oops!', 'No se pudo guardar tu foto de perfil.', 'Ok');
                            }
                        })
                        .catch(function(err){
                            // ShowModalMsg('Oops!', 'No se pudo guardar tu foto de perfil.', 'Ok');
                        })
                });
            });
        };

        function copyFile(fileEntry) {
            var name = fileEntry.fullPath.substr(fileEntry.fullPath.lastIndexOf('/') + 1);
            var newName = makeid() + name;

            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, 
                function(fileSystem2) {
                    fileEntry.copyTo(fileSystem2, newName, onCopySuccess, fail);
                },
                fail
            );
        };

        function fail(err) {
            alert(JSON.stringify(err));
        };

        function SavePicture(picturedata) {
            window.resolveLocalFileSystemURL(picturedata, copyFile, fail);
        };

        function TakePicture() {
            var options = {
                quality: 100,
                destinationType: Camera.DestinationType.FILE_URI, // Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.CAMERA,
                allowEdit: true,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 300,
                targetHeight: 300,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: false,
                cameraDirection: 1,
                correctOrientation: true
            };

            $cordovaCamera.getPicture(options).then(function(imageData) {
                // $scope.viewdata.user.Avatar = "data:image/jpeg;base64," + imageData;
                SavePicture(imageData);
            }, function(err) {
                // error
            });
        };

        function PickImage() {
            var options = {
                quality: 50,
                destinationType: Camera.DestinationType.FILE_URI,
                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                allowEdit: true,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 100,
                targetHeight: 100,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: false,
                cameraDirection: 1
            };

            $cordovaCamera.getPicture(options).then(function(imageData) {
                SavePicture(imageData);
            }, function(err) {
                // error
            });
        };

        $scope.GetAppVersion = function() {
            $scope.viewdata.appVersion = appVersionFactory.appVersion.get();
        };

        $scope.DoLogout = function() {
            // Forcing the Reference ID clear
            localStorage.removeItem("userReferenceID");

            userFactory.session.logout();
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
            $state.go("welcome");
            $scope.CloseSetup();
        };

        $scope.OpenSiteUrl = function(url) {
            var options = {
                location: 'yes',
                clearcache: 'yes',
                toolbar: 'yes'
            };

            $cordovaInAppBrowser.open(url, '_blank', options)
                .then(function(event) {
                    // success
                })
                .catch(function(event) {
                    // error
                });
        };

        // Required to Show the Top Bar Setup View
        $scope.ShowSetupView = function() {setupView.Show($scope);};
        $scope.CloseSetup = function() {setupView.Close($scope);};
        $scope.ContactUs = function() {emailService.ContactCustomerService();}

        $scope.PushNotificationsToggle = function() {
            if ($scope.viewdata.registerForNotifications)
            {
                // Do Registration
                var email = userFactory.info.email.get();
                signupSetupFactory.pushNotifications.set(true);

                if (email != '') {
                    RegisterDevice()
                    .then(function(response){
                        // Not required...        
                    })
                    .catch(function(err){
                        $scope.viewdata.registerForNotifications = false;
                        signupSetupFactory.pushNotifications.set(false);
                    });    
                }                
            }
            else
            {
                // De-register
                signupSetupFactory.pushNotifications.set(false);
            }
        };

        function RegisterDevice(email) {
            return new Promise(function(resolve,reject){
                var iosConfig = {
                    "badge": true,
                    "sound": true,
                    "alert": true,
                };
                var androidConfig = {
                    "senderID": "671633506930"
                };

                deviceFactory.device.registeredUser.set(email);

                if (deviceFactory.device.platform() == "iOS")
                {
                    $cordovaPush.register(iosConfig)
                        .then(
                            function(deviceToken)
                            {
                                deviceFactory.device.registerdevice(deviceToken, email)
                                    .then(function(response){                             
                                        resolve(response);
                                    })
                                    .catch(function(err){                                        
                                        reject(err);
                                    });
                            },
                            function(err) {
                                reject(err);
                            }
                        );
                }

                if (deviceFactory.device.platform() == "Android")
                {
                    $cordovaPush.register(androidConfig).then(function(result) {
                            // Success
                            resolve(result);
                        }, function(err) {
                            // Error
                            reject(err);
                        });
                }
            });
        };
    }]);

    ctrl.controller('ActivityCtrl', ['$scope', '$rootScope', '$state', 'userFactory', 'socialSharing', 'loadingBox', 'commerceFactory', 'navigationFactory', 'storeFactory', '$cordovaKeyboard', 'formatServices', 'msgBox', function($scope, $rootScope, $state, userFactory, socialSharing, loadingBox, commerceFactory, navigationFactory, storeFactory, $cordovaKeyboard, formatServices, msgBox){
        
        $scope.viewdata = {
            user: {
                activityfulllist: [],
                activityVisits: [],
                activityRedemptions: [],
                activity: []            
            },
            currentActivityPage: 0,
            pageSize: 5,
            commerces: [],
            showLoadMoreButton: true,
            LoadingMore: false,
            loadMoreButtonMessage: 'Ver Más...',
            searchtext: '',
            searchtextfield: '',
            filterOptionSelected: 'V',
            pleaseWaitMessage: 'Buscando su actividad...',
            openingCommerceMessage: 'Buscando el comercio...',
            openingStoreMessage: 'Buscando la tienda...',
            activityCounterLabel: ""
        };

        $scope.$on("$ionicView.enter", function(event, args){
            storeFactory.selectedStore.reset();
            $scope.viewdata.searchtextfield = "";
            $scope.viewdata.currentActivityPage = 0;
            $scope.viewdata.user.activity = [];
            $scope.viewdata.user.activityfulllist = [];
            $scope.viewdata.showLoadMoreButton = true;
            LoadData();

            SetButtonActiveEffectForAndroid();
        });

        function SetButtonActiveEffectForAndroid() {
            if (navigator.userAgent.toLowerCase().indexOf("android") > -1) {
                $(".activity-topbtn")
                    .bind("touchstart", function () {
                        $(this).addClass("activity-topbtn-fake-active");
                    })
                    .bind("touchend", function() {
                        $(this).removeClass("activity-topbtn-fake-active");
                    });
            }
        };

        $scope.$on("$ionicView.leave", function(event, args){  
            $scope.viewdata.searchtextfield = "";          
            $scope.viewdata.currentActivityPage = 0;
            $scope.viewdata.user.activityfulllist = []; 
            $scope.viewdata.user.activity = [];
            $scope.viewdata.showLoadMoreButton = true;
            $scope.viewdata.activityCounterLabel = 0;
            $scope.viewdata.filterOptionSelected = 'V';
        });

        $scope.selectedButtonClass = function(type) {
            if ($scope.viewdata.filterOptionSelected == type) {
                return "activity-selectedFilterOption";
            }
            else {
                return "";
            }
        };

        $scope.SetActivityFilter = function(type) {
            $scope.viewdata.filterOptionSelected = type;
            $scope.ApplySearchFilter();
        };

        $scope.ApplySearchFilter = function() {
            var array = GetActivityOfType($scope.viewdata.user.activityfulllist, $scope.viewdata.filterOptionSelected, $scope.viewdata.searchtextfield);
            if ($scope.viewdata.filterOptionSelected == 'V') {
                $scope.viewdata.user.activityVisits = array;                
            }
            if ($scope.viewdata.filterOptionSelected == 'R') {
                $scope.viewdata.user.activityRedemptions = array;
            }

            $scope.viewdata.user.activity = [];
            $scope.viewdata.currentActivityPage = 0;
            $scope.SetActivityPageToShow(); 

            if (!devEnvironment) $cordovaKeyboard.close(); 
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
                    $scope.$broadcast('scroll.refreshComplete');
                    loadingBox.hide();               
                });
        };

        $scope.GetCommerceImage = function(image) {
            if (image == null) return '';
            if (image == undefined) return '';
            if (image == '') return '';
            
            return imageserverurl + image;
        };

        function strEval(value, defaultVal) {
            if (value == undefined) return defaultVal;
            if (value == null) return defaultVal;
            return value;
        };

        function GetActivityOfType(array, type, searchText) {
            var j = array.length;
            var result = [];
            for (var i=0; i<j; i++) {
                if ((searchText != undefined)&&(searchText != "")) {
                    if (
                        (strEval(array[i].SubEntityName, "").toUpperCase().indexOf(searchText.toUpperCase()) >= 0)||
                        (strEval(array[i].RewardName, "").toUpperCase().indexOf(searchText.toUpperCase()) >= 0)||
                        (strEval(array[i].RewardDescription, "").toUpperCase().indexOf(searchText.toUpperCase()) >= 0)
                    ) {
                        if (array[i].ActivityType == type) result.push(array[i]);
                    }
                }
                else {
                    if (array[i].ActivityType == type) result.push(array[i]);
                }                
            }
            return result;
        }

        function LoadData_Activity(userID) {
            $scope.viewdata.currentActivityPage = 0;
            loadingBox.show($scope.viewdata.pleaseWaitMessage);
            userFactory.activity.all(userID)
                .then(function(data){   
                    // setTimeout(function() {

                        // console.log(data)

                        $scope.viewdata.user.activity = [];
                        $scope.viewdata.user.activityfulllist = data.Elements;
                        $scope.viewdata.user.activityVisits = GetActivityOfType(data.Elements, 'V');
                        $scope.viewdata.user.activityRedemptions = GetActivityOfType(data.Elements, 'R');

                        $scope.SetActivityPageToShow();
                        $scope.$apply();

                        loadingBox.hide();
                        $scope.$broadcast('scroll.refreshComplete');
                        $("#activityListDiv").show();
                        $("#activityListDiv").addClass("animated fadeIn");
                    // }, 150);            
                })
                .catch(function(err){                     
                    loadingBox.hide();
                    $scope.$broadcast('scroll.refreshComplete');                    
                });
        };

        $scope.SetActivityPageToShow = function() {
            var activityArray = [];
            $scope.viewdata.activityCounterLabel = 0;
            $scope.viewdata.showLoadMoreButton = true;

            if ($scope.viewdata.filterOptionSelected == 'V') {
                activityArray = $scope.viewdata.user.activityVisits;                
            }
            if ($scope.viewdata.filterOptionSelected == 'R') {
                activityArray = $scope.viewdata.user.activityRedemptions;
            }

            if (activityArray == undefined) {
                $scope.viewdata.loadMoreButtonMessage = "No tiene ninguna actividad.";
                return;
            }
            if (activityArray.length == 0) {
                $scope.viewdata.loadMoreButtonMessage = "No tiene ninguna actividad.";
                return;            
            }

            $scope.viewdata.loadMoreButtonMessage = "Ver más...";

            var pages = Math.ceil(activityArray.length / $scope.viewdata.pageSize);
            var startIndex = $scope.viewdata.currentActivityPage * $scope.viewdata.pageSize;
            var endIndex = startIndex + $scope.viewdata.pageSize;

            // console.log("Loading data into the list...");
            // console.log("Current Page: " + $scope.viewdata.currentActivityPage)
            // console.log("Page Size: " + $scope.viewdata.pageSize)
            // console.log("Páginas: " + pages)
            // console.log("Total: " + activityArray.length);

            if ($scope.viewdata.currentActivityPage == (pages-1))                
            {
                // Last Page Reached
                $scope.viewdata.showLoadMoreButton = false;                
            }

            if ((pages == 0) && (activityArray.length > 0)) {
                $scope.viewdata.showLoadMoreButton = false;
            }

            var _currentPageCount = 0;

            for (var i=startIndex; i<endIndex; i++)
            {
                if (activityArray[i] != undefined) {
                    if ($scope.viewdata.filterOptionSelected == activityArray[i].ActivityType) {
                        $scope.viewdata.user.activity.push(activityArray[i]);
                        _currentPageCount++;
                    }                    
                }                
            }

            $scope.viewdata.activityCounterLabel = activityArray.length;

            $scope.viewdata.currentActivityPage++;

            // setTimeout(function() {                
            //     $scope.$broadcast('scroll.infiniteScrollComplete');                
            // }, 1000);            
        };

        $scope.Reload = function() {
            $("#errorWhenLoadingDiv").addClass("animated slideOutUp");
            setTimeout(function(){
                $scope.viewdata.searchtextfield = "";
                LoadData();
            }, 200);        
        };

        function GetMonthName(month) {
            switch(month)
            {
                case 1: return "Enero";
                case 2: return "Febrero";
                case 3: return "Marzo";
                case 4: return "Abril";
                case 5: return "Mayo";
                case 6: return "Junio";
                case 7: return "Julio";
                case 8: return "Agosto";
                case 9: return "Setiembre";
                case 10: return "Octubre";
                case 11: return "Noviembre";
                case 12: return "Diciembre";
            }
        };

        $scope.gDate = function(date) {
            var _dateFormated = formatServices.FormatDateWithTAndTime(date);
            return _dateFormated;
        };

        $scope.GetActivityIcon = function(activityType) {
            if (activityType === "V") return "ion-android-pin";
            if (activityType === "R") return "ion-ribbon-a";
        };

        $scope.GetActivityPointsLabel = function(activityType) {
            if (activityType === "V") return "+";
            if (activityType === "R") return "-";
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

        $scope.OpenCommerce = function(entityID) {
            loadingBox.show($scope.viewdata.openingCommerceMessage);
            commerceFactory.get(entityID)
                .then(function(response){                
                    commerceFactory.selectedCommerce.set(response[0]);
                    navigationFactory.store.setTab("tab.kenuu-storedetail");
                    navigationFactory.stores.setTab("tab.kenuu-commercestores");
                    navigationFactory.commerce.setTab("tab.kenuu-commerce");
                    loadingBox.hide();
                    $state.go(navigationFactory.commerce.get());
                })
                .catch(function(response){
                    loadingBox.hide();
                });        
        };

        $scope.OpenStore = function(subEntityID, storeStatus) {

            if (storeStatus == "IN") {
                msgBox.showSimpleMessage("!!!", "Esta tienda ya no forma parte de Kenuu. Es posible que ya no exista.");
                return;
            }

            loadingBox.show($scope.viewdata.openingStoreMessage);

            commerceFactory.stores.general(0, "", subEntityID)
                .then(function(response){
                    if (response.length > 0)
                    {                        
                        storeFactory.selectedStore.set(response[0]);
                        navigationFactory.store.setTab("tab.kenuu-storedetail");
                        navigationFactory.stores.setTab("tab.kenuu-commercestores");
                        navigationFactory.commerce.setTab("tab.kenuu-commerce");
                        loadingBox.hide();
                        $state.go(navigationFactory.store.get());
                    }
                    else {
                        loadingBox.hide();
                    }                    
                }).catch(function(err){
                    loadingBox.hide();
                });   
        };

        $scope.search = function(item) {
            if (item.SubEntityName.indexOf($scope.viewdata.searchtext) >= 0) return true;
            if (item.RewardName.indexOf($scope.viewdata.searchtext) >= 0) return true;
            return false;
        };

        $scope.SearchFocus = function() {
            $("#btnClearSearchActivity").show();                       
        };

        $scope.SearchBlur = function() {
            $("#btnClearSearchActivity").hide();
            if (!devEnvironment) $cordovaKeyboard.close(); 
        };

        $scope.ClearSearch = function() {   
            $("#searchTextActivity").blur();
            $scope.viewdata.searchtextfield = ""; 
            $scope.viewdata.searchtext = "";
            $scope.ApplySearchFilter();
        };

        $scope.doRefresh = function() {
            LoadData();
        };
    }]);

    ctrl.controller('KenuuFavCommercesCtrl', ['$scope', '$state', 'userFactory', 'commerceFactory', 'dateFxService', 'loadingBox', function($scope,$state,userFactory,commerceFactory,dateFxService,loadingBox){

        $scope.viewdata = {
            commerces: []
        };

        function LoadData_User() {
            userFactory.info.get(true,2)
                .then(function(data){                      
                    $scope.viewdata.user = data;
                    $scope.$apply();                
                    LoadData($scope.viewdata.user.AccountID)
                })
                .catch(function(err){ 
                    // console.log(err)               
                });
        };

        function LoadData(userID) {
            loadingBox.show();
            userFactory.activity.visits.commerce()
            .then(function(data){
                setTimeout(function() { 
                    $scope.viewdata.commerces = data.VisitedCommerces;
                    $scope.$apply();

                    loadingBox.hide();
                    $("#favcommerces-list").show();
                    $("#favcommerces-list").addClass("animated fadeIn");
                }, 150);
            })
            .catch(function(err){
                setTimeout(function() { 
                    // $("#errorWhenLoadingDiv").removeClass("animated slideOutUp");
                    setTimeout(function(){
                        loadingBox.hide();
                        // $("#errorWhenLoadingDiv").show();                    
                        // $("#errorWhenLoadingDiv").addClass("animated slideInDown");    
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
            commerceFactory.selectedCommerce.set(commerce);
            var _state = navigationFactory.commerce.get();
            $state.go(_state);
        };

        $scope.Reload = function() {
            $("#errorWhenLoadingDiv").addClass("animated slideOutUp");
            setTimeout(function(){
                $("#favCommercePleaseWaitSpinner").removeClass("slideOutUp");
                $("#favCommercePleaseWaitSpinner").addClass("animated slideInDown");
                LoadData();
            }, 200);        
        };

        LoadData_User();
    }]);

    ctrl.controller('KenuuProfileCtrl', ['$scope', '$timeout', 'userFactory', '$state', '$ionicHistory', 'msgBox', '$ionicLoading', 'loadingBox', 'referenceIDFactory', function($scope, $timeout, userFactory, $state, $ionicHistory, msgBox, $ionicLoading, loadingBox, referenceIDFactory){
        $scope.viewdata = {
            qrcode: "Kenuu",
            counter: 1,
            positions: [],
            user: {
                name: '',
                lastname: '',
                activity: '',
                MobilePhone: '',
                email: '',
                currentpassword: '',
                password: '',
                passwordconfirmation: ''
            },
            pleaseWaitMessage: 'Buscando su información...',
            sainvgInfoMessage: 'Se está guardando su información...',
            profilegender: 'H',
            hasMobilePhone: false // When the user loads, if the phone is present, it is required to be entered into the form.
        };

        $scope.inputType = "password";
        $scope.showChangePwd = false;

        $scope.viewdata.profilegender = localStorage.getItem('profile_gender');
        if ($scope.viewdata.profilegender == undefined) {
            $scope.viewdata.profilegender = 'H';
        }

        $scope.hideShowPassword = function() {
            if ($scope.inputType == 'password')
                $scope.inputType = 'text';
            else
                $scope.inputType = 'password';
        };

        $scope.hideShowChangePassword = function() {
            if ($scope.showChangePwd) $scope.showChangePwd = false;
            else $scope.showChangePwd = true;
        };

        function LoadProfileData() {
            loadingBox.show($scope.viewdata.pleaseWaitMessage);
            userFactory.info.get(true)
                .then(function(data){
                    $scope.viewdata.user = data;
                    var userData = data;
                    
                    $scope.viewdata.user.name = userData.FirstName;
                    $scope.viewdata.user.lastname = userData.LastName;
                    $scope.viewdata.user.MobilePhone = Number(userData.MobilePhone);
                    $scope.viewdata.user.email = userData.Email;

                    $scope.viewdata.user.currentpassword = '';
                    $scope.viewdata.user.password = '';
                    $scope.viewdata.user.passwordconfirmation = '';

                    if ($scope.viewdata.user.MobilePhone == 0) {
                        $scope.viewdata.hasMobilePhone = false;
                        $scope.viewdata.user.MobilePhone = "";
                    }
                    else {
                        $scope.viewdata.hasMobilePhone = true;
                    }

                    $scope.$apply();

                    loadingBox.hide();
                    $scope.$broadcast('scroll.refreshComplete');
                })
                .catch(function(err){
                    loadingBox.hide();
                    $scope.$broadcast('scroll.refreshComplete');
                });
        };

        $scope.$on("$ionicView.enter", function(event, args){
            LoadProfileData();
        });

        function DoLogin() {
            userFactory.session.login(
                {
                    email: $scope.viewdata.user.email,
                    password: $scope.viewdata.user.currentpassword
                }
            )
            .then(function(data){  

                console.log("Login Result:");
                console.log(data);

                referenceIDFactory.setReferenceID(data.ReferenceID);

                SaveProfile();
            })
            .catch(function(error){

                // console.log("Login Error Result:");
                // console.log(error);

                loadingBox.hide();
                msgBox.showWarning("Oops!", "Contraseña actual incorrecta.");
            });
        };

        function SaveProfile() {
            var dataToSave = {
                FirstName: $scope.viewdata.user.name,
                LastName: $scope.viewdata.user.lastname,                
                UpdatePassword: false,
                Password: ""
            };

            if ($scope.showChangePwd) {
                dataToSave.UpdatePassword = true;
                dataToSave.Password = $scope.viewdata.user.password;
            }

            if ($scope.viewdata.user.MobilePhone != "") {
                dataToSave["MobilePhone"] = $scope.viewdata.user.MobilePhone;
            }

            userFactory.info.update(dataToSave)
            .then(function(response){

                // console.log("Save Profile Result:");
                // console.log(response);

                loadingBox.hide();
                if ((response.status=="true")||(response.status==true))
                {
                    // referenceIDFactory.setReferenceID(response.data.referenceID);

                    localStorage.setItem('profile_gender', $scope.viewdata.profilegender);
                    
                    $scope.viewdata.user.currentpassword = '';
                    $scope.viewdata.user.password = '';
                    $scope.viewdata.user.passwordconfirmation = '';

                    // referenceIDFactory.setReferenceID(response.data.referenceID);

                    msgBox.showOk("Listo!", "Su perfil se guardó con éxito.");

                    // LoadProfileData();

                    // userFactory.info.get(true)
                    // .then(function(data){
                    //     msgBox.showOk("Listo!", "Su perfil se guardó con éxito.");
                    // })
                    // .catch(function(err){
                    //     msgBox.showWarning("Oops!", "Ocurrió un problema al guardar su información, por favor inténtelo de nuevo.", "Ok");
                    // });
                }
                else
                {
                    msgBox.showWarning("Oops!", "Ocurrió un problema al guardar su información, por favor inténtelo de nuevo.", "Ok");
                }
            })
            .catch(function(err){
                loadingBox.hide();
                console.log(err);
                msgBox.showWarning("Oops!", "Ocurrió un problema al guardar su información, por favor inténtelo de nuevo.", "Ok");
            });
        };

        $scope.SaveProfile = function() {
            loadingBox.show($scope.viewdata.sainvgInfoMessage);

            if ($scope.viewdata.user.name == "") {                
                loadingBox.hide();
                msgBox.showWarning("Oops!", "Su nombre es requerido.");
                return;
            }

            if ($scope.viewdata.user.lastname == "") {                
                loadingBox.hide();
                msgBox.showWarning("Oops!", "Su apellido es requerido.");
                return;
            }

            if (($scope.viewdata.user.MobilePhone == null)||($scope.viewdata.user.MobilePhone == "0")) {
                $scope.viewdata.user.MobilePhone = "";
            }

            if ($scope.viewdata.user.MobilePhone != "") {
                if ($scope.viewdata.user.MobilePhone.length < 4) {
                    loadingBox.hide();
                    msgBox.showWarning("Oops!", "El número de teléfono debe tener al menos 4 dígitos.");
                    return;
                }
            }

            if ($scope.viewdata.hasMobilePhone) {
                if (($scope.viewdata.user.MobilePhone == null)||($scope.viewdata.user.MobilePhone == "0")||($scope.viewdata.user.MobilePhone == "")) {
                    loadingBox.hide();
                    msgBox.showWarning("Oops!", "El número de teléfono debe tener al menos 4 dígitos.");
                    return;
                }
            }

            if ($scope.showChangePwd) {
                if (($scope.viewdata.user.currentpassword == "") || ($scope.viewdata.user.currentpassword == ""))
                {
                    loadingBox.hide();
                    msgBox.showWarning("Oops!", "Por favor ingresar su contraseña actual.", "Ok");
                    return false;
                }

                if (($scope.viewdata.user.password == "") || ($scope.viewdata.user.passwordconfirmation == ""))
                {
                    loadingBox.hide();
                    msgBox.showWarning("Oops!", "Por favor ingresar su contraseña y la confirmación.", "Ok");
                    return false;
                }

                if ($scope.viewdata.user.password != $scope.viewdata.user.passwordconfirmation)
                {
                    loadingBox.hide();
                    msgBox.showWarning("Oops!", "Sus contraseñas no coinciden.", "Ok");
                    return false;
                }

                if ($scope.viewdata.user.password.length < 8) {
                    loadingBox.hide();
                    msgBox.showWarning("Oops!", "Su contraseña tiene que tener al menos 8 dígitos.", "Ok");
                    return false;
                }

                if ($scope.viewdata.user.passwordconfirmation.length < 8) {
                    loadingBox.hide();
                    msgBox.showWarning("Oops!", "La confirmación de su contraseña tiene que tener al menos 8 dígitos.", "Ok");
                    return false;
                }

                DoLogin();
            }
            else {
                SaveProfile();
            }
        };

        $scope.ChangePassword = function() {  
            if (($scope.viewdata.user.currentpassword == "") || ($scope.viewdata.user.currentpassword == ""))
            {
                ShowModalMsg("Oops!", "Por favor ingresar su contraseña actual.", "Ok");
                return false;
            }

            if (($scope.viewdata.user.password == "") || ($scope.viewdata.user.passwordconfirmation == ""))
            {
                ShowModalMsg("Oops!", "Por favor ingresar su contraseña y la confirmación.", "Ok");
                return false;
            }

            if ($scope.viewdata.user.password != $scope.viewdata.user.passwordconfirmation)
            {
                ShowModalMsg("Oops!", "Sus contraseñas no coinciden.", "Ok");
                return false;
            }

            loadingBox.show();

            userFactory.info.update({   
                FirstName: $scope.viewdata.user.name,
                LastName: $scope.viewdata.user.lastname,         
                UpdatePassword: true,
                Password: $scope.viewdata.user.password
            })
            .then(function(response){
                loadingBox.hide();
                if ((response.status=="true")||(response.status==true))
                {
                    referenceIDFactory.setReferenceID(response.data.referenceID);

                    userFactory.info.get()
                    .then(function(data){
                        msgBox.showOkWithAction("¡Listo!", "Información actualizada.", function() {                        
                            $ionicHistory.goBack();
                        });
                    })
                    .catch(function(err){                    
                        // console.log(err);
                    });                
                }
                else
                {                
                    ShowModalMsg("Oops!", "Su contraseña no es válida.", "Ok");
                    return false;
                }
            })
            .catch(function(err){
                loadingBox.hide();

                var _errMessage = "Ocurrió un error, por favor inténtelo de nuevo.";

                switch(err.data.responseCode)
                {
                    case 'EV0000': // Password Inválido
                        _errMessage = "Contraseña tiene un formato inválido, por favor revísela e intente de nuevo";
                        break;
                }

                ShowModalMsg("Oops!", _errMessage, "Ok");
                return false;
            });
        };

        $scope.DoLogout = function() {
            // Forcing the Reference ID clear
            localStorage.removeItem("userReferenceID");

            userFactory.session.logout();
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
            $state.go("welcome");
        };

        $scope.GoToChangePwd = function() {
            $state.go("tab.kenuu-pwdchange");
        };

        $scope.doRefresh = function() {
            LoadProfileData();
        };

        $scope.$watch('viewdata.profilegender', function() {
            if ($scope.viewdata.profilegender == "M" && $scope.viewdata.imageHasChange === false)
            {
                $scope.viewdata.profileimage =  $scope.viewdata.defaultAvatarImg_female;
            }
            if ($scope.viewdata.profilegender == "H" && $scope.viewdata.imageHasChange === false)
            {
                $scope.viewdata.profileimage =  $scope.viewdata.defaultAvatarImg_male;
            }
        });

        $scope.ValMaxLength = function() {
            if ($scope.viewdata.user.MobilePhone != null)
            {
                if ($scope.viewdata.user.MobilePhone.toString().length > 15) {
                    $scope.viewdata.user.MobilePhone = Number($scope.viewdata.user.MobilePhone.toString().substring(0,15));
                }
            }            
        };

        $scope.ValMaxLengthField = function(field, maxlength) {
            if ($scope.viewdata.user[field] != null)
            {
                if ($scope.viewdata.user[field].toString().length > maxlength) {
                    $scope.viewdata.user[field] = $scope.viewdata.user[field].toString().substring(0,maxlength);
                }
            }
        };
    }]);

    ctrl.controller('KenuuPwdChangeCtrl', ['$scope', '$timeout', 'userFactory', '$state', '$ionicHistory', 'msgBox', '$ionicLoading', 'loadingBox', '$cordovaKeyboard', 'referenceIDFactory', function($scope, $timeout, userFactory, $state, $ionicHistory, msgBox, $ionicLoading, loadingBox, $cordovaKeyboard, referenceIDFactory){
        $scope.passwordCheckbox = false;
        $scope.inputType = "password";

        $scope.viewdata = {
            qrcode: "Kenuu",
            counter: 1,
            positions: [],
            user: {
                name: '',
                lastname: '',
                activity: '',
                password: '',
                passwordconfirmation: ''
            },
            msgbox: {
                title: "",
                message: "",
                buttontext: ""
            }
        };

        $scope.$on("$ionicView.enter", function(event, args){
            loadingBox.show();
            userFactory.info.get()
                .then(function(data){
                    loadingBox.hide();
                    $scope.viewdata.user = data;                
                    var userData = data;
                    $scope.viewdata.user.name = userData.FirstName;
                    $scope.viewdata.user.lastname = userData.LastName;

                    $scope.viewdata.user.password = '';
                    $scope.viewdata.user.passwordconfirmation = '';

                    $scope.$apply();
                })
                .catch(function(err){loadingBox.hide();});
        });

        function ShowModalMsg(title, message, buttontext) {
            if (!devEnvironment) $cordovaKeyboard.close();

            swal(
                {   
                    title: title,   
                    text: message,   
                    type: "warning",   
                    showConfirmButton: true,
                    showCancelButton: false,                       
                    confirmButtonText: buttontext,   
                    closeOnConfirm: true 
                }, 
                function(){   
                    
                }
            );

            // $(".md-overlay").removeClass("md-overlay-ok");
            // $(".md-content").removeClass("md-content-ok");
            
            // $scope.viewdata.msgbox.title = title;
            // $scope.viewdata.msgbox.message = message;
            // $scope.viewdata.msgbox.buttontext = buttontext;

            // var modal = document.querySelector('#modal-msgbox-signup'),
            //     close = modal.querySelector( '.md-close' );
            // var overlay = document.querySelector( '.md-overlay' );
            // classie.add( modal, 'md-show' );
            // close.addEventListener( 'click', function( ev ) {
            //     ev.stopPropagation();
            //     classie.remove( document.querySelector('#modal-msgbox-signup'), 'md-show' );
            // });
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

        $scope.SaveProfile = function() {  
            if (($scope.viewdata.user.password == "") || ($scope.viewdata.user.passwordconfirmation == ""))
            {
                ShowModalMsg("Oops!", "Por favor ingresar su contraseña y la confirmación.", "Ok");
                return false;
            }

            if ($scope.viewdata.user.password != $scope.viewdata.user.passwordconfirmation)
            {
                ShowModalMsg("Oops!", "Sus contraseñas no coinciden.", "Ok");
                return false;
            }

            loadingBox.show();

            userFactory.info.update({   
                FirstName: $scope.viewdata.user.name,
                LastName: $scope.viewdata.user.lastname,         
                UpdatePassword: true,
                Password: $scope.viewdata.user.password
            })
            .then(function(response){
                loadingBox.hide();
                if ((response.status=="true")||(response.status==true))
                {
                    referenceIDFactory.setReferenceID(response.data.referenceID);

                    userFactory.info.get()
                    .then(function(data){
                        msgBox.showOkWithAction("¡Listo!", "Información actualizada.", function() {                        
                            $ionicHistory.goBack();
                        });
                    })
                    .catch(function(err){                    
                        // console.log(err);
                    });                
                }
                else
                {                
                    ShowModalMsg("Oops!", "Su contraseña no es válida.", "Ok");
                    return false;
                }
            })
            .catch(function(err){
                loadingBox.hide();

                var _errMessage = "Ocurrió un error, por favor inténtelo de nuevo.";

                switch(err.data.responseCode)
                {
                    case 'EV0000': // Password Inválido
                        _errMessage = "Contraseña tiene un formato inválido, por favor revísela e intente de nuevo";
                        break;
                }

                ShowModalMsg("Oops!", _errMessage, "Ok");
                return false;
            });
        };

        $scope.hideShowPassword = function() {
            if ($scope.inputType == 'password')
                $scope.inputType = 'text';
            else
                $scope.inputType = 'password';
        };
    }]);

// No Connection Procedure

    ctrl.controller('NoConnectionCtrl', ['$scope', '$state', 'userFactory', function($scope, $state, userFactory){
        $scope.viewdata = {
            cardNumber: userFactory.info.cardNumber.get()
        };

        $scope.$on("$ionicView.enter", function(event, args){
            $scope.viewdata.cardNumber = userFactory.info.cardNumber.get();
        });
    }]);

// Login Procedure

    ctrl.controller('SliderCtrl', ['$scope', '$state', function($scope, $state) {
        $scope.skipTitle = "SALTAR";

        $scope.slideHasChanged = function(index) {
            if (index == 2) {
                $scope.skipTitle = "CONTINUAR";
                $("#viewSlider").removeClass("slider-view-2");
                $("#viewSlider").addClass("slider-view");                
            }

            if (index == 1) {
                $scope.skipTitle = "SALTAR";   
                $("#viewSlider").removeClass("slider-view");
                $("#viewSlider").addClass("slider-view-2");
            }
            
            if (index == 0) {
                $scope.skipTitle = "SALTAR";   
                $("#viewSlider").removeClass("slider-view-2");
                $("#viewSlider").addClass("slider-view");
            }
        };

        $scope.GoToLogin = function() {

            var _apikey = localStorage.getItem('userReferenceID');
            if (_apikey != undefined)
            {
                $state.go("tab.nearme");
            }
            else {
                $state.go("welcome");
            }
        };
    }]);

    ctrl.controller('LoginCtrl', ['$scope', '$cordovaKeyboard', 'loginSignUpFactory', 'userFactory', '$ionicLoading', 'referenceIDFactory', '$cordovaPush', 'deviceFactory', '$ionicHistory', '$state', '$ionicModal', 'loadingBox', 'signupSetupFactory', function($scope, $cordovaKeyboard, loginSignUpFactory, userFactory, $ionicLoading, referenceIDFactory, $cordovaPush, deviceFactory, $ionicHistory, $state, $ionicModal, loadingBox, signupSetupFactory) {
        if (!devEnvironment) cordova.plugins.Keyboard.disableScroll(true);

        $scope.passwordCheckbox = false;
        $scope.inputType = "password";

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

        $scope.$on('$ionicView.beforeEnter', function(event, args){            
            $("#welcome-login-content").hide();
            $("#welcome-login-content").removeClass('animated fadeIn');
        });

        $scope.$on('$ionicView.afterEnter', function(event, args){ 
            $("#welcome-login-content").addClass('animated fadeIn');
            $("#welcome-login-content").show();
        });

        $scope.DoLogin = function() {
            if (!devEnvironment) $cordovaKeyboard.close();
            if (($scope.viewdata.login.password === undefined)||($scope.viewdata.login.password === ""))
            {
                ShowModalMsg('Oops!', 'Por favor ingrese su contraseña.', 'Ok');
                return;
            }

            loadingBox.show();

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
                if (!devEnvironment) cordova.plugins.Keyboard.disableScroll(false);
                loadingBox.hide();
                $ionicHistory.clearHistory();
                $ionicHistory.clearCache();
                $ionicHistory.nextViewOptions({
                    disableAnimate: true,
                    disableBack: true,
                    historyRoot: true
                });

                if (deviceFactory.device.platform() == "iOS")
                {
                    $state.go('locationsetup');
                }
                else
                {
                    signupSetupFactory.location.set(true);
                    signupSetupFactory.pushNotifications.set(true);
                    $state.go('tab.nearme');
                }
            })
            .catch(function(err){
                console.log(err);
                loadingBox.hide();
                var _errMessage = "No se pudo ingresar, inténtelo de nuevo.";

                switch(err.data.ErrorCode)
                {
                    case 'MO0005': // Usuario o contraseña inválido.
                        _errMessage = "Usuario o contraseña inválido";
                        break;
                    case 'MO0012': // Error acceso denegado, el usuario se encuentra inactivo.
                        _errMessage = "Su usuario se encuentra inactivo";
                        break; 
                    case 'USR003': // Error usuario bloqueado
                        _errMessage = "Su cuenta se encuentra bloqueada";
                        break;
                    case 'USR005': // La contraseña ha expirado, por favor solicite una nueva contraseña
                        _errMessage = "Su contraseña ha expirado, solicite un cambio haciendo TAP en el botón que dice 'Olvide mi contraseña'";
                        break;
                }

                ShowModalMsg("Oops!", _errMessage, "Ok");
            });
        };

        function ShowModalMsg(title, message, buttontext) {
            if (!devEnvironment) $cordovaKeyboard.close();
                
            swal(
                {   
                    title: title,   
                    text: message,   
                    type: "warning",   
                    showConfirmButton: true,
                    showCancelButton: false,                       
                    confirmButtonText: buttontext,   
                    closeOnConfirm: true,
                    confirmButtonColor: "#A5CD37" 
                }, 
                function(){   
                    
                }
            );

            // $scope.viewdata.msgbox.title = title;
            // $scope.viewdata.msgbox.message = message;
            // $scope.viewdata.msgbox.buttontext = buttontext;

            // var modal = document.querySelector('#modal-msgbox-login'),
            //     close = modal.querySelector( '.md-close' );
            // var overlay = document.querySelector( '.md-overlay' );
            // classie.add( modal, 'md-show' );
            // close.addEventListener( 'click', function( ev ) {
            //     ev.stopPropagation();
            //     classie.remove( document.querySelector('#modal-msgbox-login'), 'md-show' );
            // });
        };

        $scope.recoverPassword = function() {
            swal(
                {   
                    title: "Cambiar Contraseña:",   
                    text: "¿Está seguro que quiere cambiar su contraseña?",   
                    type: "warning",   
                    showCancelButton: true,   
                    cancelButtonText: "Cancelar",
                    confirmButtonColor: "#A5CD37",   
                    confirmButtonText: "Si, cambiarla!",   
                    closeOnConfirm: true 
                }, 
                function() {   
                    loadingBox.show();
                    userFactory.session.passwordrecovery($scope.viewdata.login.email)
                    .then(function(response){
                        loadingBox.hide();

                        $ionicModal.fromTemplateUrl('templates/modals/password-recovery-modal.html', {
                            scope: $scope,
                            animation: 'slide-in-up'
                        }).then(function(modal) {
                            $scope.modal = modal;
                            $scope.modal.show();
                        });            
                    })
                    .catch(function(err){
                        loadingBox.hide();
                        ShowModalMsg("Oops!", "Ocurrió un problema, inténtelo de nuevo.", "Ok");
                    })      
                }
            );
        };

        $scope.CloseModal = function() {
            $scope.modal.hide();
        };

        $scope.hideShowPassword = function() {
            if ($scope.inputType == 'password')
                $scope.inputType = 'text';
            else
                $scope.inputType = 'password';
        };

        $scope.$on('$destroy', function() {
            if ($scope.modal) $scope.modal.remove();
        });
    }]);

    ctrl.controller('PasswordCreateCtrl', ['$scope', '$cordovaKeyboard', 'loginSignUpFactory', 'userFactory', '$ionicLoading', 'referenceIDFactory', '$cordovaPush', 'deviceFactory', '$ionicHistory', '$state', 'loadingBox', function($scope, $cordovaKeyboard, loginSignUpFactory, userFactory, $ionicLoading, referenceIDFactory, $cordovaPush, deviceFactory, $ionicHistory, $state, loadingBox) {
        if (!devEnvironment) cordova.plugins.Keyboard.disableScroll(true);

        $scope.viewdata = {
            signup: {
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

        $scope.DoSignUp = function() {
            if (!devEnvironment) $cordovaKeyboard.close();
            if (($scope.viewdata.login.password === undefined)||($scope.viewdata.login.password === ""))
            {            
                ShowModalMsg('Oops!', 'Por favor ingrese su contraseña.', 'Ok');
                return;
            }

            loadingBox.show();

            userFactory.session.signup({email:$scope.viewdata.signup.email, password:$scope.viewdata.signup.password})
            .then(function(data){            
                // Sets the flags indicating the user has already logged.
                localStorage.setItem('animationShown', false);
                referenceIDFactory.setReferenceID(data.ReferenceID);
                
                if (!devEnvironment) cordova.plugins.Keyboard.disableScroll(false);
                loadingBox.hide();
                $ionicHistory.clearHistory();
                $ionicHistory.clearCache();
                $ionicHistory.nextViewOptions({
                    disableAnimate: true,
                    disableBack: true,
                    historyRoot: true
                });
                $state.go('profilepicgenderdob');
            })
            .catch(function(err){
                loadingBox.hide();
                // console.log(err);
                ShowModalMsg("Oops!", "Ocurrió un error .", "Ok");
            });
        };

        function ShowModalMsg(title, message, buttontext) {
            if (!devEnvironment) $cordovaKeyboard.close();

            swal(
                {   
                    title: title,   
                    text: message,   
                    type: "warning",   
                    showConfirmButton: true,
                    showCancelButton: false,                       
                    confirmButtonText: buttontext,   
                    closeOnConfirm: true 
                }, 
                function(){   
                    
                }
            );

            // $scope.viewdata.msgbox.title = title;
            // $scope.viewdata.msgbox.message = message;
            // $scope.viewdata.msgbox.buttontext = buttontext;

            // var modal = document.querySelector('#modal-msgbox-login'),
            //     close = modal.querySelector( '.md-close' );
            // var overlay = document.querySelector( '.md-overlay' );
            // classie.add( modal, 'md-show' );
            // close.addEventListener( 'click', function( ev ) {
            //     ev.stopPropagation();
            //     classie.remove( document.querySelector('#modal-msgbox-login'), 'md-show' );
            // });
        };
    }]);

    ctrl.controller('SignUpCtrl', ['$scope', '$cordovaKeyboard', 'loginSignUpFactory', 'userFactory', '$ionicLoading', 'referenceIDFactory', '$cordovaPush', 'deviceFactory', '$ionicHistory', '$state', 'loadingBox', function($scope, $cordovaKeyboard, loginSignUpFactory, userFactory, $ionicLoading, referenceIDFactory, $cordovaPush, deviceFactory, $ionicHistory, $state, loadingBox) {
        if (!devEnvironment) cordova.plugins.Keyboard.disableScroll(true);

        $scope.passwordCheckbox = false;
        $scope.inputType = "password";

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

        $scope.$on('$ionicView.beforeEnter', function(event, args){              
            $("#signup-password").hide();
            $("#signup-password").removeClass('animated fadeIn');
        });

        $scope.$on('$ionicView.afterEnter', function(event, args){ 
            $("#signup-password").addClass('animated fadeIn');
            $("#signup-password").show();
        });

        $scope.DoSignUp = function() {
            if (!devEnvironment) $cordovaKeyboard.close();

            // Validates the information from the form
            if (($scope.viewdata.signup.password === undefined)||($scope.viewdata.signup.password === ""))
            {
                $scope.viewdata.signup.password_invalid = true;
                ShowModalMsg('Oops!', 'Por favor ingrese su contraseña.', 'Ok');
                return;
            }
            else
            {
                $scope.viewdata.signup.password_invalid = false;
            }
            if (($scope.viewdata.signup.password_confirm === undefined)||($scope.viewdata.signup.password_confirm === ""))
            {
                $scope.viewdata.signup.password_confirm_invalid = true;
                ShowModalMsg('Oops!', 'Por favor confirme su contraseña.', 'Ok');
                return;
            }
            else
            {
                $scope.viewdata.signup.password_invalid = false;
            }

            if ($scope.viewdata.signup.password_confirm != $scope.viewdata.signup.password)
            {
                ShowModalMsg('Oops!', 'Sus contraseñas no coinciden.', 'Ok');
                return;
            }

            loadingBox.show('Creando su cuenta...');

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

                        loadingBox.hide();
                                                
                        $ionicHistory.clearHistory();
                        $ionicHistory.clearCache();
                        $ionicHistory.nextViewOptions({
                            // disableAnimate: true,
                            disableBack: true,
                            historyRoot: true
                        });
                        
                        $state.go('profilepicgenderdob');                       
                    }
                    else
                    {
                        ShowModalMsg("Oops!" ,"No se pudo terminar el registro, por favor inténtelo de nuevo", "Ok");
                    }
                })
                .catch(function(err){
                    loadingBox.hide();

                    // console.log("Error!");
                    // console.log(err);

                    if (err == null) {
                        ShowModalMsg("Oops!", "Ocurrió un problema, inténtelo de nuevo.", "Ok");
                        return;
                    }

                    if (err.data != undefined)
                    {
                        if (err.data.responseCode == "MO0011") 
                        {                        
                            ShowModalMsg("Oops!", err.data.message, "Ok");
                        }
                        else
                        {
                            if (err.data.responseCode == "EV0000") {
                                ShowModalMsg("Oops!", "Contraseña tiene un formato inválido, por favor revísela e intente de nuevo.", "Ok");    
                            }
                            else {
                                ShowModalMsg("Oops!", "No se pudo terminar el registro.", "Ok");
                            }
                        }
                    } 
                    else
                    {
                        ShowModalMsg("Oops!", "Ocurrió un error, por favor inténtelo de nuevo.", "Ok");
                    }               
                });
        };

        function ShowModalMsg(title, message, buttontext) {
            if (!devEnvironment) $cordovaKeyboard.close();

            swal(
                {   
                    title: title,   
                    text: message,   
                    type: "warning",   
                    showConfirmButton: true,
                    showCancelButton: false,                       
                    confirmButtonText: buttontext,   
                    closeOnConfirm: true 
                }, 
                function(){   
                    
                }
            );

            // $(".md-overlay").removeClass("md-overlay-ok");
            // $(".md-content").removeClass("md-content-ok");
            // $scope.viewdata.msgbox.title = title;
            // $scope.viewdata.msgbox.message = message;
            // $scope.viewdata.msgbox.buttontext = buttontext;

            // var modal = document.querySelector('#modal-msgbox-signup'),
            //     close = modal.querySelector( '.md-close' );
            // var overlay = document.querySelector( '.md-overlay' );
            // classie.add( modal, 'md-show' );
            // close.addEventListener( 'click', function( ev ) {
            //     ev.stopPropagation();
            //     classie.remove( document.querySelector('#modal-msgbox-signup'), 'md-show' );
            // });
        };

        function ShowModalMsg_Ok(title, message, buttontext) {
            if (!devEnvironment) $cordovaKeyboard.close();

            swal(
                {   
                    title: title,   
                    text: message,   
                    type: "success",   
                    showConfirmButton: true,
                    showCancelButton: false,                       
                    confirmButtonText: buttontext,   
                    closeOnConfirm: true 
                }, 
                function(){   
                    
                }
            );

            // $scope.viewdata.msgbox.title = title;
            // $scope.viewdata.msgbox.message = message;
            // $scope.viewdata.msgbox.buttontext = buttontext;

            // var modal = document.querySelector('#modal-msgbox-signup-ok'),
            //     close = modal.querySelector( '.md-close' );
            // var overlay = document.querySelector( '.md-overlay' );
            // classie.add( modal, 'md-show' );
        };

        function CloseModalMsg_Ok() {
            classie.remove( document.querySelector('#modal-msgbox-signup'), 'md-show' );
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

        $scope.hideShowPassword = function() {
            if ($scope.inputType == 'password')
                $scope.inputType = 'text';
            else
                $scope.inputType = 'password';
        };
    }]);

    ctrl.controller('WelcomeCoverCtrl', ['$scope', '$timeout', '$state', '$ionicSlideBoxDelegate', 'userFactory', 'referenceIDFactory', '$ionicLoading', '$cordovaKeyboard', '$cordovaPush', 'deviceFactory', '$cordovaBarcodeScanner', 'signUpLoginView', 'loginSignUpFactory', 'loadingBox', function($scope, $timeout, $state, $ionicSlideBoxDelegate, userFactory, referenceIDFactory, $ionicLoading, $cordovaKeyboard, $cordovaPush, deviceFactory, $cordovaBarcodeScanner, signUpLoginView, loginSignUpFactory, loadingBox){
        localStorage.setItem('animationShown', false);

        $scope.GoToLogin = function() {
            $state.go("welcome");
        };

        $timeout(function(){
            $("#welcome-content").addClass("animated fadeIn");
            setTimeout(function(){
                $("#welcomeimg1").addClass("animated zoomIn");
                loadingBox.hide();
            }, 1100);        
        });
    }]);

    ctrl.controller('WelcomeCtrl', ['$scope', '$timeout', '$state', '$ionicSlideBoxDelegate', 'userFactory', 'referenceIDFactory', '$ionicLoading', '$cordovaKeyboard', '$cordovaPush', 'deviceFactory', '$cordovaBarcodeScanner', 'signUpLoginView', 'loginSignUpFactory', 'loadingBox', function($scope, $timeout, $state, $ionicSlideBoxDelegate, userFactory, referenceIDFactory, $ionicLoading, $cordovaKeyboard, $cordovaPush, deviceFactory, $cordovaBarcodeScanner, signUpLoginView, loginSignUpFactory, loadingBox){
        localStorage.setItem('animationShown', false);

        if (!devEnvironment) cordova.plugins.Keyboard.disableScroll(true);

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

        $scope.$on('$ionicView.beforeEnter', function(event, args){            
            $("#welcomeemail-content").hide();
            $("#welcomeemail-content").removeClass('animated fadeIn');
        });

        $scope.$on('$ionicView.afterEnter', function(event, args){ 
            $("#welcomeemail-content").addClass('animated fadeIn');
            $("#welcomeemail-content").show();
        });

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
                ShowModalMsg('Oops!', 'Por favor digitar un correo válido.', 'Ok');
                return;
            }
            else
            {
                $scope.viewdata.login.email_invalid = false;
            }

            loadingBox.show('Validando su correo...');

            userFactory.datavalidation.emailvalidation($scope.viewdata.login.email)
                .then(function(response){
                    if (response.status)
                    {
                        loginSignUpFactory.login.email.set($scope.viewdata.login.email);

                        // Sets the Signup Status for future use
                        userFactory.info.signupstatus.set(response.data.responseCode);

                        // Email already exists and user is also created
                        if (response.data.responseCode == 1)
                        {
                            loadingBox.hide();
                            $state.go("login");
                        }

                        // Email does not exists
                        if (response.data.responseCode == 0)
                        {
                            loadingBox.hide();
                            $state.go("signup");
                        }

                        // Email exists but the user hasn't been created
                        if (response.data.responseCode == -1)
                        {
                            loadingBox.hide();
                            $state.go("signup");
                        }
                    }
                    else
                    {
                        loadingBox.hide();
                        ShowModalMsg('Oops!', "No pudimos verificar su correo, por favor inténtelo de nuevo.", "Ok");
                    }
                })
                .catch(function(err){
                    loadingBox.hide();
                    ShowModalMsg('Oops!', "No pudimos verificar su correo, por favor inténtelo de nuevo.", "Ok");
                }); 
        };

        $scope.SignUp = function() {
            // Validates the information from the form
            if ($scope.viewdata.signup.email === "")
            {
                $scope.viewdata.signup.email_invalid = true;
                ShowFormErrorMsg("¡Por favor ingrese su correo!");
                return;
            }
            else
            {
                $scope.viewdata.signup.email_invalid = false;
            }
            if ($scope.viewdata.signup.password === "")
            {
                $scope.viewdata.signup.password_invalid = true;
                ShowFormErrorMsg("¡Por favor ingrese su password!");
                return;
            }
            else
            {
                $scope.viewdata.signup.password_invalid = false;
            }

            loadingBox.show();

            userFactory.session.signup({email:$scope.viewdata.signup.email, password:$scope.viewdata.signup.password})
                .then(function(data){
                    if ((data.status == true)||(data.status == "true"))
                    {
                        // Sets the flags indicating the user has already logged.
                        localStorage.setItem('animationShown', false);

                        referenceIDFactory.setReferenceID(data.data.response.ReferenceID); 
                        if (!devEnvironment) cordova.plugins.Keyboard.disableScroll(false);
                        loadingBox.hide();
                        ShowFormMsg('Listo!', 'Ya quedó registrado.');
                        $state.go('tab.qrcode');   
                    }
                    else
                    {
                        ShowFormErrorMsg("Oops!, no se pudo terminar el registro.");
                    }
                })
                .catch(function(err){
                    loadingBox.hide();

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

            swal(
                {   
                    title: title,   
                    text: message,   
                    type: "warning",   
                    showConfirmButton: true,
                    showCancelButton: false,                       
                    confirmButtonText: buttontext,   
                    closeOnConfirm: true 
                }, 
                function(){   
                    
                }
            );
        };

        function CloseModalMsg_Ok() {
            classie.remove( document.querySelector('#modal-welcomev-msgbox'), 'md-show' );
        };

        // ***********************************

        $scope.nextSlide = function() {
            $cordovaKeyboard.close();
            $ionicSlideBoxDelegate.next();
        };

        $scope.gotoSlide = function(index) {
            $cordovaKeyboard.close();
            $ionicSlideBoxDelegate.slide(parseInt(index));
        };

        $scope.slideHasChanged = function(index) {
            if (!devEnvironment) $cordovaKeyboard.close();
            _currentSlideIndex = parseInt(index);
        };

        $timeout(function(){
            loadingBox.hide();
        });
    }]);

    ctrl.controller('ProfilePicGenderDoBCtrl', ['$scope', '$timeout', 'loadingBox', 'userFactory', 'commerceFactory', '$state', '$ionicLoading', 'setupView', 'emailService', 'navigationFactory', '$cordovaActionSheet', '$cordovaCamera', '$cordovaImagePicker', '$cordovaFile', '$ionicHistory', 'imageFunctions', '$cordovaKeyboard', 'deviceFactory', 'signupSetupFactory', function($scope, $timeout, loadingBox, userFactory, commerceFactory, $state, $ionicLoading, setupView, emailService, navigationFactory, $cordovaActionSheet, $cordovaCamera, $cordovaImagePicker, $cordovaFile, $ionicHistory, imageFunctions, $cordovaKeyboard, deviceFactory, signupSetupFactory){
        localStorage.removeItem('profile_picture');
        localStorage.removeItem('profile_gender');
        $scope.viewdata = {
            imageHasChange: false,
            profileimage: '',
            profilegender: 'H',
            msgbox: {
                title: "",
                message: "",
                buttontext: ""
            },
            defaultAvatarImg_male: 'img/default.png',
            defaultAvatarImg_female: 'img/default_female.png'
        };

        function LoadUserData() {
            loadingBox.show();
            userFactory.info.get()
                .then(function(data){
                    loadingBox.hide();
                    // console.log("Avatar: ", data.Avatar);
                    if (data.Avatar != null)
                    {
                        $scope.viewdata.profileimage = data.Avatar;
                    }
                })
                .catch(function(err){
                    loadingBox.hide();
                    // console.log(err);
                    $scope.viewdata.profilegender = "M";
                });
        };

        $scope.$watch('viewdata.profilegender', function() {
            if ($scope.viewdata.profilegender == "M" && $scope.viewdata.imageHasChange === false)
            {
                $scope.viewdata.profileimage =  $scope.viewdata.defaultAvatarImg_female;
            }
            if ($scope.viewdata.profilegender == "H" && $scope.viewdata.imageHasChange === false)
            {
                $scope.viewdata.profileimage =  $scope.viewdata.defaultAvatarImg_male;
            }
        });

        LoadUserData()

        $scope.Skip = function() {
            localStorage.removeItem('profile_picture');
            localStorage.removeItem('profile_gender');
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
            $ionicHistory.nextViewOptions({
                // disableAnimate: true,
                disableBack: true,
                historyRoot: true
            });

            if (deviceFactory.device.platform() == "iOS")
            {
                $state.go("locationsetup");
            }
            else
            {   
                signupSetupFactory.location.set(true);
                signupSetupFactory.pushNotifications.set(true);                                             
                $state.go("tab.nearme");
            }
        };

        $scope.SaveAndContinue = function() {
            if ($scope.viewdata.profilegender == '') 
            {
                ShowModalMsg('Oops!', 'Seleccione su género.', 'Ok');
                return;
            }

            loadingBox.show('Actualizando su perfil...');

            localStorage.setItem('profile_picture', $scope.viewdata.profileimage);
            localStorage.setItem('profile_gender', $scope.viewdata.profilegender);

            imageFunctions.ConvertImgToBase64URL($scope.viewdata.profileimage, function(imagedata) {
                userFactory.info.updateAvatar(imagedata)
                    .then(function(response){
                        if ((response.status == 'true')||(response.status == true))
                        {                            
                            userFactory.info.get()
                                .then(function(data){                                    
                                    var updateData = {
                                        FirstName: data.FirstName,
                                        LastName: data.LastName,
                                        UpdatePassword: data.UpdatePassword,
                                        Password: data.Password,
                                        AvatarMobile: "http://201.201.150.159/avatar/" + response.data
                                    }
                                    userFactory.info.update(updateData)
                                        .then(function(updateResponse){
                                            localStorage.setItem('profile_picture_urlfilename', response.data);
                                            $ionicHistory.clearHistory();
                                            $ionicHistory.clearCache();
                                            $ionicHistory.nextViewOptions({                                                
                                                disableBack: true,
                                                historyRoot: true
                                            });
                                            loadingBox.hide();

                                            if (deviceFactory.device.platform() == "iOS")
                                            {
                                                $state.go("locationsetup");
                                            }
                                            else
                                            {   
                                                signupSetupFactory.location.set(true);
                                                signupSetupFactory.pushNotifications.set(true);                                             
                                                $state.go("tab.nearme");
                                            }
                                        })
                                        .catch(function(err){
                                            loadingBox.hide();
                                            ShowModalMsg('Oops!', 'No se pudo guardar su foto de perfil.', 'Ok');
                                        });
                                })
                                .catch(function(err){
                                    loadingBox.hide();
                                    ShowModalMsg('Oops!', 'No se pudo guardar su foto de perfil.', 'Ok');
                                });
                        }
                        else
                        {
                            loadingBox.hide();
                            ShowModalMsg('Oops!', 'No se pudo guardar su foto de perfil.', 'Ok');
                        }
                    })
                    .catch(function(err){
                        loadingBox.hide();
                        ShowModalMsg('Oops!', 'No se pudo guardar su foto de perfil.', 'Ok');
                    });
            });
        };

        function ShowModalMsg(title, message, buttontext) {
            if (!devEnvironment) $cordovaKeyboard.close();
            $scope.viewdata.msgbox.title = title;
            $scope.viewdata.msgbox.message = message;
            $scope.viewdata.msgbox.buttontext = buttontext;

            var modal = document.querySelector('#modal-msgbox-sugdob'),
                close = modal.querySelector( '.md-close' );
            var overlay = document.querySelector( '.md-overlay' );
            classie.add( modal, 'md-show' );
            close.addEventListener( 'click', function( ev ) {
                ev.stopPropagation();
                classie.remove( document.querySelector('#modal-msgbox-sugdob'), 'md-show' );
            });
        };

        // Picture Methods

        $scope.ChangeProfilePic = function() {
            var actionsheetoptions = {
                buttonLabels: ['Escogerla...', 'Tomar Foto'],
                addCancelButtonWithLabel: 'Cancel',
                androidEnableCancelButton : true,
                winphoneEnableCancelButton : true
            };

            $cordovaActionSheet.show(actionsheetoptions)
                .then(function(btnIndex) {
                    var index = btnIndex;
                    if (index == 1) PickImage();
                    if (index == 2) TakePicture();
                });
        };

        function makeid() {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i=0; i < 5; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            return text;
        };

        function onCopySuccess(entry) {
            $scope.$apply(function () {
                $scope.viewdata.imageHasChange = true;
                $scope.viewdata.profileimage = entry.nativeURL;
            });
        }

        function copyFile(fileEntry) {
            var name = fileEntry.fullPath.substr(fileEntry.fullPath.lastIndexOf('/') + 1);
            var newName = makeid() + name;

            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, 
                function(fileSystem2) {
                    fileEntry.copyTo(fileSystem2, newName, onCopySuccess, fail);
                },
                fail
            );
        };

        function fail(err) {
            alert(JSON.stringify(err));
        };

        function SavePicture(picturedata) {
            window.resolveLocalFileSystemURL(picturedata, copyFile, fail);
        };

        function TakePicture() {
            var options = {
                quality: 50,
                destinationType: Camera.DestinationType.FILE_URI, // Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.CAMERA,
                allowEdit: true,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 100,
                targetHeight: 100,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: false,
                cameraDirection: 1,
                correctOrientation: true
            };

            $cordovaCamera.getPicture(options).then(function(imageData) {
                SavePicture(imageData);
            }, function(err) {
                // error
            });
        };

        function PickImage() {
            var options = {
                quality: 50,
                destinationType: Camera.DestinationType.FILE_URI,
                sourceType: Camera.PictureSourceType.PHOTOLIBRARY,
                allowEdit: true,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 100,
                targetHeight: 100,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: false,
                cameraDirection: 1,
                correctOrientation: true
            };

            $cordovaCamera.getPicture(options).then(function(imageData) {
                SavePicture(imageData);
            }, function(err) {
                // error
            });
        };
    }]);

    ctrl.controller('LocationSetupCtrl', ['$scope', '$ionicHistory', '$cordovaGeolocation', '$state', '$ionicLoading', 'locationFactory', 'loadingBox', '$cordovaKeyboard', 'deviceFactory', 'signupSetupFactory', function($scope, $ionicHistory, $cordovaGeolocation, $state, $ionicLoading, locationFactory, loadingBox, $cordovaKeyboard, deviceFactory, signupSetupFactory){
        $scope.$on('$ionicView.beforeEnter', function(event, args){              
            $("#locationsetup-content").hide();
            $("#locationsetup-content").removeClass('animated fadeIn');
        });

        $scope.$on('$ionicView.afterEnter', function(event, args){ 
            $("#locationsetup-content").addClass('animated fadeIn');
            $("#locationsetup-content").show();
        });

        $scope.Skip = function() {
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
            $ionicHistory.nextViewOptions({
                // disableAnimate: true,
                disableBack: true,
                historyRoot: true
            });

            signupSetupFactory.location.set(false);

            loadingBox.hide();
            $state.go('pushnotificationssetup');
        };

        function GoToNextPage() {
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
            $ionicHistory.nextViewOptions({
                // disableAnimate: true,
                disableBack: true,
                historyRoot: true
            });

            loadingBox.hide();
            signupSetupFactory.location.set(true);
            $state.go('pushnotificationssetup');        
        };

        $scope.GetLocation = function() {
            // Gets the User's location                
            var posOptions = {timeout: 10000, enableHighAccuracy: false};

            loadingBox.show('Buscando su ubicación...');

            $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(function (position) {
                    var _lat  = position.coords.latitude;
                    var _long = position.coords.longitude;
                    locationFactory.location.set(_lat, _long);

                    ShowModalMsgOk("", "Tiene activados los servicios de ubicación.", "Ok")
                        .then(function(){                            
                            GoToNextPage();
                        });
                })
                .catch(function(err){
                    loadingBox.hide();
                    ShowModalMsg("", "No tiene activados los servicios de ubicación. Si los activa Kenuu podrá ofrecerle mejor contenido.", "Ok")
                        .then(function(){                            
                            GoToNextPage();
                        });                    
                });
        };

        function ShowModalMsg(title, message, buttontext) {
            if (!devEnvironment) $cordovaKeyboard.close();

            return new Promise(function(resolve,reject){
                swal(
                    {   
                        title: title,   
                        text: message,   
                        type: "warning",   
                        showConfirmButton: true,
                        showCancelButton: false,                       
                        confirmButtonText: buttontext,   
                        closeOnConfirm: true 
                    }, 
                    function(){   
                        resolve();      
                    }
                );    
            });
        };

        function ShowModalMsgOk(title, message, buttontext) {
            if (!devEnvironment) $cordovaKeyboard.close();

            return new Promise(function(resolve,reject){
                swal(
                    {   
                        title: title,   
                        text: message,   
                        type: "success",   
                        showConfirmButton: true,
                        showCancelButton: false,                       
                        confirmButtonText: buttontext,   
                        closeOnConfirm: true 
                    }, 
                    function(){   
                        resolve();      
                    }
                );    
            });
        };
    }]);

    ctrl.controller('PushNotificationsSetupCtrl', ['$scope', '$ionicHistory', '$cordovaGeolocation', '$state', '$cordovaPush', '$cordovaDevice', 'loadingBox', 'locationFactory', 'userFactory', 'deviceFactory', 'signupSetupFactory', function($scope, $ionicHistory, $cordovaGeolocation, $state, $cordovaPush, $cordovaDevice, loadingBox, locationFactory, userFactory, deviceFactory, signupSetupFactory){
        
        loadingBox.hide();

        $scope.$on('$ionicView.beforeEnter', function(event, args){              
            $("#pushnotification-content").hide();
            $("#pushnotification-content").removeClass('animated fadeIn');
        });

        $scope.$on('$ionicView.afterEnter', function(event, args){ 
            $("#pushnotification-content").addClass('animated fadeIn');
            $("#pushnotification-content").show();
        });

        $scope.Skip = function() {
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
            $ionicHistory.nextViewOptions({
                // disableAnimate: true,
                disableBack: true,
                historyRoot: true
            });

            signupSetupFactory.pushNotifications.set(false);

            $state.go("tab.nearme");
        };

        $scope.RegisterDevice = function() {

            var iosConfig = {
                "badge": true,
                "sound": true,
                "alert": true,
            };
            var androidConfig = {
                "senderID": "671633506930"
            };

            signupSetupFactory.pushNotifications.set(true);

            var platform = $cordovaDevice.getPlatform();

            if (platform == "iOS")
            {
                $cordovaPush.register(iosConfig)
                    .then(
                        function(deviceToken)
                        {
                            swal(
                                {   
                                    title: "Listo!",   
                                    text: "Comience a disfrutar Kenuu",   
                                    type: "success",   
                                    showConfirmButton: true,
                                    showCancelButton: false,                       
                                    confirmButtonText: "Continuar",   
                                    closeOnConfirm: true 
                                }, 
                                function(){
                                    $ionicHistory.clearHistory();
                                    $ionicHistory.clearCache();
                                    $ionicHistory.nextViewOptions({
                                        // disableAnimate: true,
                                        disableBack: true,
                                        historyRoot: true
                                    });
                                    
                                    $state.go("tab.nearme");      
                                }
                            );
                        },
                        function(err) {
                            swal(
                                {   
                                    title: "Ooops!",   
                                    text: "No se pudo registrar su dispositivo.",   
                                    type: "warning",   
                                    showConfirmButton: true,
                                    showCancelButton: false,                       
                                    confirmButtonText: "Continuar",   
                                    closeOnConfirm: true 
                                }, 
                                function(){
                                    $ionicHistory.clearHistory();
                                    $ionicHistory.clearCache();
                                    $ionicHistory.nextViewOptions({
                                        // disableAnimate: true,
                                        disableBack: true,
                                        historyRoot: true
                                    });
                                    
                                    $state.go("tab.nearme");      
                                }
                            );
                        }
                    );
            }

            if (platform == "Android")
            {
                $cordovaPush.register(androidConfig).then(
                    function(result) {
                        swal(
                            {   
                                title: "Listo!",   
                                text: "Comience a disfrutar Kenuu",   
                                type: "success",   
                                showConfirmButton: true,
                                showCancelButton: false,                       
                                confirmButtonText: "Continuar",   
                                closeOnConfirm: true 
                            }, 
                            function(){  
                                $ionicHistory.clearHistory();
                                $ionicHistory.clearCache();
                                $ionicHistory.nextViewOptions({
                                    // disableAnimate: true,
                                    disableBack: true,
                                    historyRoot: true
                                }); 
                                $state.go("tab.nearme");      
                            }
                        );
                    }, 
                    function(err) {

                    }
                );
            }
        };
    }]);        

// Not Currently Used

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
            loadingBox.show();
            rewardFactory.active.general(true, entityID)
                .then(function(data){
                    $("#pleaseWaitSpinner").addClass("animated slideOutUp");
                    setTimeout(function() {                    
                        $scope.viewdata.rewards = data.Elements;
                        $scope.viewdata.rewards = SetColorForItem($scope.viewdata.rewards);
                        $("#rewardsListContainer").show();                    
                        $scope.$apply();
                        loadingBox.hide();
                        $scope.$broadcast('scroll.refreshComplete');                    
                    }, 150);
                })
                .catch(function(err){                
                    $("#pleaseWaitSpinner").addClass("animated slideOutUp");
                    $scope.$broadcast('scroll.refreshComplete');
                    
                    setTimeout(function() { 
                        $("#errorWhenLoadingDiv").removeClass("animated slideOutUp");
                        setTimeout(function(){
                            loadingBox.hide();
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
                loadingBox.show();
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
                // console.log("Error")
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
                // console.log(err);
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
                    loadingBox.show();
                    
                    setTimeout(function() {
                        loadingBox.hide();
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
                    // console.log("Error when getting the commerce.")
                    // console.log(response);
                })
            
        };

        $scope.OpenStore = function(entityID, SubEntityID) {};

        $scope.OpenReward = function(entityID, SubEntityID, rewardID) {
            $state.go("tab.search-rewarddetail");
        };
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
