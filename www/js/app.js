// Ionic Starter App
var beaconFound = false;
var devEnvironment = true;
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('kenuu', ['ionic', 'kenuu.controllers', 'kenuu.services', 'kenuu.factory', 'ngCordova'])

.constant('ApiEndpoint', {
	url: 'http://192.168.71.98:8100/api' // CIS Network Development
	// url: 'http://192.168.1.9:8100/api' // Home Development Environment
})

.run(function($rootScope, $state, $ionicPlatform, networkFactory, $cordovaNetwork, deviceFactory, $cordovaPush, $ionicTabsDelegate, navigationFactory, commerceFactory, $ionicHistory) {
  	$ionicPlatform.ready(function() {
	    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
	    // for form inputs)
	    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
	      	cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
	    }
	    if (window.StatusBar) {
	      	// org.apache.cordova.statusbar required
		    StatusBar.styleLightContent();
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
	    	$ionicHistory.clearHistory();
            $ionicHistory.clearCache();
            $ionicHistory.nextViewOptions({
                disableAnimate: true,
                disableBack: true,
                historyRoot: true
            });
	    	$state.go("noconnection");
	    });

		$rootScope.$on('$cordovaPush:notificationReceived', function(event, notification) {
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
		});

		$rootScope.MyKenuuTabClicked = function() {
			navigationFactory.setDefaults();
			$state.go("tab.kenuu");
		};

		$rootScope.RewardsTabClicked = function() {
			commerceFactory.selectedCommerce.clearSelection();
			navigationFactory.rewards.setTab("tab.rewards");
			navigationFactory.rewardDetail.setTab("tab.rewards-rewardDetail");
			navigationFactory.commerce.setTab("tab.rewards-commerce");
			navigationFactory.stores.setTab("tab.rewards-stores");
			$state.go("tab.rewards");
		};
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
		templateUrl: 'templates/noconnection.html',
		controller: 'NoConnectionCtrl'
	})

	// Welcome screen of the app once the user is logged
	.state('welcome', {
		url: '/welcome',
		templateUrl: 'templates/welcome.html',
		controller: 'WelcomeCtrl'
	})

	// Welcome screen of the app once the user is logged
	.state('login', {
		url: '/login',
		templateUrl: 'templates/welcome-login.html',
		controller: 'LoginCtrl'
	})

	// Welcome screen of the app once the user is logged
	.state('passwordcreate', {
		url: '/passwordcreate',
		templateUrl: 'templates/welcome-passwordcreate.html',
		controller: 'PasswordCreateCtrl'
	})

	// Welcome screen of the app once the user is logged
	.state('signup', {
		url: '/signup',
		templateUrl: 'templates/welcome-signup.html',
		controller: 'SignUpCtrl'
	})

	// setup an abstract state for the tabs directive
	.state('tab', {
		url: "/tab",
		abstract: true,
		templateUrl: "templates/tabs.html"
	})

	// Each tab has its own nav history stack:

	.state('tab.qrcode', {
		url: '/qrcode',
		views: {
			'tab-qrcode': {
				templateUrl: 'templates/tab-qrcode.html',
				controller: 'QRCodeCtrl'
			}
		}
	})

	.state('tab.whatsnew', {
		url: '/whatsnew',
		views: {
			'tab-whatsnew': {
				templateUrl: 'templates/tab-whatsnew.html',
				controller: 'WhatsNewCtrl'
			}
		}
	})

	.state('tab.rewards', {
		url: '/rewards',
		views: {
			'tab-rewards': {
				templateUrl: 'templates/tab-kenuu-prices.html',
				controller: 'KenuuPricesCtrl'
			}
		}
	})

	.state('tab.rewards-rewardDetail', {		
		url: '/rewards/rewardDetail',
	  	views: {
	    	'tab-rewards': {
	      		templateUrl: 'templates/tab-kenuu-rewarddetail.html',
	      		controller: 'KenuuRewardDetailCtrl'
	    	}
	  	}
	})

	.state('tab.rewards-commerce', {		
		url: '/rewards/commerce',
	  	views: {
	    	'tab-rewards': {
	      		templateUrl: 'templates/tab-kenuu-commerce.html',
	      		controller: 'KenuuCommerceCtrl'
	    	}
	  	}
	})

	.state('tab.rewards-stores', {		
		url: '/rewards/stores',
	  	views: {
	    	'tab-rewards': {
	      		templateUrl: 'templates/tab-kenuu-stores.html',
	      		controller: 'KenuuStoresCtrl'
	    	}
	  	}
	})

	.state('tab.kenuu', {
		url: '/kenuu',
		views: {
		  	'tab-kenuu': {
		    	templateUrl: 'templates/tab-kenuu.html',
		    	controller: 'KenuuCtrl'
		  	}
		}
	})

	.state('tab.kenuu-prices', {
		url: '/kenuu/prices',
		views: {
			'tab-kenuu': {
				templateUrl: 'templates/tab-kenuu-prices.html',
				controller: 'KenuuPricesCtrl'
			}
		}
	})

	.state('tab.search-prices', {
		url: '/search/prices',
		views: {
			'tab-search': {
				templateUrl: 'templates/tab-kenuu-prices.html',
				controller: 'KenuuPricesCtrl'
			}
		}
	})

	.state('tab.kenuu-profile', {
		url: '/kenuu/profile',
		views: {
			'tab-kenuu': {
				templateUrl: 'templates/tab-kenuu-profile.html',
				controller: 'KenuuProfileCtrl'
			}
		}
	})

	.state('tab.kenuu-favCommerces', {
		url: '/kenuu/favCommerces',
		views: {
			'tab-kenuu': {
				templateUrl: 'templates/tab-kenuu-favCommerces.html',
				controller: 'KenuuFavCommercesCtrl'
			}
		}
	})

	.state('tab.kenuu-rewarddetail', {
	  	url: '/kenuu/rewardDetail',
	  	views: {
	    	'tab-kenuu': {
	      		templateUrl: 'templates/tab-kenuu-rewarddetail.html',
	      		controller: 'KenuuRewardDetailCtrl'
	    	}
	  	}
	})

	.state('tab.kenuu-stores', {
	  	url: '/kenuu/stores',
	  	views: {
	    	'tab-kenuu': {
	      		templateUrl: 'templates/tab-kenuu-stores.html',
	      		controller: 'KenuuStoresCtrl'
	    	}
	  	}
	})

	.state('tab.search-stores', {
	  	url: '/search/stores',
	  	views: {
	    	'tab-search': {
	      		templateUrl: 'templates/tab-kenuu-stores.html',
	      		controller: 'KenuuStoresCtrl'
	    	}
	  	}
	})

	.state('tab.kenuu-commerce', {
	  	url: '/kenuu/commerce',
	  	views: {
	    	'tab-kenuu': {
	      		templateUrl: 'templates/tab-kenuu-commerce.html',
	      		controller: 'KenuuCommerceCtrl'
	    	}
	  	}
	})

	.state('tab.kenuu-activity', {
	  	url: '/kenuu/activity',
	  	views: {
	    	'tab-kenuu': {
	      		templateUrl: 'templates/tab-kenuu-activity.html',
	      		controller: 'ActivityCtrl'
	    	}
	  	}
	})

	.state('tab.search', {
		url: '/search',
		views: {
	  		'tab-search': {
	    		templateUrl: 'templates/tab-search.html',
	    		controller: 'SearchCtrl'
	  		}
		}
	})

	.state('tab.search-commerce', {
	  	url: '/search/commerce',
		views: {
	  		'tab-search': {
	    		templateUrl: 'templates/tab-kenuu-commerce.html',
	    		controller: 'KenuuCommerceCtrl'
	  		}
		}
	})

	.state('tab.search-rewarddetail', {
	  	url: '/search/rewardDetail',
	  	views: {
	    	'tab-search': {
	      		templateUrl: 'templates/tab-kenuu-rewarddetail.html',
	      		controller: 'KenuuRewardDetailCtrl'
	    	}
	  	}
	})

	.state('tab.map', {
		url: '/map',
		views: {
	  		'tab-map': {
	    		templateUrl: 'templates/tab-map.html',
	    		controller: 'MapCtrl'
	  		}
		}
	})

	.state('tab.map-store', {
		url: '/map/store/:entityID',
		views: {
	  		'tab-map': {
	    		templateUrl: 'templates/tab-kenuu-commerce.html',
	    		controller: 'KenuuCommerceCtrl'
	  		}
		}
	});

	// if none of the above states are matched, use this as the fallback	
	// $urlRouterProvider.otherwise('/tab/kenuu/profile');
	// $urlRouterProvider.otherwise('/tab/kenuu/favCommerces');
	// $urlRouterProvider.otherwise('/tab/kenuu/stores');
	// $urlRouterProvider.otherwise('/tab/kenuu/commerce');
	// $urlRouterProvider.otherwise('/tab/kenuu/rewardDetail');
	// $urlRouterProvider.otherwise('/tab/kenuu/prices');
	// $urlRouterProvider.otherwise('/tab/kenuu');
	// $urlRouterProvider.otherwise('/tab/qrcode');
	// $urlRouterProvider.otherwise('/tab/search');	
	// $urlRouterProvider.otherwise('/tab/map');	

	// Verifies the App has already shown the welcome screen
	var _apikey = localStorage.getItem('userReferenceID');
	localStorage.setItem('animationShown', false);
	var _url = "";
	if (_apikey != undefined)
	{
		_url = "/tab/qrcode";
	}
	else
	{
		_url = '/welcome';
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
                var mapOptions = {
                    center: new google.maps.LatLng(9.9423209, -84.0750173),
                    zoom: 16,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    disableDefaultUI: true
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
	}
);;