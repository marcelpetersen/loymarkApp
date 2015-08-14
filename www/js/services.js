angular.module('kenuu.services', [])

.service('socialSharing', ['$cordovaSocialSharing', function($cordovaSocialSharing) {
	this.ShareViaTwitter = function(message, image, link) {
		// return $cordovaSocialSharing.canShareVia('twitter', message, image, link);
		return $cordovaSocialSharing.shareViaTwitter(message, image, link);
	};

	this.ShareViaFacebook = function(message, image, link) {
		// return $cordovaSocialSharing.canShareVia('facebook', message, image, link);
		return $cordovaSocialSharing.shareViaFacebook(message, image, link);
	};
}])

.service('emailService', ['$cordovaEmailComposer', function($cordovaEmailComposer) {
	this.ContactCustomerService = function() {
		var email = {
            to: 'ayudaalcliente@kenuupops.com',
            subject: 'Kenuu - Asistencia al Cliente',
            body: 'Quiero Ayuda!',
            isHtml: true
        };

        $cordovaEmailComposer.open(email).then(null, function () {
            // TODO...
        });
	};

	this.EmatilTo = function(to, subject) {
		var email = {
            to: to,
            subject: subject,
            body: '',
            isHtml: true
        };

        $cordovaEmailComposer.open(email).then(null, function () {
            // TODO...
        });
	};
}])

.service('dateFxService', [function(){
	function getDaysInMonth(month,year) {     
        if( typeof year == "undefined") year = 1999; // any non-leap-year works as default     
        var currmon = new Date(year,month),     
            nextmon = new Date(year,month+1);
        return Math.floor((nextmon.getTime()-currmon.getTime())/(24*3600*1000));
    };
    function getDateTimeSince(target) { // target should be a Date object
        var now = new Date(), diff, yd, md, dd, hd, nd, sd, out = [];
        diff = Math.floor(now.getTime()-target.getTime()/1000);
        yd = target.getFullYear()-now.getFullYear();
        md = target.getMonth()-now.getMonth();
        dd = target.getDate()-now.getDate();
        hd = target.getHours()-now.getHours();
        nd = target.getMinutes()-now.getMinutes();
        sd = target.getSeconds()-now.getSeconds();
        if( md < 0) {yd--; md += 12;}
        if( dd < 0) {
            md--;
            dd += getDaysInMonth(now.getMonth()-1,now.getFullYear());
        }
        if( hd < 0) {dd--; hd += 24;}
        if( md < 0) {hd--; md += 60;}
        if( sd < 0) {md--; sd += 60;}

        if( yd > 0) out.push( yd+" año"+(yd == 1 ? "" : "s"));
        else
        {
            if( md > 0) out.push( md+" mes"+(md == 1 ? "" : "es"));
            else
            {
                if( dd > 0) out.push( dd+" día"+(dd == 1 ? "" : "s"));
                else
                {
                    if( hd > 0) out.push( hd+" hora"+(hd == 1 ? "" : "s"));
                    else
                    {
                        if( nd > 0) out.push( nd+" minuto"+(nd == 1 ? "" : "s"));
                        else
                        {
                            if( sd > 0) out.push( sd+" segundo"+(sd == 1 ? "" : "s"));        
                        }                        
                    }                    
                }                
            }            
        }
        
        return out.join(" ");
    };

	this.lapseSince = function(dateInStr) {
		var d = new Date(dateInStr);
        return getDateTimeSince(d);
	};
}])

.factory('setupView', ['$ionicModal', function($ionicModal){
	var _modal = {};
	return {
		Show: function($scope) {
			$ionicModal.fromTemplateUrl('templates/modals/setupModal.html', {
				scope: $scope,
				animation: 'slide-in-up'
			}).then(function(modal) {
				_modal = modal;
				_modal.show();
			});
		},
		Close: function() {
			_modal.hide();
		}
	};
}])

.factory('rewardDetailModal', ['$ionicModal', function($ionicModal){
	var _modal = {};
	return {
		Show: function($scope) {
			$ionicModal.fromTemplateUrl('templates/modals/reward-detail.html', {
				scope: $scope,
				animation: 'slide-in-up'
			}).then(function(modal) {
				_modal = modal;
				_modal.show();
			});
		},
		Close: function() {
			_modal.hide();
		}
	};
}])

