(function() {

'use strict';

angular
    .module('tredly.lib.core')
    .provider('tredlyStorage', tredlyStorageProvider);

function tredlyStorageProvider () {

    var config = {
        storage: 'local'
    };

    return {
        config: function (options) {
            if (!options) {
                return angular.extend({}, config);
            }
            angular.extend(config, options);
        },
        $get: function ($window) {
            var store = null;

            switch (config.storage) {
                case 'local':
                    store = $window.localStorage;
                    break;
                case 'session':
                    store = $window.sessionStorage;
                    break;
                case 'custom':
                    store = {};
                    break;
                default:
                    store = $window.localStorage;
                    config.storage = 'local';
                    break;
            }

            return {
                getItem: getItem,
                setItem: setItem,
                removeItem: removeItem
            };

            function getItem(key) {
                return store.getItem(key);
            }

            function setItem(key, value) {
                if (value) {
                    store.setItem(key, value);
                } else {
                    store.removeItem(key);
                }
            }

            function removeItem(key) {
                store.removeItem(key);
            }
        }
    };
}

})();
