(function() {

'use strict';

angular
    .module('tredly.lib.core')
    .filter('terminal', terminal);

function terminal () {
    return function format (data) {
        var classes = [];

        if (/\u001b\[1m/igm.test(data)) {
            classes.push('fw-bold');
        }

        if (/\u001b\[31[0-9\;]*m/igm.test(data)) {
            classes.push('c-red');
        } else if (/\u001b\[32[0-9\;]*m/igm.test(data)) {
            classes.push('c-green');
        } else if (/\u001b\[35[0-9\;]*m/igm.test(data)) {
            classes.push('c-purple');
        } else if (/\u001b\[38[0-9\;]*m/igm.test(data)) {
            classes.push('c-orange');
        }

        data = data.replace(/\u001b\[[0-9\;]+m/igm, '');
        data = data.replace(/\r/igm, '');

        data = data.split(/(?:<br\/>|<br>|\n)/igm);

        angular.forEach(data, function (val, i) {
            data[i] = val.replace(/./igm, function(s) {
                return '&#' + s.charCodeAt(0) + ';';
            });
        });

        data = data.join('<br>');


        if (classes.length) {
            data = '<span class="' + classes.join(' ') + '">' + data + '</span>';
        }

        return data;
    };
}

})();
