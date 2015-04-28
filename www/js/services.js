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
			$ionicModal.fromTemplateUrl('templates/setupModal.html', {
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
                confirmButtonText: "Ok",
                customClass: "modal-bg",
                confirmButtonColor: "#8f04a9"
            }
        );
	};
}]);
