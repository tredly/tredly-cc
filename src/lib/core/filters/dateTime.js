(function() {

'use strict';

angular
    .module('tredly.lib.core')
    .filter('dateTime', dateTime);

function dateTime ($filter, tredlyDateTime) {
    return function(date, options) {
        options = options || {};

        var format = tredlyDateTime.prepareMomentFormat(options.minView, options.maxView, options.shortFormat);

        return $filter('amDateFormat')(date, format);
    };
}

})();