.factory('signUpLoginView', ['$ionicModal', function($ionicModal){
	var _modal = {};
	return {
		ShowLogin: function($scope) {
			$ionicModal.fromTemplateUrl('templates/modalLogin.html', {
				scope: $scope,
				animation: 'slide-in-up'
			}).then(function(modal) {
				_modal = modal;
				_modal.show();
			});
		},
		ShowSignUp: function($scope) {
			$ionicModal.fromTemplateUrl('templates/modalSignup.html', {
				scope: $scope,
				animation: 'slide-in-up'
			}).then(function(modal) {
				_modal = modal;
				_modal.show();
			});
		},
		Close: function() {
			_modal.hide();
		}
	};
}])

.factory('Chats', function() {
	// Might use a resource here that returns a JSON array

	// Some fake testing data
	var chats = [{
		id: 0,
		name: 'Ben Sparrow',
		lastText: 'You on your way?',
		face: 'https://pbs.twimg.com/profile_images/514549811765211136/9SgAuHeY.png'
	}, {
		id: 1,
		name: 'Max Lynx',
		lastText: 'Hey, it\'s me',
		face: 'https://avatars3.githubusercontent.com/u/11214?v=3&s=460'
	}, {
		id: 2,
		name: 'Andrew Jostlin',
		lastText: 'Did you get the ice cream?',
		face: 'https://pbs.twimg.com/profile_images/491274378181488640/Tti0fFVJ.jpeg'
	}, {
		id: 3,
		name: 'Adam Bradleyson',
		lastText: 'I should buy a boat',
		face: 'https://pbs.twimg.com/profile_images/479090794058379264/84TKj_qa.jpeg'
	}, {
		id: 4,
		name: 'Perry Governor',
		lastText: 'Look at my mukluks!',
		face: 'https://pbs.twimg.com/profile_images/491995398135767040/ie2Z_V6e.jpeg'
	}];

	return {
		all: function() {
			return chats;
		},
		remove: function(chat) {
			chats.splice(chats.indexOf(chat), 1);
		},
		get: function(chatId) {
			for (var i = 0; i < chats.length; i++) {
				if (chats[i].id === parseInt(chatId)) {
					return chats[i];
				}
			}
			return null;
		}
	};
})

.service('msgBox', [function(){
	this.showOk = function(title, msg){
        swal(
            {   
                title: title,   
                text: msg,           
                type: "success",            
                confirmButtonText: "Ok",
                customClass: "modal-bg",
                confirmButtonColor: "#A5CD37"
            }
        );
	};

	this.showSimpleMessage = function(title, msg) {
		swal(
			{
				title: title,
				text: msg,
				closeOnConfirm: true,
				confirmButtonText: "Ok",
				confirmButtonColor: "#A5CD37"
			}
		);
	};

	this.showOkWithAction = function(title, msg, callbackfx) {
		swal(
            {   
                title: title,   
                text: msg,                       
                confirmButtonText: "Ok",
                customClass: "modal-bg",
                confirmButtonColor: "#A5CD37"
            },
            callbackfx
        );
	};

	this.showWarning = function(title, msg){
        swal(
            {   
                title: title,   
                text: msg,  
                type: "warning",
                confirmButtonText: "Ok",
                customClass: "modal-bg",
                confirmButtonColor: "#A5CD37"
            }
        );
	};
}])

.service('loadingBox', ['$ionicLoading', 'deviceFactory', function($ionicLoading, deviceFactory){
	this.show = function(message) {

		var spinner = "android"; // Default

		if (deviceFactory.device.device().platform == "iOS") {
			spinner = "ios";
		}

		if (message == undefined)
		{
			$ionicLoading.show({template: '<ion-spinner icon="' + spinner + '" class="spinner"></ion-spinner>'});
		}
		else
		{
			$ionicLoading.show({template: '<p>' + message + '</p><ion-spinner icon="' + spinner + '" class="spinner"></ion-spinner>'});
		}		
	};

	this.hide = function() {
		$ionicLoading.hide();
	};
}])

.service('imageFunctions', [function(){
	/*
		* Convert an image 
		* to a base64 url
		* @param  {String}   url         
		* @param  {Function} callback    
		* @param  {String}   [outputFormat=image/png]           
	*/
	this.ConvertImgToBase64URL = function(url, callback, outputFormat){
	    var img = new Image();
	    img.crossOrigin = 'Anonymous';
	    img.onload = function(){
	        var canvas = document.createElement('CANVAS'),
	        ctx = canvas.getContext('2d'), dataURL;
	        canvas.height = img.height;
	        canvas.width = img.width;
	        ctx.drawImage(img, 0, 0);
	        dataURL = canvas.toDataURL(outputFormat);
	        callback(dataURL);
	        canvas = null; 
	    };
    	img.src = url;
    };
}])

