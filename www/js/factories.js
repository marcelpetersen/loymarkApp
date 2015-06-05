var fact = angular.module('kenuu.factory', []);

fact.factory('networkFactory', ['$cordovaNetwork', function($cordovaNetwork){
    return {
        connection: {
            isOnline: function() {
                if (navigator.connection)
                {
                    var isOnline = $cordovaNetwork.isOnline();
                    var isOffline = $cordovaNetwork.isOffline();

                    if ((isOffline)&&(!isOnline)) return false;
                    if (isOffline) return false;
                    if ((!isOffline)&&(isOnline)) return true;
                    if (isOnline) return true;
                }
                else
                {
                    return false;
                }
            }
        }
    }
}]);

fact.factory('deviceFactory', ['$cordovaDevice', 'restFactory', '$cordovaPush', function($cordovaDevice, restFactory, $cordovaPush){
    var _device = {};
    var _platform = "";
    var _errormessage = "";
    var _uuid = "";
    var _debugdata = "";
    var _userid = ""; // User's email

    function FormatToken(platform, token) {
        if (platform === "iOS") 
        {
            var _token = "<" +
            token.substring(0,8) + " " +
            token.substring(8,16) + " " +
            token.substring(16,24) + " " +
            token.substring(24,32) + " " +
            token.substring(32,40) + " " +
            token.substring(40,48) + " " +
            token.substring(48,56) + " " +
            token.substring(56,64) + ">";    
        }
        else
        {
            _token = token;   
        }

        return _token;
    };

    return {
        device: {
            registeredUser: {
                get: function() {
                    return _userid;
                },
                set: function(userid){
                    _userid = userid;
                }
            },
            platform: function() {
                // Device Recognition
                _errormessage = "";
                try {                    
                    _platform = $cordovaDevice.getPlatform();
                    return _platform;
                }
                catch(err)
                {
                    _errormessage = err;
                    return "";
                }
            },
            device: function() {
                // ------------------------
                // available: true
                // platform: "iOS"
                // version: "8.3"
                // uuid: [token]
                // cordova: "3.8.0"
                // model: "iPhone7,2"
                // manufacturer: "Apple"
                // ------------------------
                _device = $cordovaDevice.getDevice();                
                return _device;
            },
            uuid: function() {
                _uuid = $cordovaDevice.getUUID();
                return _uuid;
            },
            errmessage: function(){
                return _errormessage;
            },
            registerdevice: function(deviceToken, userReferenceID) {
                return new Promise(function(resolve,reject){                    
                    _device = $cordovaDevice.getDevice();

                    var token = FormatToken(_device.platform, deviceToken);

                    restFactory.device.register(_device, token, userReferenceID)
                        .then(function(response){                            
                            resolve(response);
                        })
                        .catch(function(response){                            
                            reject(response);
                        });                    
                });
            },
            debugdata: function() {
                _device = $cordovaDevice.getDevice();
                return JSON.stringify(_device);
            }
        }
    }
}]);

