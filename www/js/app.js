// Ionic Starter App
var beaconFound = false;

var devEnvironment = true; // To use the app through "ionic serve --lab"

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('kenuu', ['ionic', 'kenuu.controllers', 'kenuu.services', 'kenuu.factory', 'ngCordova'])

.constant('ApiEndpoint', {
	url: 'http://192.168.71.98:8100/api' // CIS Network Development (Tavo)
	// url: 'http://192.168.71.91:8100/api' // CIS Network Development (Alex)
	// url: 'http://192.168.1.7:8100/api' // Home Development Environment
})

.run(function($rootScope, $state, $ionicPlatform, networkFactory, $cordovaNetwork, deviceFactory, $cordovaPush, $ionicTabsDelegate, navigationFactory, commerceFactory, $ionicHistory, loadingBox, $cordovaGeolocation, locationFactory, appVersionFactory, msgBox, mapFactory) {
  	$ionicPlatform.ready(function() {

	    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
	    // for form inputs)
	    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
	      	cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
	      	if (!devEnvironment) cordova.plugins.Keyboard.disableScroll(true);
	    }
	    if (window.StatusBar) {
	      	// org.apache.cordova.statusbar required
		    StatusBar.styleLightContent();
	    }

	    // Invokes the NGCordova Plugin to Get the App Version
	    if (!devEnvironment)
	    {
	    	appVersionFactory.appVersion.set();
	    }

	    // listen for Online event
	    $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
	    	$ionicHistory.clearHistory();
            $ionicHistory.clearCache();
            $ionicHistory.nextViewOptions({
                disableAnimate: true,
                disableBack: true,
                historyRoot: true
            });
            localStorage.setItem('animationShown', false); 
            var _apikey = localStorage.getItem('userReferenceID');			
			if (_apikey != undefined)
			{
	    		$state.go("tab.qrcode");
	    	}
	    	else
	    	{
	    		$state.go("welcome");	
	    	}
	    });

	    // listen for Offline event
	    $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
	    	var _apikey = localStorage.getItem('userReferenceID');

	    	$ionicHistory.clearHistory();
            $ionicHistory.clearCache();
            $ionicHistory.nextViewOptions({
                disableAnimate: true,
                disableBack: true,
                historyRoot: true
            });

			if (_apikey != undefined)
			{				
		    	$state.go("noconnection");
			}
			else {				
				$state.go("noconnection-notlogged");
			}	    	
	    });

		$rootScope.$on('$cordovaPush:notificationReceived', function(event, notification) {
			if (deviceFactory.device.platform() == 'iOS')
			{
				// iOS
				if (notification.alert) {					
					msgBox.showSimpleMessage('', notification.message);					
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
				            var tokenId = notification.regid;
				            var email = deviceFactory.device.registeredUser.get();

				            if (email == "") {
				            	deviceFactory.device.registerdevice(tokenId, email)
		                            .then(function(response){
		                                // OK
		                            })
		                            .catch(function(err){
		                                // Error
		                            });	
				            }
				         }
			          break;

			        case 'message':
			          // this is the actual push notification. its format depends on the data model from the push server
			          // alert('message = ' + notification.message + ' msgCount = ' + notification.msgcnt);
			          //swal(notification.message);			          
			          msgBox.showSimpleMessage('', notification.message);
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

		navigationFactory.setDefaults();

		$rootScope.MyKenuuTabClicked = function() {
			$ionicHistory.nextViewOptions({
                disableBack: true
            });
			navigationFactory.store.setTab("tab.kenuu-storedetail");
			navigationFactory.stores.setTab("tab.kenuu-commercestores");
			navigationFactory.commerce.setTab("tab.kenuu-commerce");
			$state.go("tab.kenuu");
		};

		$rootScope.NearMeTabClicked = function() {
			$ionicHistory.nextViewOptions({
                disableBack: true
            });
			navigationFactory.setDefaults();
			$state.go("tab.nearme");
		};

		mapFactory.map.Initialize();

		if (!devEnvironment) {
			var isOffline = $cordovaNetwork.isOffline();

			if (isOffline) {
				var _apikey = localStorage.getItem('userReferenceID');

				if (_apikey != undefined)
				{
					$ionicHistory.clearHistory();
		            $ionicHistory.clearCache();
		            $ionicHistory.nextViewOptions({
		                disableAnimate: true,
		                disableBack: true,
		                historyRoot: true
		            });
			    	$state.go("noconnection");
				}
				else {
					$ionicHistory.clearHistory();
		            $ionicHistory.clearCache();
		            $ionicHistory.nextViewOptions({
		                disableAnimate: true,
		                disableBack: true,
		                historyRoot: true
		            });
					$state.go("noconnection-notlogged");
				}
				
			}
		}
	});
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider, $cordovaInAppBrowserProvider) {

	$ionicConfigProvider.backButton.text('').icon('ion-android-arrow-back back-btn');

	var defaultOptions = {
		location: 'yes',
		clearcache: 'no',
		toolbar: 'yes'
	};

	$cordovaInAppBrowserProvider.setDefaultOptions(defaultOptions);

	// Ionic uses AngularUI Router which uses the concept of states
	// Learn more here: https://github.com/angular-ui/ui-router
	// Set up the various states which the app can be in.
	// Each state's controller can be found in controllers.js
	$stateProvider

	// No Connection
		.state('noconnection', {
			url: '/noconnection',
			templateUrl: 'templates/views/no-connection/noconnection.html',
			controller: 'NoConnectionCtrl'
		})

		.state('noconnection-notlogged', {
			url: '/noconnection-notlogged',
			templateUrl: 'templates/views/no-connection/noconnection-notlogged.html',
			controller: 'NoConnectionNotLoggedCtrl'
		})

	// **** Welcome and Login ****

		.state('slider', {
			url: '/slider',
			templateUrl: 'templates/views/login-signup/slider.html',
			controller: 'SliderCtrl'
		})

		// Welcome cover
		.state('welcomecover', {
			url: '/welcomecover',
			templateUrl: 'templates/views/login-signup/welcome-cover.html',
			controller: 'WelcomeCoverCtrl'
		})

		// Welcome screen of the app once the user is logged
		.state('welcome', {
			url: '/welcome',
			templateUrl: 'templates/views/login-signup/welcome.html',
			controller: 'WelcomeCtrl'
		})

		// Welcome screen of the app once the user is logged
		.state('login', {
			url: '/login',
			templateUrl: 'templates/views/login-signup/welcome-login.html',
			controller: 'LoginCtrl'
		})

		// Welcome screen of the app once the user is logged
		.state('passwordcreate', {
			url: '/passwordcreate',
			templateUrl: 'templates/views/login-signup/welcome-passwordcreate.html',
			controller: 'PasswordCreateCtrl'
		})

		// Welcome screen of the app once the user is logged
		.state('signup', {
			url: '/signup',
			templateUrl: 'templates/views/login-signup/welcome-signup.html',
			controller: 'SignUpCtrl'
		})

		// Welcome screen of the app once the user is logged
		.state('profilepicgenderdob', {
			url: '/profilepicgenderdob',
			templateUrl: 'templates/views/login-signup/profilepicgenderdob.html',
			controller: 'ProfilePicGenderDoBCtrl'
		})

		// Request for the Location Services to be Activated
		.state('locationsetup', {
			url: '/locationsetup',
			templateUrl: 'templates/views/login-signup/locationsetup.html',
			controller: 'LocationSetupCtrl'
		})

		// Request for the Location Services to be Activated
		.state('pushnotificationssetup', {
			url: '/pushnotificationssetup',
			templateUrl: 'templates/views/login-signup/pushnotificationssetup.html',
			controller: 'PushNotificationsSetupCtrl'
		})			

	// **** Main Tab Section ****

		// setup an abstract state for the tabs directive
		.state('tab', {
			url: "/tab",
			abstract: true,
			templateUrl: "templates/views/tabs/tabs.html"
		})

	// **** Near Me ****

		// Each tab has its own nav history stack:

		.state('tab.nearme', {
			url: '/nearme',
			views: {
				'tab-nearme': {
					templateUrl: 'templates/views/near-me/tab-nearme.html',
					controller: 'NearMeCtrl'
				}
			}
		})

		.state('tab.nearme-commerce', {
			url: '/nearme/commerce',
			views: {
				'tab-nearme': {
					templateUrl: 'templates/views/near-me/tab-commerce-withrewards.html',
					controller: 'CommerceWithRewardsCtrl'
				}
			}
		})

		.state('tab.nearme-commercedetail', {
			url: '/nearme/commercedetail/:entityID',
			views: {
				'tab-nearme': {
					templateUrl: 'templates/views/near-me/tab-commerce-withrewards.html',
					controller: 'CommerceWithRewardsCtrl'
				}
			}
		})

		.state('tab.nearme-commercestores', {
			url: '/nearme/commercestores',
			views: {
				'tab-nearme': {
					templateUrl: 'templates/views/near-me/tab-commerce-stores.html',
					controller: 'CommerceWithRewardsStoresCtrl'
				}
			}
		})

		.state('tab.nearme-map', {
			url: '/nearme/map',
			views: {
		  		'tab-nearme': {
		    		templateUrl: 'templates/views/near-me/tab-map.html',
		    		controller: 'MapCtrl'
		  		}
			}
		})

		.state('tab.nearme-storedetail', {
			url: '/nearme/storedetail/:subEntityID',
			views: {
				'tab-nearme': {
					templateUrl: 'templates/views/near-me/tab-store-detail.html',
					controller: 'StoreDetailCtrl'
				}
			}
		})

		// .state('tab.nearme-storedetailwithid', {
		// 	url: '/nearme/storedetail/:entityID',
		// 	views: {
		// 		'tab-nearme': {
		// 			templateUrl: 'templates/views/near-me/tab-store-detail.html',
		// 			controller: 'StoreDetailCtrl'
		// 		}
		// 	}
		// })

	// **** QR Code ****

		.state('tab.qrcode', {
			url: '/qrcode',
			views: {
				'tab-qrcode': {
					templateUrl: 'templates/views/qr-code/tab-qrcode.html',
					controller: 'QRCodeCtrl'
				}
			}
		})

	// **** Kenuu ****

		.state('tab.kenuu', {
			url: '/kenuu',
			views: {
			  	'tab-kenuu': {
			    	templateUrl: 'templates/views/my-kenuu/tab-kenuu.html',
			    	controller: 'KenuuCtrl'
			  	}
			}
		})

		.state('tab.kenuu-profile', {
			url: '/kenuu/profile',
			views: {
				'tab-kenuu': {
					templateUrl: 'templates/views/my-kenuu/tab-kenuu-profile.html',
					controller: 'KenuuProfileCtrl'
				}
			}
		})

		.state('tab.kenuu-pwdchange', {
			url: '/kenuu/pwdchange',
			views: {
				'tab-kenuu': {
					templateUrl: 'templates/views/my-kenuu/tab-kenuu-changepwd.html',
					controller: 'KenuuPwdChangeCtrl'
				}
			}
		})

		.state('tab.kenuu-favCommerces', {
			url: '/kenuu/favCommerces',
			views: {
				'tab-kenuu': {
					templateUrl: 'templates/views/my-kenuu/tab-kenuu-favCommerces.html',
					controller: 'KenuuFavCommercesCtrl'
				}
			}
		})

		.state('tab.kenuu-activity', {
		  	url: '/kenuu/activity',
		  	views: {
		    	'tab-kenuu': {
		      		templateUrl: 'templates/views/my-kenuu/tab-kenuu-activity.html',
		      		controller: 'ActivityCtrl'
		    	}
		  	}
		})

		.state('tab.kenuu-commerce', {
			url: '/kenuu/commerce',
			views: {
				'tab-kenuu': {
					templateUrl: 'templates/views/near-me/tab-commerce-withrewards.html',
					controller: 'CommerceWithRewardsCtrl'
				}
			}
		})

		.state('tab.kenuu-commercestores', {
			url: '/kenuu/commercestores',
			views: {
				'tab-kenuu': {
					templateUrl: 'templates/views/near-me/tab-commerce-stores.html',
					controller: 'CommerceWithRewardsStoresCtrl'
				}
			}
		})

		.state('tab.kenuu-storedetail', {
			url: '/nearme/storedetail/:subEntityID',
			views: {
				'tab-kenuu': {
					templateUrl: 'templates/views/near-me/tab-store-detail.html',
					controller: 'StoreDetailCtrl'
				}
			}
		})
	;
		
	// Verifies the App has already shown the welcome screen	
	var _apikey = localStorage.getItem('userReferenceID');
	localStorage.setItem('animationShown', false);
	
	var _sliderShown = localStorage.getItem('sliderShownForFirstTime');
	if (_sliderShown == undefined) _sliderShown = false;
	else _sliderShown = JSON.parse(_sliderShown);

	var _url = "";
	if (_apikey != undefined)
	{
		if (!_sliderShown) {
			localStorage.setItem('sliderShownForFirstTime', true);
			_url = '/slider';					
			$urlRouterProvider.otherwise(_url);
		}
		else {
			_url = "/tab/qrcode";
			// _url = '/locationsetup';	
		}
	}
	else
	{
		_url = '/slider';
		// _url = '/locationsetup';
	}	

	$urlRouterProvider.otherwise(_url);
})