.service('formatServices', [function(){

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
    }

    function convertUTCDateToLocalDate(date) {
    	date = new Date(date);
	    var newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);

	    var ampm = "AM";
	    var hour = newDate.getHours();
	    var minutes = newDate.getMinutes();
	    if (newDate.getHours() > 12) ampm = "PM";

	    var offset = date.getTimezoneOffset() / 60;
	    var hours = date.getHours();

	    newDate.setHours(hours - offset);
	    return {
	    	date: newDate,
	    	ampm: ampm,
	    	hour: hour,
	    	minutes: minutes
	    }   
	}

	function addZero(i) {
	    if (i < 10) {
	        i = "0" + i;
	    }
	    return i;
	}

	var monthAbbreviations = [
		"", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
	];

	var monthNames = [
		"Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
		"Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
	];

	var dayNames = [
		"Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"
	];

	this.FormatDateWithT = function(date, defaultValue) {
		if (defaultValue == undefined) defaultValue = "";

		if (date == null) return defaultValue;
		if (date == undefined) return defaultValue;
		if (date == "") return defaultValue;
		
		if (date.indexOf("T") > 0) {
        	var day = date.substring(8,10);
        	var _monthAbbr = monthAbbreviations[Number(date.substring(5,7))];
        	var year = date.substring(0,4);

        	var _date = new Date(day + "-" + _monthAbbr + "-" + year);        	
        	var _day = _date.getDate();
        	var _month = monthNames[_date.getMonth()];
        	var _year = _date.getFullYear();
        	var _wday = dayNames[_date.getDay()];

        	return _wday + ", " + _day + " de " + _month + " de " + _year;
		}
		else {
			return date;
		}
	};

	this.FormatDateWithTAndTime = function(date, defaultValue) {
		if (defaultValue == undefined) defaultValue = "";

		if (date == null) return defaultValue;
		if (date == undefined) return defaultValue;
		if (date == "") return defaultValue;
		
		if (date.indexOf("T") > 0) {
			var options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
			var _date = new Date(date);
			var _time = new Date(_date.getTime() + _date.getTimezoneOffset()*60*1000)
        	return _date.toLocaleDateString('es', options) + " " + _time.getHours() + ":" + addZero(_time.getMinutes());
		}
		else {
			return date;
		}
	};

	this.SimpleFormat = function(dateString) {
		return new Date(dateString).toString();
	};
}])

.service('shareLinkMessageService', [function(){	
}])

.service('mapFactory', [function(){
	var _map = {};
	var _element = {};

	function initialize() {
        var mapOptions = {
            mapTypeControl: false,
            backgroundColor: '#535353',
            center: { lat: 19.505581, lng: -94.105582 },
            maxZoom: 17,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: [{ "featureType": "all", "elementType": "labels.text", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "administrative", "elementType": "labels.text", "stylers": [{ "visibility": "on" }] }, { "featureType": "administrative", "elementType": "labels.text.fill", "stylers": [{ "color": "#444444" }] }, { "featureType": "administrative.country", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "administrative.country", "elementType": "labels", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "administrative.country", "elementType": "labels.text", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "administrative.neighborhood", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "administrative.neighborhood", "elementType": "geometry", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "administrative.neighborhood", "elementType": "geometry.fill", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "landscape", "elementType": "all", "stylers": [{ "color": "#f2f2f2" }, { "visibility": "simplified" }] }, { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] }, { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 45 }, { "visibility": "on" }] }, { "featureType": "road.highway", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "road.arterial", "elementType": "labels.icon", "stylers": [{ "visibility": "on" }] }, { "featureType": "road.local", "elementType": "all", "stylers": [{ "visibility": "on" }] }, { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "simplified" }] }, { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#55c9ea" }, { "visibility": "simplified" }] }],
            zoom: 4
        };
        
        _element = document.createElement("map");
        _element.setAttribute("data-tap-disabled", true);
        _element.className = "map-container";
        
        _map = new google.maps.Map(_element, mapOptions);

        // Stop the side bar from dragging when mousedown/tapdown on the map
        google.maps.event.addDomListener(_element, 'mousedown', function (e) {
            e.preventDefault();
            return false;
        });
    }

    return {
    	map: {
    		Initialize: function() {
    			initialize();		
    		},
    		get: function() {
    			return _map;
    		}
    	},
    	element: {
    		get: function() {
    			return _element;
    		}
    	}
    }
}]);
