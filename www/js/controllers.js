var ctrl = angular.module('kenuu.controllers', ['ja.qr']);

var imageserverurl = "http://dev.cis-solutions.com/kenuu/imgs/";

// Near Me Tab

    ctrl.controller('NearMeCtrl', ['$scope', '$state', '$ionicLoading', '$timeout', '$cordovaPush', '$cordovaGeolocation', 'loadingBox', 'searchFactory', 'commerceFactory', 'navigationFactory', 'deviceFactory', 'userFactory', 'navigationFactory', 'locationFactory', 'storeFactory', function($scope, $state, $ionicLoading, $timeout, $cordovaPush, $cordovaGeolocation, loadingBox, searchFactory, commerceFactory, navigationFactory, deviceFactory, userFactory, navigationFactory, locationFactory, storeFactory){
        $scope.viewdata = {
            startingView: true, // Variable that is used to control de Variable Watch for SearchText
            locationSet: true,
            doingSearch: false,
            searchResults: [],
            searchText: "",
            user: {},
            CardNumber: "",
            storePage: 1,
            kilometers: 10
        };

        $scope.$on("$ionicView.enter", function(event, args){

        });

        // Executed when the view is loaded
        $timeout(function(){
            $scope.viewdata.startingView = true;
            $("#nearme-list").show();
            $("#nearme-list").addClass("animated fadeIn");

            loadingBox.show();

            // Pulls the member information
            userFactory.info.get()
            .then(function(data){
                $scope.viewdata.user = data;
                $scope.viewdata.CardNumber = data.CardNumber;

                if (!devEnvironment)
                {
                    // Gets the User's location
                    var posOptions = {timeout: 10000, enableHighAccuracy: false};
                    var iosConfig = {
                        "badge": true,
                        "sound": true,
                        "alert": true,
                    };
                    var androidConfig = {
                        "senderID": "AIzaSyDNjV6WWsPUXWKNctSYo19MhPpSMwgZKqw",
                    };

                    deviceFactory.device.registeredUser.set(data.Email);

                    if (deviceFactory.device.platform() == "iOS")
                    {
                        $cordovaPush.register(iosConfig).then(
                            function(deviceToken)
                            {
                                deviceFactory.device.registerdevice(deviceToken, data.Email)
                                .then(function(response){
                                    // console.log("Device Register Ok!");
                                    // console.log(response);
                                })
                                .catch(function(err){
                                    // console.log("Device Register Error!");
                                    // console.log(err);
                                });
                            },
                            function(err) {
                                // alert("Error!");
                                // alert(err);
                            }
                        );
                    }

                    if (deviceFactory.device.platform() == "Android")
                    {
                        $cordovaPush.register(androidConfig).then(function(result) {
                            // console.log('IN HERE!!!! ANDROID PUSH!');
                            // console.log(result);
                            // Success
                        }, function(err) {
                            // Error
                        });
                    }

                    $cordovaGeolocation
                        .getCurrentPosition(posOptions)
                        .then(function (position) {
                            $scope.viewdata.locationSet = true;
                            var _lat  = position.coords.latitude;
                            var _long = position.coords.longitude;
                            locationFactory.location.set(_lat, _long);
                            $scope.viewdata.startingView = false;
                            doSearch(false);
                        })
                        .catch(function(err){
                            loadingBox.hide();
                            $scope.viewdata.locationSet = false;
                            $scope.viewdata.startingView = false;

                            doSearch(false);
                        });
                }
                else
                {
                    $scope.viewdata.startingView = false;
                    $scope.viewdata.locationSet = false;
                    doSearch(false);
                }
            })
            .catch(function(err) {
                loadingBox.hide();
                // console.log(err);
            });
        });

        $scope.$on('$cordovaPush:notificationReceived', function(event, notification) {
             // console.log(notification);

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
                // console.log(notification);
                // Android
                switch(notification.event) {
                    case 'registered':
                        if (notification.regid.length > 0 ) {
                            alert('registration ID = ' + notification.regid);

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

        $scope.SearchFocus = function() {
            $("#btnClearSearch").show();            
        };

        $scope.SearchBlur = function() {
            $("#searchText").blur();
            $("#btnClearSearch").hide();
            if (!devEnvironment) $cordovaKeyboard.close(); 
        };

        $scope.ClearSearch = function() {
            if ($scope.viewdata.searchText != '') $scope.viewdata.searchText = "";            
        };

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

        $scope.$watch('viewdata.searchText', function() {
            if ($scope.viewdata.startingView) return;

            if ($scope.viewdata.searchText === "")
            {
                doSearch(false);
            }
            else
            {
                doSearch(true);
            }
        });

        function sortByKey(array, key) {
            return array.sort(function(a, b) {
                var x = a[key]; var y = b[key];
                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
            });
        }

        $scope.getMoreStores = function(pageNum){
            loadingBox.show();
            $scope.viewdata.storePage++;
            var posOptions = {timeout: 10000, enableHighAccuracy: false};
            var _location = locationFactory.location.get();
            var lat  = _location.lat;
            var long = _location.long;
            commerceFactory.stores.nearby(0, long, lat, pageNum, $scope.viewdata.kilometers)
                .then(function(data){
                    for(var i=0;i<data.length;i++){
                        $scope.viewdata.searchResults.push(data[i]);
                    }
                    $scope.$apply();
                    loadingBox.hide();
                });
        };

        $scope.changeKilometers = function(kilometers){
            loadingBox.show();
            $scope.viewdata.kilometers = kilometers;
            $scope.viewdata.storePage = 0;
            var posOptions = {timeout: 10000, enableHighAccuracy: false};
            var _location = locationFactory.location.get();
            if (_location.isSet)
            {
                var lat  = _location.lat;
                var long = _location.long;
                $scope.viewdata.searchResults = [];
                commerceFactory.stores.nearby(0, long, lat, 0, kilometers)
                    .then(function(data){
                        // // console.log('DATA LENGTH!!!!');
                        // // console.log(kilometers,data.length,pageNum);
                        for(var i=0; i<data.length; i++){
                            $scope.viewdata.searchResults.push(data[i]);
                        }
                        // $scope.viewdata.searchResults = data;
                        $scope.$apply();
                        loadingBox.hide();
                    })
                    .catch(function(err){
                        searchFactory.doSearch($scope.viewdata.searchText)
                            .then(function(data){
                                for(var i=0; i<data.response.Elements.length; i++){
                                    $scope.viewdata.searchResults.push(data.response.Elements[i]);
                                }
                                // $scope.viewdata.searchResults = data.response.Elements;
                                $scope.$apply();
                                loadingBox.hide();
                            })
                            .catch(function(data){
                                // console.log(data);
                                loadingBox.hide();
                            });
                    });
            }
            else
            {
                searchFactory.doSearch($scope.viewdata.searchText)
                    .then(function(data){
                        $scope.viewdata.searchResults = data.response.Elements;
                        $scope.viewdata.searchResults = sortByKey($scope.viewdata.searchResults, "Type");
                        loadingBox.hide();
                        $scope.$apply();
                    })
                    .catch(function(data){
                        // console.log("Error while searching commerces without location:")
                        // console.log(data);
                        loadingBox.hide();
                    });
            }
        };

        $scope.formatDistance = function(distance) {
            if (distance == null) return 0;
            if (distance == undefined) return 0;
            if (distance == '') return 0;
            distance = Math.round(distance * 100) / 100;
            return distance;
        };

        $scope.DoSearch = function() {
            doSearch(false);
        };

        $scope.doRefresh = function() {
            doSearch(false);
        };

        // Pulls the commerces
        function doSearch(fromSearch) {
            var posOptions = {timeout: 10000, enableHighAccuracy: false};
            if (!fromSearch) {                
                loadingBox.show();                
                $scope.$broadcast('scroll.refreshComplete');
            }

            var _location = locationFactory.location.get();
            if(!fromSearch){
                if (_location.isSet)
                {
                    $scope.viewdata.locationSet = true;
                    var lat  = _location.lat;
                    var long = _location.long;

                    commerceFactory.stores.nearby(0, long, lat, 0)
                        .then(function(data){                            
                            if (!fromSearch) loadingBox.hide();
                            $scope.viewdata.searchResults = data;                            
                            $scope.$apply();
                        })
                        .catch(function(err){
                            commerceFactory.stores.general(0)
                                .then(function(data){                                    
                                    if (!fromSearch) loadingBox.hide();
                                    $scope.viewdata.searchResults = data; // data.response.Elements;                                    
                                    $scope.$apply();
                                })
                                .catch(function(data){                                    
                                    if (!fromSearch) loadingBox.hide();                                    
                                });
                        });
                }
                else
                {
                    $scope.viewdata.locationSet = false;

                    commerceFactory.stores.general(0)
                        .then(function(response){
                            loadingBox.hide();
                            $scope.viewdata.searchResults = response;                            
                            $scope.$apply();
                        })
                        .catch(function(err){
                            loadingBox.hide();
                            console.log(err)
                        });             
                }
            } else {
                $scope.viewdata.locationSet = false;
                searchFactory.doSearch($scope.viewdata.searchText)
                        .then(function(data){
                            if (!fromSearch) loadingBox.hide();
                            $scope.viewdata.searchResults = data.response.Elements;
                            $scope.viewdata.searchResults = sortByKey($scope.viewdata.searchResults, "Type");
                            $scope.$apply();
                        })
                        .catch(function(data){
                            if (!fromSearch) loadingBox.hide();
                        });
            }
        }
    }]);

    ctrl.controller('CommerceWithRewardsCtrl', ['$scope', '$state', '$stateParams', '$ionicLoading', '$timeout', 'loadingBox', 'commerceFactory', 'rewardFactory', 'deviceFactory', 'rewardDetailModal', 'navigationFactory', '$cordovaSocialSharing', function($scope, $state, $stateParams, $ionicLoading, $timeout, loadingBox, commerceFactory, rewardFactory, deviceFactory, rewardDetailModal, navigationFactory, $cordovaSocialSharing){
        $scope.viewdata = {
            commerce: commerceFactory.selectedCommerce.get(),
            rewards: [],
            imageserverurl: imageserverurl,
            selectedreward: {}
        };

        // console.log($scope.viewdata.commerce)

        $timeout(function(){loadingBox.hide();});

        function LoadData(entityID) {
            // Pulls the rewards for the Commerce      
            rewardFactory.active.general(true, entityID)
                .then(function(data){                
                    loadingBox.hide();
                    $scope.viewdata.rewards = data.Elements;
                })
                .catch(function(err){
                    loadingBox.hide();
                    // console.log(err);
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
                // console.log("Error")
            })
        }
        else
        {
            LoadData($scope.viewdata.commerce.EntityID);
        }

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
                var _date = commerce.LastVisit.substr(0,10);
                var _dateFormated = new Date(_date.substr(0,10));
                return _dateFormated.getDate() + " " + (GetMonthName(_dateFormated.getMonth()+1)) + " " + _dateFormated.getFullYear();
            }
            if (commerce.LastVisitDateEntity != undefined) 
            {
                var _date = commerce.LastVisitDateEntity.substr(0,10);
                var _dateFormated = new Date(_date.substr(0,10));
                return _dateFormated.getDate() + " " + (GetMonthName(_dateFormated.getMonth()+1)) + " " + _dateFormated.getFullYear();
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
            if (img == null) return "img/defaultgift.png";
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

        $scope.OpenMaps = function(lat, long) {
            var url = "";
            if (deviceFactory.device.platform == "iOS")
            {
                url = "maps://maps.apple.com/?q=" + lat + "," + long;
            }
            else
            {
                url = "maps://maps.google.com/?q=" + lat + "," + long;;
            }

            url = "waze://?ll=" + lat + "," + long + "&navigate=yes"
            
            window.open(url, "_system");
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

        // $scope.GetRewardImage = function(reward) {
        //     var img = $scope.viewdata.imageserverurl + reward.Image;        
        //     return {background:img};
        // };

        $scope.GetAvailablePoints = function(availablepoints) {
            if (availablepoints == null) return 0;
            return availablepoints;
        };

        $scope.ShareViaTwitter = function(commerce) {
            var message = commerce.Name;
            $cordovaSocialSharing
                .shareViaTwitter(message)
                .then(function(result) {
                    // Success!
                }, function(err) {
                    // An error occurred. Show a message to the user
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
    }]);

    ctrl.controller('MapCtrl', ['$scope', 'commerceFactory', '$ionicLoading', '$cordovaGeolocation', '$stateParams', '$compile', 'loadingBox', 'locationFactory', 'storeFactory', 'navigationFactory', '$state', function($scope, commerceFactory, $ionicLoading, $cordovaGeolocation, $stateParams, $compile, loadingBox, locationFactory, storeFactory, navigationFactory, $state){
        $scope.settings = {
            enableFriends: true
        };

        $scope.$on("$ionicView.enter", function(event, args){        
        });

        $scope.viewdata = {
            stores: []
        };

        var _map = false;
        var _locationMarkerCreated = false;
        var longitude = '';
        var latitude = '';

        $scope.GoToCommerce = function() {        
        };

        $scope.centerOnMe = function() {
            if (!_map) return;
            var posOptions = {timeout: 100000, enableHighAccuracy: false};
            loadingBox.show();
            $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(
                    function (position) 
                    {
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
                        loadingBox.hide();
                    },
                    function(err) 
                    {
                        loadingBox.hide();
                        alert("No tienes location services!");
                    }
                );
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

        $scope.mapCreated = function(map) {
            loadingBox.show();

            // Sets the map into a local variable.
            _map = map;
            var posOptions = {timeout: 10000, enableHighAccuracy: false};
            $cordovaGeolocation
                .getCurrentPosition(posOptions)
                .then(function (position) {
                    var lat = position.coords.latitude;
                    var lon = position.coords.longitude;
                    
                    // Pulls stores near the user's location
                    commerceFactory.stores.nearby(0,lon,lat,0)
                        .then(function(data){
                            loadingBox.hide();
                            
                            var infoWindow = new google.maps.InfoWindow();
                            var j=data.length;
                            
                            $scope.viewdata.stores = data;
                            console.log(data);

                            for (var i=0;i<j;i++){                                
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
                                        infoWindow.open(map, marker);
                                    };
                                })(marker));
                            }
                        })
                        .catch(function(err){
                            loadingBox.hide();

                            // Pulls all the stores without location
                            commerceFactory.stores.general(0,0).
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
                                            map: map,
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
                                                infoWindow.open(map, marker);
                                            };
                                        })(marker));
                                    }

                                    $scope.centerOnMe();                                
                                })
                                .catch(function(err){
                                    loadingBox.hide();
                                    // console.log(err);                                
                                });
                        });
                },function(err){});
        
                    commerceFactory.stores.general(0,0).
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
                                    map: map,
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
                                        infoWindow.open(map, marker);
                                    };
                                })(marker));
                            }

                            $scope.centerOnMe();
                        })
                        .catch(function(err){
                            loadingBox.hide();
                            // console.log(err);                        
                        });
        };
    }]);

    ctrl.controller('CommerceWithRewardsStoresCtrl', ['$scope', '$state', '$ionicLoading', 'loadingBox', 'commerceFactory', 'storeFactory', 'navigationFactory', function($scope, $state, $ionicLoading, loadingBox, commerceFactory, storeFactory, navigationFactory){
        $scope.viewdata = {
            commerce: commerceFactory.selectedCommerce.get(),
            stores: [],
            searchtext: ""
        };

        loadingBox.show();
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

        $scope.GoToAddress = function(lat, long) {
            url = "waze://?ll=" + lat + "," + long + "&navigate=yes";        
            window.open(url, "_system");
        };

        $scope.ClearSearch = function() {
            $scope.viewdata.searchtext = "";
        };

        $scope.OpenStore = function(store) {
            storeFactory.selectedStore.set(store);
            var _state = navigationFactory.store.get();
            $state.go(_state);
        };
    }]);

    ctrl.controller('StoreDetailCtrl', ['$scope', '$timeout', '$state', '$stateParams', 'storeFactory', 'loadingBox', 'commerceFactory', 'rewardFactory', 'navigationFactory', 'deviceFactory', function($scope, $timeout, $state, $stateParams, storeFactory, loadingBox, commerceFactory, rewardFactory, navigationFactory, deviceFactory){
        
        loadingBox.show();
        $scope.viewdata = {
            store: storeFactory.selectedStore.get()
        };      

        $timeout(function(){
            loadingBox.hide();
            // LoadData($scope.viewdata.store.subEntityID);
        });

        $scope.OpenMaps = function(lat, long) {
            var url = "";
            if (deviceFactory.device.platform == "iOS")
            {
                url = "maps://maps.apple.com/?q=" + lat + "," + long;
            }
            else
            {
                url = "maps://maps.google.com/?q=" + lat + "," + long;;
            }

            url = "waze://?ll=" + lat + "," + long + "&navigate=yes"
            
            window.open(url, "_system");
        };

        $scope.OpenCommerce = function(entityID) {
            commerceFactory.get(entityID)
                .then(function(response){
                    commerceFactory.selectedCommerce.set(response[0]);
                    var _state = navigationFactory.commerce.get();                    
                    $state.go(_state);
                })
                .catch(function(response){
                    // console.log("Error when getting the commerce.")
                    // console.log(response);
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
                var _date = commerce.LastVisit.substr(0,10);
                var _dateFormated = new Date(_date.substr(0,10));
                return _dateFormated.getDate() + " " + (GetMonthName(_dateFormated.getMonth()+1)) + " " + _dateFormated.getFullYear();
            }
            if (commerce.LastVisitDateEntity != undefined) 
            {
                var _date = commerce.LastVisitDateEntity.substr(0,10);
                var _dateFormated = new Date(_date.substr(0,10));
                return _dateFormated.getDate() + " " + (GetMonthName(_dateFormated.getMonth()+1)) + " " + _dateFormated.getFullYear();
            }
            return "N/A";
        };

        function LoadData(subEntityID) {
            // Pulls the rewards for the Commerce      
            rewardFactory.active.general(true, subEntityID)
                .then(function(data){                
                    loadingBox.hide();
                    $scope.viewdata.rewards = data.Elements;
                })
                .catch(function(err){
                    loadingBox.hide();
                    // console.log(err);
                });
        };
    }]);

// QR Tab

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

// My Kenuu

    ctrl.controller('KenuuCtrl', ['$scope', '$timeout', 'loadingBox', 'userFactory', 'commerceFactory', '$state', '$ionicLoading', 'setupView', 'emailService', 'navigationFactory', '$cordovaActionSheet', '$cordovaCamera', '$cordovaImagePicker', '$cordovaFile', 'imageFunctions', 'appVersionFactory', function($scope, $timeout, loadingBox, userFactory, commerceFactory, $state, $ionicLoading, setupView, emailService, navigationFactory, $cordovaActionSheet, $cordovaCamera, $cordovaImagePicker, $cordovaFile, imageFunctions, appVersionFactory){
        $scope.$on("$ionicView.enter", function(event, args){
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
            appVersion: ''
        };

        $scope.gDate = function(date) {
            var _date = new Date(parseInt(date.substr(6)));
            // console.log(_date);
            return _date.getDate() + "/" + (_date.getMonth()+1) + "/" + _date.getFullYear();
        };

        loadingBox.show();

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
                    loadingBox.hide();              
                    $scope.viewdata.user = data;

                    // TODO: pending to implement the pull image from the profile that comes from the service
                    $scope.profileimage = localStorage.getItem('profile_picture');
                    if ($scope.profileimage == undefined) $scope.profileimage = '';

                    $scope.viewdata.user.Avatar = $scope.profileimage;

                    // Sets the Avatar Image when there is no image defined
                    var _gender = localStorage.getItem('profile_gender');
                    $scope.viewdata["gender"] = _gender;
                    if ($scope.viewdata.user.Avatar == '')
                    {
                        if (_gender != undefined) {  
                            if (_gender == "M") {
                                $scope.viewdata.user.Avatar = $scope.viewdata.defaultAvatarImg_female;
                            }
                            else {
                                $scope.viewdata.user.Avatar = $scope.viewdata.defaultAvatarImg_male;
                            }
                        }
                        else {
                            $scope.viewdata.user.Avatar = $scope.viewdata.defaultAvatarImg_female;   
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
            loadingBox.show();
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
            loadingBox.show();        
            userFactory.activity.visits.commerce()
            .then(function(data){
                setTimeout(function() { 
                    console.log(data.VisitedCommerces);
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
            });;    
        };

        $scope.GoToCommerce = function(commerce) {
            // console.log(commerce);
            commerceFactory.selectedCommerce.set(commerce);
            navigationFactory.commerce.setTab("tab.kenuu-commerce");
            navigationFactory.stores.setTab("tab.kenuu-commercestores");
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
                quality: 50,
                destinationType: Camera.DestinationType.FILE_URI, // Camera.DestinationType.DATA_URL,
                sourceType: Camera.PictureSourceType.CAMERA,
                allowEdit: true,
                encodingType: Camera.EncodingType.JPEG,
                targetWidth: 100,
                targetHeight: 100,
                popoverOptions: CameraPopoverOptions,
                saveToPhotoAlbum: false,
                cameraDirection: 1
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

        // Required to Show the Top Bar Setup View
        $scope.ShowSetupView = function() {setupView.Show($scope);};
        $scope.CloseSetup = function() {setupView.Close($scope);};
        $scope.ContactUs = function() {emailService.ContactCustomerService();}
    }]);

    ctrl.controller('ActivityCtrl', ['$scope', '$state', 'userFactory', 'socialSharing', 'loadingBox', 'commerceFactory', 'navigationFactory', function($scope, $state, userFactory, socialSharing, loadingBox, commerceFactory, navigationFactory){
        
        $scope.viewdata = {
            user: {
                activity: []            
            },
            commerces: [],
            searchtext: ''
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
                    // console.log(err)               
                });
        };

        $scope.GetCommerceImage = function(image) {
            if (image == null) return '';
            if (image == undefined) return '';
            if (image == '') return '';
            
            return imageserverurl + image;
        };

        function LoadData_Activity(userID) {
            loadingBox.show();
            userFactory.activity.all(userID)
                .then(function(data){     
                    // console.log("Activity:");
                    // console.log(data)

                    setTimeout(function() {
                        $scope.viewdata.user.activity = data.Elements;
                        $scope.$apply();

                        loadingBox.hide();
                        $("#activityListDiv").show();
                        $("#activityListDiv").addClass("animated fadeIn");
                    }, 150);            
                })
                .catch(function(err){ 
                    // console.log(err);           
                    setTimeout(function() { 
                        // $("#errorWhenLoadingDiv").removeClass("animated slideOutUp");
                        setTimeout(function(){
                            loadingBox.hide();
                            // $("#errorWhenLoadingDiv").show();                    
                            // $("#errorWhenLoadingDiv").addClass("animated slideInDown");    
                        }, 150);                    
                    }, 220);
                });
        };

        $scope.Reload = function() {
            $("#errorWhenLoadingDiv").addClass("animated slideOutUp");
            setTimeout(function(){
                // $("#pleaseWaitSpinner").removeClass("slideOutUp");
                // $("#pleaseWaitSpinner").addClass("animated slideInDown");
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
            var _dateFormated = new Date(date.substr(0,10));
            return _dateFormated.getDate() + " " + (GetMonthName(_dateFormated.getMonth()+1)) + " " + _dateFormated.getFullYear() + " " + date.substr(11,5);;
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

        $scope.OpenCommerce = function(entityID) {
            loadingBox.show();
            commerceFactory.get(entityID)
                .then(function(response){                
                    commerceFactory.selectedCommerce.set(response[0]);
                    navigationFactory.commerce.setTab("tab.kenuu-commerce");
                    navigationFactory.stores.setTab("tab.kenuu-commercestores");
                    loadingBox.hide();
                    $state.go(navigationFactory.commerce.get());
                })
                .catch(function(response){
                    loadingBox.hide();
                    // console.log("Error when getting the commerce.")
                    // console.log(response);
                });        
        };

        $scope.search = function(item) {
            if (item.SubEntityName.indexOf($scope.viewdata.searchtext) >= 0) return true;
            if (item.RewardName.indexOf($scope.viewdata.searchtext) >= 0) return true;
            return false;
        };

        $scope.SearchFocus = function() {
            $("#btnClearSearchActivity").show(); 
            console.log("Focus!")           
        };

        $scope.SearchBlur = function() {     
            console.log("Blur")       
            $("#btnClearSearchActivity").hide();
            if (!devEnvironment) $cordovaKeyboard.close(); 
        };

        $scope.ClearSearch = function() {   
            $("#searchTextActivity").blur();
            // $("#btnClearSearchActivity").hide();
            // if ($scope.viewdata.searchtext != '') {
            //     $scope.viewdata.searchtext = "";
            // }
        };

        LoadData();
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
            // console.log(commerce);
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

        LoadData_User();
    }]);

    ctrl.controller('KenuuProfileCtrl', ['$scope', '$timeout', 'userFactory', '$state', '$ionicHistory', 'msgBox', '$ionicLoading', 'loadingBox', function($scope, $timeout, userFactory, $state, $ionicHistory, msgBox, $ionicLoading, loadingBox){
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

        $scope.$on("$ionicView.enter", function(event, args){
            loadingBox.show();
            userFactory.info.get()
                .then(function(data){
                    loadingBox.hide();
                    $scope.viewdata.user = data;
                    var userData = data;
                    $scope.viewdata.user.name = userData.FirstName;
                    $scope.viewdata.user.lastname = userData.LastName;

                    $scope.$apply();
                })
                .catch(function(err){loadingBox.hide();});
        });

        $scope.SaveProfile = function() {
            loadingBox.show();

            userFactory.info.update({
                FirstName: $scope.viewdata.user.name,
                LastName: $scope.viewdata.user.lastname,
                UpdatePassword: false,
                Password: ""
            })
            .then(function(response){
                loadingBox.hide();
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
                loadingBox.hide();
            });
        };

        $scope.DoLogout = function() {
            userFactory.session.logout();
            $ionicHistory.clearHistory();
            $ionicHistory.clearCache();
            $state.go("welcome");
        };

        $scope.GoToChangePwd = function() {
            $state.go("tab.kenuu-pwdchange");
        };
    }]);

    ctrl.controller('KenuuPwdChangeCtrl', ['$scope', '$timeout', 'userFactory', '$state', '$ionicHistory', 'msgBox', '$ionicLoading', 'loadingBox', '$cordovaKeyboard', 'referenceIDFactory', function($scope, $timeout, userFactory, $state, $ionicHistory, msgBox, $ionicLoading, loadingBox, $cordovaKeyboard, referenceIDFactory){
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

        $scope.SaveProfile = function() {  
            if (($scope.viewdata.user.password == "") || ($scope.viewdata.user.passwordconfirmation == ""))
            {
                ShowModalMsg("Oops!", "Por favor ingrese sus contraseñas.", "Ok");
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
                        msgBox.showOkWithAction("¡Listo!", "Actualizó su perfil.", function() {                        
                            $ionicHistory.goBack();
                        });
                    })
                    .catch(function(err){                    
                        // console.log(err);
                    });                
                }
                else
                {                
                    ShowModalMsg("Oops!", "Su contraseña no es válido.", "Ok");
                    return false;
                }
            })
            .catch(function(err){
                loadingBox.hide();
                ShowModalMsg("Oops!", "Su contraseña no es válido.", "Ok");
                return false;
            });
        };
    }]);

// No Connection Procedure

    ctrl.controller('NoConnectionCtrl', ['$scope', '$state', function($scope, $state){
    }]);

// Login Procedure

    ctrl.controller('LoginCtrl', ['$scope', '$cordovaKeyboard', 'loginSignUpFactory', 'userFactory', '$ionicLoading', 'referenceIDFactory', '$cordovaPush', 'deviceFactory', '$ionicHistory', '$state', '$ionicModal', 'loadingBox', function($scope, $cordovaKeyboard, loginSignUpFactory, userFactory, $ionicLoading, referenceIDFactory, $cordovaPush, deviceFactory, $ionicHistory, $state, $ionicModal, loadingBox) {
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

                $state.go('tab.nearme'); // profilepicgenderdob                
            })
            .catch(function(err){
                loadingBox.hide();
                console.log(err.data.ErrorCode);

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

        $scope.recoverPassword = function() {
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
        };

        $scope.CloseModal = function() {
            $scope.modal.hide();
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
                ShowModalMsg("Oops!", "No se puede ingresar, inténtelo de nuevo.", "Ok");
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

    ctrl.controller('SignUpCtrl', ['$scope', '$cordovaKeyboard', 'loginSignUpFactory', 'userFactory', '$ionicLoading', 'referenceIDFactory', '$cordovaPush', 'deviceFactory', '$ionicHistory', '$state', 'loadingBox', function($scope, $cordovaKeyboard, loginSignUpFactory, userFactory, $ionicLoading, referenceIDFactory, $cordovaPush, deviceFactory, $ionicHistory, $state, loadingBox) {
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
                ShowModalMsg('Oops!', 'Por favor ingrese su contraseña.', 'Ok');
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

            loadingBox.show();

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
                        $(".md-overlay").addClass("md-overlay-ok");
                        $(".md-content").addClass("md-content-ok");
                        ShowModalMsg_Ok("Listo!", "¡Ya quedó registrado! Empiece a disfrutar de Kenuu.", "Ok");

                        setTimeout(function(){
                            $ionicHistory.clearHistory();
                            $ionicHistory.clearCache();
                            $ionicHistory.nextViewOptions({
                                disableAnimate: true,
                                disableBack: true,
                                historyRoot: true
                            });
                            $state.go('profilepicgenderdob');  
                        }, 3000);
                    }
                    else
                    {
                        ShowModalMsg("Oops!" ,"No se pudo terminar el registro.", "Ok");
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
                            ShowModalMsg("Oops!", "No se pudo terminar el registro.", "Ok");
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
    }]);

    ctrl.controller('WelcomeCoverCtrl', ['$scope', '$timeout', '$state', '$ionicSlideBoxDelegate', 'userFactory', 'referenceIDFactory', '$ionicLoading', '$cordovaKeyboard', '$cordovaPush', 'deviceFactory', '$cordovaBarcodeScanner', 'signUpLoginView', 'loginSignUpFactory', 'loadingBox', function($scope, $timeout, $state, $ionicSlideBoxDelegate, userFactory, referenceIDFactory, $ionicLoading, $cordovaKeyboard, $cordovaPush, deviceFactory, $cordovaBarcodeScanner, signUpLoginView, loginSignUpFactory, loadingBox){
        localStorage.setItem('animationShown', false);

        $scope.GoToLogin = function() {
            $state.go("welcome");
        };

        $timeout(function(){
            $("#welcome-content").addClass("animated slideInUp");
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

            loadingBox.show();

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
            $scope.viewdata.msgbox.title = title;
            $scope.viewdata.msgbox.message = message;
            $scope.viewdata.msgbox.buttontext = buttontext;

            var modal = document.querySelector('#modal-welcomev-msgbox'),
                close = modal.querySelector( '.md-close' );
            var overlay = document.querySelector( '.md-overlay' );
            classie.add( modal, 'md-show' );
            close.addEventListener( 'click', function( ev ) {
                ev.stopPropagation();
                classie.remove( document.querySelector('#modal-welcomev-msgbox'), 'md-show' );
            });
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
            $("#welcome-content").addClass("animated slideInUp");
            setTimeout(function(){
                $("#welcomeimg1").addClass("animated zoomIn");
                loadingBox.hide();
            }, 1100);        
        });
    }]);

    ctrl.controller('ProfilePicGenderDoBCtrl', ['$scope', '$timeout', 'loadingBox', 'userFactory', 'commerceFactory', '$state', '$ionicLoading', 'setupView', 'emailService', 'navigationFactory', '$cordovaActionSheet', '$cordovaCamera', '$cordovaImagePicker', '$cordovaFile', '$ionicHistory', 'imageFunctions', '$cordovaKeyboard', function($scope, $timeout, loadingBox, userFactory, commerceFactory, $state, $ionicLoading, setupView, emailService, navigationFactory, $cordovaActionSheet, $cordovaCamera, $cordovaImagePicker, $cordovaFile, $ionicHistory, imageFunctions, $cordovaKeyboard){
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
            $state.go("tab.nearme");
        };

        $scope.SaveAndContinue = function() {
            // if ($scope.viewdata.profileimage == '') 
            // {
            //     ShowModalMsg('Oops!', 'Selecciona tu foto del perfil.', 'Ok');
            //     return;
            // }
            if ($scope.viewdata.profilegender == '') 
            {
                ShowModalMsg('Oops!', 'Seleccione su género.', 'Ok');
                return;
            }

            loadingBox.show();

            localStorage.setItem('profile_picture', $scope.viewdata.profileimage);
            localStorage.setItem('profile_gender', $scope.viewdata.profilegender);

            imageFunctions.ConvertImgToBase64URL($scope.viewdata.profileimage, function(imagedata) {
                userFactory.info.updateAvatar(imagedata)
                    .then(function(response){
                        if ((response.status == 'true')||(response.status == true))
                        {
                            if($scope.viewdata.imageHasChange === true){
                                userFactory.info.get()
                                    .then(function(data){
                                        // console.log(JSON.stringify(data));
                                        // CAMBIAR LOS VALORES DE FIRSTNAME Y LASTNAME UNA VEZ QUE VILLEGAS CAMBIE EL SERVICIO!!!
                                        var updateData = {
                                            FirstName: data.FirstName,
                                            LastName: data.LastName,
                                            UpdatePassword: data.UpdatePassword,
                                            Password: data.Password,
                                            AvatarMobile: "http://201.201.150.159/avatar/" + response.data
                                        }
                                        // console.log('UPDATE DATA');
                                        // console.log(updateData);
                                        userFactory.info.update(updateData)
                                            .then(function(updateResponse){
                                                // console.log('UPDATE RESPONSE!!!');
                                                // console.log(updateResponse);
                                                localStorage.setItem('profile_picture_urlfilename', response.data);
                                                $ionicHistory.clearHistory();
                                                $ionicHistory.clearCache();
                                                loadingBox.hide();
                                                $state.go("tab.nearme");
                                            })
                                            .catch(function(err){
                                                // console.log("ERRRRROOOOORRRR!!! 2");
                                                // console.log(JSON.stringify(err));
                                                loadingBox.hide();
                                                ShowModalMsg('Oops!', 'No se pudo guardar su foto de perfil.', 'Ok');
                                            });
                                    })
                                    .catch(function(err){
                                        // console.log("ERRRRROOOOORRRR!!!");
                                        // console.log(err);
                                        loadingBox.hide();
                                        ShowModalMsg('Oops!', 'No se pudo guardar su foto de perfil.', 'Ok');
                                    });
                            } else {
                                localStorage.setItem('profile_picture_urlfilename', response.data);
                                $ionicHistory.clearHistory();
                                $ionicHistory.clearCache();
                                loadingBox.hide();
                                $state.go("tab.nearme");
                            }
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
                    })
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
                cameraDirection: 1
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
                cameraDirection: 1
            };

            $cordovaCamera.getPicture(options).then(function(imageData) {
                SavePicture(imageData);
            }, function(err) {
                // error
            });
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