.directive('map', function() {
    return {
        restrict: 'E',
        scope: {
            onCreate: '&'
        },
        link: function ($scope, $element, $attr) {
            function initialize() {

            	console.log("Initializing Map...")

                var mapOptions = {
                    // center: new google.maps.LatLng(9.9423209, -84.0750173),
                    // zoom: 16,
                    // mapTypeId: google.maps.MapTypeId.ROADMAP,
                    // disableDefaultUI: true
                    mapTypeControl: false,
	                backgroundColor: '#535353',
	                center: { lat: 19.505581, lng: -94.105582 },
	                maxZoom: 17,
	                mapTypeId: google.maps.MapTypeId.ROADMAP,
	                styles: [{ "featureType": "all", "elementType": "labels.text", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "administrative", "elementType": "labels.text", "stylers": [{ "visibility": "on" }] }, { "featureType": "administrative", "elementType": "labels.text.fill", "stylers": [{ "color": "#444444" }] }, { "featureType": "administrative.country", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "administrative.country", "elementType": "labels", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "administrative.country", "elementType": "labels.text", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "administrative.neighborhood", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "administrative.neighborhood", "elementType": "geometry", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "administrative.neighborhood", "elementType": "geometry.fill", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#f2f2f2" }, { "visibility": "simplified" }] }, { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] }, { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 45 }, { "visibility": "on" }] }, { "featureType": "road.highway", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "road.arterial", "elementType": "labels.icon", "stylers": [{ "visibility": "on" }] }, { "featureType": "road.local", "elementType": "all", "stylers": [{ "visibility": "on" }] }, { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#55c9ea" }, { "visibility": "simplified" }] }],
	                zoom: 4
                };
                var map = new google.maps.Map($element[0], mapOptions);
                $scope.onCreate({map: map});

                // Stop the side bar from dragging when mousedown/tapdown on the map
                google.maps.event.addDomListener($element[0], 'mousedown', function (e) {
                    e.preventDefault();
                    return false;
                });
            }

            if (document.readyState === "complete") {
                initialize();
            } else {
                google.maps.event.addDomListener(window, 'load', initialize);
            }
        }
    };
})

.directive('onFinishRender', function () {
	return {
		restrict: "A",
		link: function(scope, element, attr) {
			if (scope.$last === true) 
            {
            	element.ready(
                	function () 
                	{
                    	scope.$emit(attr.onFinishRender);
                	}
                );
            }
		}
	}
})

.directive('validateEmail', function() {
  var EMAIL_REGEXP = /^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/;

  return {
    require: 'ngModel',
    restrict: '',
    link: function(scope, elm, attrs, ctrl) {
      // only apply the validator if ngModel is present and Angular has added the email validator
      if (ctrl && ctrl.$validators.email) {

        // this will overwrite the default Angular email validator
        ctrl.$validators.email = function(modelValue) {
          return ctrl.$isEmpty(modelValue) || EMAIL_REGEXP.test(modelValue);
        };
      }
    }
  };
})

.directive('ngEnter', function() {
	return function(scope, element, attrs) {
	    element.bind("keydown keypress", function(event) {
	        if(event.which === 13) {
	            scope.$apply(function(){
	                scope.$eval(attrs.ngEnter, {'event': event});
	            });

	            event.preventDefault();
	        }
	    });
	}
})

.directive("scrollBottom", function(){
    return {
        link: function(scope, element, attr){
            var $id= $("#" + attr.scrollBottom);
            $(element).on("click", function(){
                $id.scrollTop($id[0].scrollHeight);
            });
        }
    }
});
