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
});
