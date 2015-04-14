var fact = angular.module('kenuu.factory', []);

fact.factory('restFactory', ['$http', function($http){
    var serverURL = 'http://201.201.150.159';
    return {
        user:{
            info:{
                get: function(userID){
                    var url = serverURL + '/member/info';
                    return new Promise(function(resolve,reject){
                        $http({
                            method: 'GET',
                            url: url,
                            params: {
                                tokenID: userID
                            }
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
                visits:{
                    get: function(_data){
                        var url = serverURL + '/member/activity/visits';
                        return new Promise(function(resolve,reject){
                            $http({
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
                        get: function(userID){
                            var url = serverURL + '/member/activity/visits/commerce';
                            return new Promise(function(resolve,reject){
                                $http({
                                    method: 'GET',
                                    url: url,
                                    params: {
                                        tokenID: userID
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
                    },
                    stores:{
                        get: function(userID){
                            var url = serverURL + '/member/activity/visits/stores';
                            return new Promise(function(resolve,reject){
                                $http({
                                    method: 'GET',
                                    url: url,
                                    params: {
                                        tokenID: userID
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
                }
            },
            redemptions:{
                get: function(_data){
                    var url = serverURL + '/member/activity/redemptions';
                    return new Promise(function(resolve,reject){
                        $http({
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
                            .error(function(data,status,headers,cofig){
                                reject(data);
                            });
                    });
                }
            }
        },
        commerce:{
            get: function(userID){
                var url = serverURL + '/commerce';
                return new Promise(function(resolve,reject){
                    $http({
                        method: 'GET',
                        url: url,
                        params: {
                            tokenID: userID
                        }
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
                            method: 'GET',
                            url: url,
                            params: {
                                tokenID: userID,
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
                get: function(_data){
                    var url = serverURL + '/reward/active';
                    return new Promise(function(resolve,reject){
                        $http({
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
                store:{
                    get: function(_data){
                        var url = serverURL + '/reward/active/store';
                        return new Promise(function(resolve,reject){
                            $http({
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
                storeInLocalStorage('selectedCommerce', commerce);
                _thereIsACommerceSelected = true;
                _selectedCommerce = commerce;
            },
            clearSelection: function() {
                _selectedCommerce = {};
                _thereIsACommerceSelected = false;
            },
            get: function() {
                var retVal = getFromLocalStorage('selectedCommerce', _selectedCommerce);
                return retVal;
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
                storeInLocalStorage('selectedReward', reward);
                _selectedReward = reward;
            },
            get: function() {
                var retVal = getFromLocalStorage('selectedReward', _selectedReward);
                return retVal;
            }
        },
        active: {
            general: function(newData,_data){
                return new Promise(function(resolve,reject){
                    if(newData===true){
                        restFactory.reward.active.get(_data)
                            .then(function(response){
                                _rewards = response;
                                resolve(response);
                            })
                            .catch(function(err){
                                reject(err);
                            });
                        
                    } else {
                        if(!_rewards){
                            restFactory.reward.active.get(_data)
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