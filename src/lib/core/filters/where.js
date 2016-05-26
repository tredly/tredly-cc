(function() {

'use strict';

angular
    .module('tredly.lib.core')
    .filter('where', where);

function where () {
    return function (list, config) {
        var stats = {};

        if (config.scope && config.stats) {
            config.scope[config.stats] = config.scope[config.stats] || {};
            stats = config.scope[config.stats];
        }

        stats.count = 0;

        function getObjectValue (obj, field) {
            var attrs = field.split('.');
            for (var i = 0; i < attrs.length; ++i) {
                if (angular.isArray(obj) && obj.map) {
                    return obj.map(function (element) {
                        return getObjectValue(element, attrs.slice(i, attrs.length).join('.'));
                    }).join(' ');
                }

                obj = obj[attrs[i]];
                if (!obj) {
                    return '';
                }
            }
            return obj || '';
        }

        return (list || []).filter(function (obj) {
            var result = false;

            if (angular.isFunction(config.query)) {

                result = config.query(obj);

            } else {

                var query = angular.lowercase(config.query || '');

                if (!config.fields || !config.fields.length) {
                    result = true;
                } else {
                    angular.forEach(config.fields, function (field) {
                        if (result) {
                            return;
                        }

                        var calcField = [];

                        if (angular.isObject(field)) {

                            angular.forEach(field.expression, function (field) {
                                var val = getObjectValue(obj, field);
                                if (val) {
                                    calcField.push(angular.lowercase(val));
                                }
                            });

                            calcField = calcField.join(field.join);
                        } else {
                            calcField = angular.lowercase(getObjectValue(obj, field) || '');
                        }

                        if (!query || field && calcField.indexOf(query) >= 0) {
                            result = true;
                        }
                    });
                }
            }

            stats.count += result ? 1 : 0;

            return result;
        } );
    };
}

})();
