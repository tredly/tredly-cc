(function() {

'use strict';

angular
    .module('tredly.lib.core')
    .filter('timeAgo', timeAgo);

function timeAgo () {
    return function(date, options) {
        if (angular.isString(date)) {
            date = new Date(date);
        } else if (!angular.isDate(date)) {
            date = null;
        }

        var diff = date ? Math.floor((new Date() - date) / 1000) : 0;

        var days = Math.floor(diff / 86400);
        var daysPlus = diff % 86400;

        var hours = Math.floor(daysPlus / 3600);
        var hoursPlus = daysPlus % 3600;

        var minutes = Math.floor(hoursPlus / 60);
        var seconds = hoursPlus % 60;

        days = days > 9 ? days.toString() : '0' + days;
        hours = hours > 9 ? hours.toString() : '0' + hours;
        minutes = minutes > 9 ? minutes.toString() : '0' + minutes;
        seconds = seconds > 9 ? seconds.toString() : '0' + seconds;

        return days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's ';
    };
}

})();
