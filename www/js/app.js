// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js
angular.module('kenuu', ['ionic', 'kenuu.controllers', 'kenuu.services', 'kenuu.factory', 'ngCordova'])

.constant('ApiEndpoint', {
	url: 'http://192.168.71.98:8100/api'
})

.run(function($ionicPlatform) {
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
  	});
})

.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider) {

	$ionicConfigProvider.backButton.text('').icon('ion-android-arrow-back back-btn');

	// Ionic uses AngularUI Router which uses the concept of states
	// Learn more here: https://github.com/angular-ui/ui-router
	// Set up the various states which the app can be in.
	// Each state's controller can be found in controllers.js
	$stateProvider

	.state('welcome', {
		url: '/welcome',
		templateUrl: 'templates/welcome.html',
		controller: 'WelcomeCtrl'
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

	// Pending to Develop

	.state('tab.commerces', {
		url: '/commerces',
		views: {
			'tab-commerces': {
		  		templateUrl: 'templates/tab-commerces.html',
		  		controller: 'CommercesCtrl'
			}
		}
	})
	.state('tab.commerces-detail', {
	  	url: '/commerces/:commerceID',
	  	views: {
	    	'tab-commerces': {
	      		templateUrl: 'templates/commerces-detail.html',
	      		controller: 'CommercesDetailCtrl'
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
	var _apikey = localStorage.getItem('userAPIKey');
	localStorage.setItem('animationShown', false);
	if (_apikey != undefined)
	{
		$urlRouterProvider.otherwise('/tab/whatsnew');
	}
	else
	{
		$urlRouterProvider.otherwise('/welcome');
	}	
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