fact.factory('restFactory', ['$http', 'ApiEndpoint', 'referenceIDFactory', function($http, ApiEndpoint, referenceIDFactory){
    var serverURL = "";

    if (devEnvironment) { serverURL = ApiEndpoint.url; }
    else { serverURL = 'http://201.201.150.159'; }

    return {
        user:{
            info:{
                get: function(){
                    var url = serverURL + '/member/info';
                    return new Promise(function(resolve,reject){
                        $http({
                            headers: {
                                'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                            },
                            method: 'GET',
                            url: url
                        })
                        .success(function(data,status,headers,config){
                            if(data.status===true){
                                resolve(data.data);
                            } else {
                                reject(data);
                            }
                        })
                        .error(function(data,status,headers,cofig){
                            reject(data);
                        });
                    });
                },
                update: function(_data){
                    var url = serverURL + '/member/userProfile';
                    return new Promise(function(resolve,reject){
                        var _jdata =
                        {
                            jsonData: JSON.stringify(_data)
                        };

                        $http({
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                            },
                            method: 'PATCH',
                            url: url,
                            data: $.param(_jdata)
                        })
                        .success(function(data,status,headers,config){
                            if(data.status===true){
                                resolve(data);
                            } else {
                                reject(data);
                            }
                        })
                        .error(function(data,status,headers,cofig){
                            reject(data);
                        });
                    });
                },
                updateAvatar: function(_imagedata) {
                    var url = serverURL + '/member/userprofile/updateAvatar';
                    return new Promise(function(resolve,reject){
                        var _jdata =
                        {
                            jsonData: JSON.stringify({image: _imagedata})
                        };

                        $http({
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                            },
                            method: 'POST',
                            url: url,
                            data: $.param(_jdata)
                        })
                        .success(function(data,status,headers,config){
                            if(data.status==true){
                                resolve(data);
                            } else {
                                reject(data);
                            }
                        })
                        .error(function(data,status,headers,cofig){
                            reject(data);
                        });
                    }); 
                }
            },
            activity:{
                all: {
                    get: function(){
                        var url = serverURL + '/member/activity';
                        return new Promise(function(resolve,reject){
                            $http({
                                headers: {
                                    'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                                },
                                method: 'GET',
                                url: url
                            })
                                .success(function(data,status,headers,config){
                                    if(data.status===true){
                                        resolve(data.data);
                                    } else {
                                        reject(data);
                                    }
                                })
                                .error(function(data,status,headers,config){
                                    reject(data);
                                });
                        });
                    }
                },
                visits:{
                    get: function(_data){
                        var url = serverURL + '/member/activity/visits';
                        return new Promise(function(resolve,reject){
                            $http({
                                headers: {
                                    'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                                },
                                method: 'GET',
                                url: url,
                                params: _data
                            })
                                .success(function(data,status,headers,config){
                                    if(data.status===true){
                                        resolve(data.data);
                                    } else {
                                        reject(data);
                                    }
                                })
                                .error(function(data,status,headers,config){
                                    reject(data);
                                });
                        });
                    },
                    commerce:{
                        get: function(){
                            var url = serverURL + '/member/activity/visits/commerce';
                            return new Promise(function(resolve,reject){
                                $http({
                                    headers: {
                                        'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                                    },
                                    method: 'GET',
                                    url: url
                                })
                                    .success(function(data,status,headers,config){
                                        if(data.status===true){
                                            resolve(data.data);
                                        } else {
                                            reject(data);
                                        }
                                    })
                                    .error(function(data,status,headers,config){
                                        reject(data);
                                    });
                            });
                        }
                    },
                    stores:{
                        get: function(){
                            var url = serverURL + '/member/activity/visits/stores';
                            return new Promise(function(resolve,reject){
                                $http({
                                    headers: {
                                        'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                                    },
                                    method: 'GET',
                                    url: url
                                })
                                    .success(function(data,status,headers,config){
                                        if(data.status===true){
                                            resolve(data.data);
                                        } else {
                                            reject(data);
                                        }
                                    })
                                    .error(function(data,status,headers,config){
                                        reject(data);
                                    });
                            });
                        }
                    }
                }
            },
            redemptions:{
                get: function(_data){
                    var url = serverURL + '/member/activity/redemptions';
                    return new Promise(function(resolve,reject){
                        $http({                            
                            headers: {
                                'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                            },
                            method: 'GET',
                            url: url,
                            data: _data
                        })
                        .success(function(data,status,headers,config){
                            if(data.status===true){
                                resolve(data.data);
                            } else {
                                reject(data);
                            }
                        })
                        .error(function(data,status,headers,cofig){
                            reject(data);
                        });
                    });
                }
            },
            login: function(_data) {
                return new Promise(function(resolve, reject){
                    var url = serverURL + '/member/login';
                    $http({
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'                            
                        },
                        method: 'POST',
                        url: url,
                        data: $.param({
                            jsonData: JSON.stringify(_data)
                        })
                    })
                    .success(function(data,status,headers,config){
                        if(data.status===true){
                            resolve(data.data);
                        } else {
                            reject(data);
                        }
                    })
                    .error(function(data,status,headers,cofig){
                        reject(data);
                    });
                });
            },
            signup: function(_data) {
                return new Promise(function(resolve, reject){
                    var url = serverURL + '/member/signup';
                    $http({
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'                            
                        },
                        method: 'POST',
                        url: url,
                        data: $.param({
                            jsonData: JSON.stringify(_data)
                        })
                    })
                    .success(function(data,status,headers,config){
                        if(data.status===true){
                            resolve(data);
                        } else {
                            reject(data);
                        }
                    })
                    .error(function(data,status,headers,cofig){
                        reject(data);
                    });
                });
            },
            validateEmail: function(email) {
                return new Promise(function(resolve, reject){
                    var url = serverURL + '/member/validateEmail?email=' + email;
                    $http({
                        method: 'GET',
                        url: url
                    })
                    .success(function(data,status,headers,config){
                        if(data.status===true){
                            resolve(data);
                        } else {
                            reject(data);
                        }
                    })
                    .error(function(data,status,headers,cofig){
                        reject(data);
                    });
                });
            },
            passwordrecovery: function(email) {
                return new Promise(function(resolve, reject){
                    var url = serverURL + '/member/password/recovery?email=' + email;
                    $http({
                        method: 'POST',
                        url: url
                    })
                    .success(function(data,status,headers,config){
                        if(data.status===true){
                            resolve(data.data);
                        } else {
                            reject(data.data);
                        }
                    })
                    .error(function(data,status,headers,cofig){
                        reject(data);
                    });
                });
            }
        },
        commerce:{
            get: function(entityID){
                var url = serverURL + '/commerce/list';
                var params = {};

                if (entityID != undefined) {
                    params["entityID"] = entityID;
                }

                return new Promise(function(resolve,reject){
                    $http({
                        headers: {
                            'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                        },
                        method: 'GET',
                        url: url,
                        params: params
                    })
                        .success(function(data,status,headers,config){
                            if(data.status===true){
                                resolve(data.data);
                            } else {
                                reject(data);
                            }
                        })
                        .error(function(data,status,headers,cofig){
                            reject(data);
                        });
                });
            },
            stores: {
                get: function(entityID){
                    var url = serverURL + '/commerce/stores';
                    return new Promise(function(resolve,reject){
                        $http({
                            headers: {
                                'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                            },
                            method: 'GET',
                            url: url,
                            params: {
                                entityID: entityID
                            }
                        })
                            .success(function(data,status,headers,config){
                                if(data.status===true){
                                    resolve(data.data);
                                } else {
                                    reject(data);
                                }
                            })
                            .error(function(data,status,headers,config){
                                reject(data);
                            });
                    });
                },
                nearby: function(entityID,long,lat,page,kilometers){
                    var url = serverURL + "/commerce/nearby/stores";
                    return new Promise(function(resolve,reject){
                        $http({
                            headers: {
                                'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                            },
                            method: 'GET',
                            url: url,
                            params: {
                                entityID: entityID,
                                locationlongitude: long,
                                locationlatitude: lat,
                                kilometers: kilometers,
                                paging: true,
                                pagesize: '250',
                                pagenum: page
                            }
                        })
                        .success(function(data,status,headers,config){
                            if(data.status===true){
                                resolve(data.data);
                            } else {
                                reject(data);
                            }
                        })
                        .catch(function(data,status,headers,config){
                            reject(data);
                        });
                    });
                }
            }
        },
        store: {
            get: function(subEntityID) {
                var url = serverURL + '/commerce/details/store';
                var params = {};

                if (subEntityID != undefined) {
                    params["subEntityID"] = subEntityID;
                }

                return new Promise(function(resolve,reject){
                    $http({
                        headers: {
                            'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                        },
                        method: 'GET',
                        url: url,
                        params: params
                    })
                        .success(function(data,status,headers,config){
                            if(data.status===true){
                                resolve(data.data);
                            } else {
                                reject(data);
                            }
                        })
                        .error(function(data,status,headers,cofig){
                            reject(data);
                        });
                });
            }
        },
        reward:{
            active: {
                get: function(entityID, subEntityID){
                    var url = serverURL + '/reward/active';

                    var _http = 
                    {
                        headers: {
                            'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                        },
                        method: 'GET',
                        url: url
                    };

                    if (entityID != undefined)
                    {
                        _http["params"] = {
                            "entityID": entityID
                        }
                    }

                    if (subEntityID != undefined)
                    {
                        _http["params"]["subEntityID"] = subEntityID;                            
                    }

                    return new Promise(function(resolve,reject){
                        $http(_http)
                            .success(function(data,status,headers,config){
                                if(data.status===true){
                                    resolve(data.data);
                                } else {
                                    reject(data);
                                }
                            })
                            .error(function(data,status,headers,config){
                                reject(data);
                            });
                    });
                },
                store:{
                    get: function(_data){
                        var url = serverURL + '/reward/active/store';
                        return new Promise(function(resolve,reject){
                            $http({
                                headers: {
                                    'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                                },
                                method: 'GET',
                                url: url,
                                params: _data
                            })
                                .success(function(data,status,headers,config){
                                    if(data.status===true){
                                        resolve(data.status);
                                    } else {
                                        reject(data);
                                    }
                                })
                                .error(function(data,status,headers,config){
                                    reject(data);
                                });
                        });
                    }
                }
            }
        },
        social:{
            get: function(_data){
                var url = serverURL + '/social';
                return new Promise(function(resolve,reject){
                    $http({
                        headers: {
                            'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                        },
                        method: 'GET',
                        url: url,
                        params: _data
                    })
                        .success(function(data,status,headers,config){
                            if(data.status===true){
                                resolve(data.data);
                            } else {
                                reject(data);
                            }
                        })
                        .error(function(data,status,headers,config){
                            reject(data)
                        });
                });
            },
            post: function(_data){
                var url = serverURL + '/social';
                return new Promise(function(resolve,reject){
                    $http({
                        headers: {
                            'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                        },
                        method: 'POST',
                        url: url,
                        data: {jsonData:JSON.stringify(_data)}
                    })
                        .success(function(data,status,headers,config){
                            if(data.status===true){
                                resolve(data.data);
                            } else {
                                reject(data);
                            }
                        })
                        .error(function(data,status,headers,config){
                            reject(data);
                        });
                });
            },
            patch: function(_data){
                var url = serverURL + '/social/review';
                return new Promise(function(resolve,reject){
                    $http({
                        headers: {
                            'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                        },
                        method: 'PATCH',
                        url: url,
                        data: {jsonData:JSON.stringify(_data)}
                    })
                        .success(function(data,status,headers,config){
                            if(data.status===true){
                                resolve(data.data);
                            } else {
                                reject(data);
                            }
                        })
                        .error(function(data,status,headers,config){
                            reject(data);
                        });
                });
            }
        },
        device: {
            register: function(device, tokenID, userReferenceID) {
                var url = 'http://201.201.150.159/devicetoken/kenuu/a59f70a0-ea15-11e4-9c0e-237f667d4c49/register';
                return new Promise(function(resolve,reject){
                    var jsonData = 
                    {
                        jsonData: JSON.stringify({                            
                            device: {
                                email: userReferenceID,
                                uuid: tokenID,
                                platform: device.platform,
                                version: device.version,
                                model: device.model,
                                manufacturer: device.manufacturer                                
                            }
                        })
                    };

                    var options = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded'                            
                        },
                        url: url,
                        data: $.param(jsonData)
                    };

                    $http(options)
                        .success(function(data,status,headers,config){ 
                            if(data.status===true){
                                resolve(data);
                            } else {
                                reject(data);
                            }
                        })
                        .error(function(data,status,headers,cofig){
                            reject(data);
                        });           
                });
            }
        },
        search: {
            bytext: function(searchtext) {
                var url = serverURL + '/member/search?valueFilter=' + searchtext;
                return new Promise(function(resolve,reject){
                    $http({
                        headers: {
                            'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
                        },
                        method: 'GET',
                        url: url
                    })
                    .success(function(data,status,headers,config){
                        if(data.status===true){
                            resolve(data.data);
                        } else {
                            reject(data);
                        }
                    })
                    .error(function(data,status,headers,cofig){
                        reject(data);
                    });
                });
            }
        }
    };
}]);

fact.factory('userFactory',['restFactory', function(restFactory){
	var _user = {};
	var _login = {};
	var _data ={};
    var _signupstatus = 0; // 1= Already signed up, 0= New Sign Up, -1= Email exists, but no user created (sign up via plastic card)

	return {
        info: {
            get: function(newData,userID){
                return new Promise(function(resolve,reject){
                    if(newData===true){
                        restFactory.user.info.get(userID)
                            .then(function(response){
                                _user = response;
                                resolve(response);
                            })
                            .catch(function(err){
                                reject(err);
                            });
                    } else {
                        if(_user.Email){
                            resolve(_user);
                        } else {
                            restFactory.user.info.get(userID)
                                .then(function(response){
                                    _user = response;
                                    resolve(response);
                                })
                                .catch(function(err){
                                    reject(err);
                                });
                        }
                    }
                });
            },
            update: function(_data) {
                return new Promise(function(resolve, reject){
                    restFactory.user.info.update(_data)
                        .then(function(response){
                            resolve(response);
                        })
                        .catch(function(err){
                            reject(err);
                        });
                });
            },
            updateAvatar: function(_imagedata) {
                return new Promise(function(resolve, reject){
                    restFactory.user.info.updateAvatar(_imagedata)
                        .then(function(response){
                            resolve(response);
                        })
                        .catch(function(err){
                            reject(err);
                        });     
                });
            },
            signupstatus: {
                set: function(statusCode) {
                    _signupstatus = statusCode;
                },
                get: function() {
                    return _signupstatus;
                }
            }
        },
        activity: {
            all: function() {
                return new Promise(function(resolve,reject){
                    restFactory.user.activity.all.get()
                        .then(function(response){
                            resolve(response);
                        })
                        .catch(function(err){
                            reject(err);
                        })
                });
            },
            visits: {
                // _data:
                // --------------------------
                // entityID     = 1
                // subEntityID  = 5
                // rangeDate    = A
                // typeFilter   =
                // valueFilter  =
                // paging       = false
                // pageNum      = 0
                // tokenID      = 1
                // --------------------------
                general: function(_data){
                    return new Promise(function(resolve,reject){
                        restFactory.user.activity.visits.get(_data)
                            .then(function(response){
                                resolve(response);
                            })
                            .catch(function(err){
                                reject(err);
                            });
                    });
                },
                commerce: function(){
                    return new Promise(function(resolve,reject){
                        restFactory.user.activity.visits.commerce.get()
                            .then(function(response){
                                resolve(response);
                            })
                            .catch(function(err){
                                reject(err);
                            });
                    });
                },
                stores: function(userID){
                    return new Promise(function(resolve,reject){
                        restFactory.user.activity.visits.stores.get(userID)
                            .then(function(response){
                                resolve(response);
                            })
                            .catch(function(err){
                                reject(err);
                            });
                    });
                }
            },
            redemptions: {
                general: function(_data){
                    return new Promise(function(resolve,reject){
                        restFactory.user.activity.redemptions.get(_data)
                            .then(function(response){
                                resolve(response);
                            })
                            .catch(function(err){
                                reject(err);
                            });
                    });
                }
            }
        },
        session: {
            logout: function() {
                localStorage.clear();
                _user = {};
                _login = {};
                _data ={};
            },
            login: function(_data) {
                return new Promise(function(resolve,reject){
                    restFactory.user.login(_data)
                        .then(function(response){
                            resolve(response);
                        })
                        .catch(function(err){
                            reject(err);
                        });
                });
            },
            signup: function(_data){
                return new Promise(function(resolve, reject){
                    restFactory.user.signup(_data)
                        .then(function(response){
                            resolve(response);
                        })
                        .catch(function(err){
                            reject(err);
                        });     
                });
            },
            passwordrecovery: function(email) {
               return new Promise(function(resolve, reject){
                    restFactory.user.passwordrecovery(email)
                        .then(function(response){
                            resolve(response);
                        })
                        .catch(function(err){
                            reject(err);
                        });     
                }); 
            }
        },
        datavalidation: {
            emailvalidation: function(email){
                return new Promise(function(resolve,reject){
                    restFactory.user.validateEmail(email)
                        .then(function(response){
                            resolve(response);
                        })
                        .catch(function(err){
                            reject(err);
                        });
                });
            }
        }
	};
}]);

fact.factory('commerceFactory', ['restFactory', function(restFactory){
    var _selectedCommerce = {};
    var _thereIsACommerceSelected = false;

    function storeInLocalStorage(varName, value) {
        localStorage.setItem(varName, JSON.stringify(value));
    }
    function getFromLocalStorage(varName, defaultVal) {
        var _value = localStorage.getItem(varName);
        if (_value === undefined)
        {
            return defaultVal;
        }
        else
        {
            return JSON.parse(_value);
        }
    }

    return {
        selectedCommerce: {
            set: function(commerce) {
                //storeInLocalStorage('selectedCommerce', commerce);
                _thereIsACommerceSelected = true;
                _selectedCommerce = commerce;
            },
            clearSelection: function() {
                _selectedCommerce = {};
                _thereIsACommerceSelected = false;
            },
            get: function() {
                // var retVal = getFromLocalStorage('selectedCommerce', _selectedCommerce);
                // return retVal;
                return _selectedCommerce;
            },
            isSelected: function() {
                return _thereIsACommerceSelected;
            }
        },
        general: function(userID){
            return new Promise(function(resolve,reject){
                restFactory.commerce.get(userID)
                    .then(function(response){
                        resolve(response);
                    })
                    .catch(function(err){
                        reject(err);
                    });
            });
        },
        get: function(entityID) {
            return new Promise(function(resolve, reject){
                restFactory.commerce.get(entityID)
                    .then(function(response){
                        resolve(response);
                    })
                    .catch(function(err){
                        reject(err);
                    })
            });
        },
        stores: {
            general: function(entityID){
                return new Promise(function(resolve,reject){
                    restFactory.commerce.stores.get(entityID)
                        .then(function(response){
                            resolve(response);
                        })
                        .catch(function(err){
                            reject(err);
                        });
                });
            },
            nearby: function(entityID,long,lat,page,kilometers){
                return new Promise(function(resolve,reject){
                    restFactory.commerce.stores.nearby(entityID,long,lat,page,kilometers)
                        .then(function(response){
                            resolve(response);
                        })
                        .catch(function(err){
                            reject(err);
                        });
                });
            }
        },
        store: {
            get: function(subEntityID) {
                return new Promise(function(resolve,reject){
                    restFactory.store.get(subEntityID)
                        .then(function(response){
                            resolve(response);
                        })
                        .catch(function(err){
                            reject(err);
                        });
                });
            }
        }
    };
}]);

fact.factory('storeFactory', [function(){
    var _selectedStore = {};
    return {
        selectedStore: {
            set: function(store) {
                _selectedStore = store;
            },
            get: function() {
                return _selectedStore;
            },
            clearSelection: function() {
                _selectedStore = {};
            }
        }
    }
}]);

fact.factory('rewardFactory', ['restFactory', function(restFactory){
    var _rewards = null;
    var _selectedReward = {};

    function storeInLocalStorage(varName, value) {
        localStorage.setItem(varName, JSON.stringify(value));
    };

    function getFromLocalStorage(varName, defaultVal) {
        var _value = localStorage.getItem(varName);
        if (_value === undefined)
        {
            return defaultVal;
        }
        else
        {
            return JSON.parse(_value);
        }
    };

    return {
        selectedReward: {
            set: function(reward) {
                // storeInLocalStorage('selectedReward', reward);
                _selectedReward = reward;
            },
            get: function() {
                // var retVal = getFromLocalStorage('selectedReward', _selectedReward);
                // return retVal;
                return _selectedReward;
            }
        },
        active: {
            general: function(newData, entityID, subEntityID){
                return new Promise(function(resolve,reject){
                    if(newData===true){
                        restFactory.reward.active.get(entityID, subEntityID)
                            .then(function(response){
                                _rewards = response;
                                resolve(response);
                            })
                            .catch(function(err){
                                reject(err);
                            });
                        
                    } else {
                        if(!_rewards){
                            restFactory.reward.active.get(entityID)
                                .then(function(response){
                                    _rewards = response;
                                    resolve(response);
                                })
                                .catch(function(err){
                                    reject(err);
                                });
                        } else {
                            resolve(_rewards);
                        }
                    }
                });
            },
            store: {
                general: function(_data){
                    return new Promise(function(resolve,reject){
                        restFactory.reward.active.store.get(_data)
                            .then(function(response){
                                resolve(response);
                            })
                            .catch(function(err){
                                reject(err);
                            });
                    });
                }
            }
        }
    };
}]);

fact.factory('socialFactory', ['restFactory', function(restFactory){
    return {
        general: function(_data){
            return new Promise(function(resolve,reject){
                restFactory.social.get(_data)
                    .then(function(response){
                        resolve(response);
                    })
                    .catch(function(err){
                        reject(err);
                    });
            });
        },
        add: function(_data){
            return new Promise(function(resolve,reject){
                restFactory.social.post(_data)
                    .then(function(response){
                        resolve(response);
                    })
                    .catch(function(err){
                        reject(err);
                    });
            });
        },
        update: function(_data){
            return new Promise(function(resolve,reject){
                restFactory.social.patch(_data)
                    .then(function(response){
                        resolve(response);
                    })
                    .catch(function(err){
                        reject(err);
                    });
            });
        }
    };
}]);

fact.factory('beaconsFactory', [function(){
    return {
        beacons: {
            get: function() {
                return new Promise(function(resolve,reject){
                    resolve(
                        [
                            {
                                uuid: 'A77A1B68-49A7-4DBF-914C-760D07FBB87B',
                                identifier: 'Tienda #1'
                            }
                        ]
                    );
                });
            }
        }
    };
}]);

fact.factory('searchFactory', ['restFactory', function(restFactory){
    return {
        doSearch: function(searchtext) {
            return new Promise(function(resolve,reject){
                restFactory.search.bytext(searchtext).
                    then(function(data){
                        resolve(data);
                    })
                    .catch(function(err){
                        reject(err);
                    })
            });
        }
    }
}]);

fact.factory('navigationFactory', [function(){
    var storesState         = "tab.nearme-commercestores"; 
    var commerceState       = "tab.nearme-commerce";
    var storeState         = "tab.nearme-storedetail";

    return {
        setDefaults: function() {
            storesState         = "tab.nearme-commercestores"; 
            commerceState       = "tab.nearme-commerce";
            storeState          = "tab.nearme-storedetail";
        },
        commerce: {
            setTab: function(stateName) {
                commerceState = stateName;
            },
            get: function() {
                return commerceState;
            }
        },
        stores: {
            setTab: function(stateName) {
                storesState = stateName;
            },
            get: function() {
                return storesState;
            }
        },
        store: {
            setTab: function(stateName) {
                storeState = stateName;
            },
            get: function() {
                return storeState;
            }  
        }
    }
}]);

fact.factory('loginSignUpFactory', [function(){
    var _loginInfo = {
        email: ""
    };
    return {
        login: {
            get: function() {
                return _loginInfo;
            },
            email: {
                set: function(_email) {
                    _loginInfo.email = _email;
                },
                get: function() {
                    return _loginInfo.email;
                }
            }            
        }
    };
}]);

fact.factory('codeScannerFactory', ['$cordovaBarcodeScanner', function($cordovaBarcodeScanner){
    var _storedCodes = [];
    return {
        scan: function() {
            return new Promise(function(resolve,reject){
                $cordovaBarcodeScanner
                .scan()
                .then(function(barcodeData) {
                    // Success! Barcode data is here            
                    if (barcodeData.cancelled == 0)
                    {
                        // Scanned
                        _storedCodes.push({code:code});

                        // TODO: Process the Scanned Code

                        resolve(code);
                    }
                    else
                    {
                        // Cancelled
                        resolve("");
                    }
                }, function(error) {
                    // Error     
                    reject(error);               
                });
            });
        },
        codes: {
            add: function(code) {
                _storedCodes.push({code:code});
            },
            get: function() {
                return _storedCodes;
            }
        }
    };
}]);

fact.factory('locationFactory', [function(){
    var _location = {
        lat: 0,
        long: 0,
        isSet: false
    };

    return {
        location: {
            set: function(lat, long) {
                _location.lat = lat;
                _location.long = long;
                _location.isSet = true;
            },
            get: function() {
                return _location;
            }
        }
    };
}]);

fact.factory('appVersionFactory', ['$cordovaAppVersion', function($cordovaAppVersion) {
    var _appVersion = 'N/A';
    return {
        appVersion: {
            set: function() {
                $cordovaAppVersion.getAppVersion().then(
                    function (version) 
                    {
                        _appVersion = version;
                    }
                );
            },
            get: function() {
                return _appVersion;
            }
        }
    };
}]);

fact.factory('SQLiteFactory', ['$cordovaSQLite', function($cordovaSQLite){
    return {
        db: {
            userReferenceID: {
                save: function(_userReferenceID) {
                    return new Promise(function(resolve,reject){
                        // for opening a background db:
                        var db = $cordovaSQLite.openDB({ name: "profile.db", bgType: 1 });

                        $scope.execute = function() {
                            var query = "INSERT INTO profile_data (key, value) VALUES (?, ?)";
                            $cordovaSQLite.execute(db, query, ['userReferenceID', _userReferenceID]).then(function(res) {
                                // console.log("insertId: " + res.insertId);
                                resolve();
                            }, function (err) {
                                // console.error(err);
                                reject();
                            });
                        }
                    });
                },
                get: function() {
                    return new Promise(function(resolve,reject){
                        // for opening a background db:
                        var db = $cordovaSQLite.openDB({ name: "profile.db", bgType: 1 });

                        $scope.execute = function() {
                            var query = "SELECT FROM profile_data WHERE key = 'userReferenceID'";
                            $cordovaSQLite.execute(db, query).then(function(res){
                                console.log(res);
                                resolve();
                            }, function(err) {
                                console.log(err);
                                reject();
                            });
                        }
                    });
                }
            }
        }
    };
}]);

fact.factory('referenceIDFactory', ['SQLiteFactory', function(SQLiteFactory){
    var _userReferenceId = "";

    function GetRefID() {
        var id = localStorage.getItem("userReferenceID");
        if (id === undefined) return _userReferenceId;
        else
        {
            _userReferenceId = id;
            return _userReferenceId;
        }
    };

    function SetRefID(id) {
        localStorage.setItem("userReferenceID", id);
        _userReferenceId = id;
    };

    return {
        setReferenceID: function(id) {
            SetRefID(id);
        },
        getReferenceID: function() {
            return GetRefID();
        }
    }
}]);


