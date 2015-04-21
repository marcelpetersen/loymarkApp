var fact = angular.module('kenuu.factory', []);

fact.factory('referenceIDFactory', [function(){
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

fact.factory('deviceFactory', ['$cordovaDevice', function($cordovaDevice){
    var _device = {};
    var _platform = "";
    var _errormessage = "";
    var _uuid = "";

    return {
        device: {
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
            registerdevice: function() {
                return true;
            }
        }
    }
}]);

fact.factory('restFactory', ['$http', 'ApiEndpoint', 'referenceIDFactory', function($http, ApiEndpoint, referenceIDFactory){
    var serverURL = ApiEndpoint.url;
    // var serverURL = 'http://201.201.150.159';
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
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'authorization': 'Basic ' + referenceIDFactory.getReferenceID()
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
                })
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
                get: function(userID, entityID){
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
                }
            }
        },
        reward:{
            active: {
                get: function(){
                    var url = serverURL + '/reward/active';
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
        }
    }
}]);

fact.factory('userFactory',[ 'restFactory', function(restFactory){
	var _user = {};
	var _login = {};
	var _data ={};

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
                commerce: function(userID){
                    return new Promise(function(resolve,reject){
                        restFactory.user.activity.visits.commerce.get(userID)
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
            }
        }
	};
}]);

fact.factory('commerceFactory', ['restFactory', function(restFactory){
    var _selectedCommerce = {};
    var _thereIsACommerceSelected = false;
    
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
            general: function(userID, entityID){
                return new Promise(function(resolve,reject){
                    restFactory.commerce.stores.get(userID, entityID)
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
            general: function(newData){
                return new Promise(function(resolve,reject){
                    if(newData===true){
                        restFactory.reward.active.get()
                            .then(function(response){
                                _rewards = response;
                                resolve(response);
                            })
                            .catch(function(err){
                                reject(err);
                            });
                        
                    } else {
                        if(!_rewards){
                            restFactory.reward.active.get()
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