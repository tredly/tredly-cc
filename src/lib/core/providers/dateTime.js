(function() {

'use strict';

angular
    .module('tredly.lib.core')
    .provider('tredlyDateTime', tredlyDateTimeProvider);

function tredlyDateTimeProvider () {

    var config = {
        currentFormat: guessCountry()
    };

    return {
        config: function (options) {
            if (!options) {
                return angular.extend({}, config);
            }
            angular.extend(config, options);
        },
        $get: function ($window) {

            return {
                prepareMomentFormat: prepareMomentFormat,
                getDateTimeFormat: getDateTimeFormat,
                setDateTimeFormat: setDateTimeFormat
            };

            function prepareMomentFormat(minView, maxView, shortFormat, placehlder) {
                var usStyle = (config.currentFormat === 2);
                switch (maxView) {
                    case 'month':
                        switch (minView) {
                            case 'year':
                            case 'month':
                                if (placehlder) {
                                    return 'Month';
                                }
                                return shortFormat ? 'MM' : 'MMM';
                            case 'date':
                                if (placehlder) {
                                    return usStyle ? 'Month Day' : 'Day Month';
                                }
                                return usStyle ? (shortFormat ? 'MM/D' : 'MMM D') : (shortFormat ? 'D/MM' : 'D MMM');
                            case 'hours':
                                if (placehlder) {
                                    return usStyle ? 'Month Day Time' : 'Day Month Time';
                                }
                                return usStyle ? (shortFormat ? 'MM/D hh A' : 'MMM D hh A') : (shortFormat ? 'D/MM hh A' : 'D MMM hh A');
                            default: // minutes
                                if (placehlder) {
                                    return usStyle ? 'Month Day Time' : 'Day Month Time';
                                }
                                return usStyle ? (shortFormat ? 'MM/D hh:mm A' : 'MMM D hh:mm A') : (shortFormat ? 'D/MM hh:mm A' : 'D MMM hh:mm A');
                        }
                        break;
                    case 'date':
                        switch (minView) {
                            case 'year':
                            case 'month':
                            case 'date':
                                if (placehlder) {
                                    return 'Day';
                                }
                                return 'D';
                            case 'hours':
                                if (placehlder) {
                                    return 'Day Time';
                                }
                                return 'D hh A';
                            default: // minutes
                                if (placehlder) {
                                    return 'Day Time';
                                }
                                return 'D hh:mm A';
                        }
                        break;
                    case 'hours':
                        switch (minView) {
                            case 'year':
                            case 'month':
                            case 'date':
                            case 'hours':
                                if (placehlder) {
                                    return 'Time';
                                }
                                return 'hh A';
                            default: // minutes
                                if (placehlder) {
                                    return 'Time';
                                }
                                return 'hh:mm A';
                        }
                        break;
                    case 'minutes':
                        switch (minView) {
                            case 'year':
                            case 'month':
                            case 'date':
                            case 'hours':
                            default: // minutes
                                if (placehlder) {
                                    return 'Time';
                                }
                                return 'mm';
                        }
                        break;
                    default: //year
                        switch (minView) {
                            case 'year':
                                if (placehlder) {
                                    return 'Year';
                                }
                                return 'YYYY';
                            case 'month':
                                if (placehlder) {
                                    return 'Month Year';
                                }
                                return shortFormat ? 'MM/YYYY' : 'MMM YYYY';
                            case 'date':
                                if (placehlder) {
                                    return usStyle ? 'Month Day Year' : 'Day Month Year';
                                }
                                return usStyle ? (shortFormat ? 'MM/D/YYYY' : 'MMM D, YYYY') : (shortFormat ? 'D/MM/YYYY' : 'D MMM YYYY');
                            case 'hours':
                                if (placehlder) {
                                    return usStyle ? 'Month Day Year Time' : 'Day Month Year Time';
                                }
                                return usStyle ? (shortFormat ? 'MM/D/YYYY hh A' : 'MMM D, YYYY hh A') : (shortFormat ? 'D/MM/YYYY hh A' : 'D MMM YYYY hh A');
                            default: // minutes
                                if (placehlder) {
                                    return usStyle ? 'Month Day Year Time' : 'Day Month Year Time';
                                }
                                return usStyle ? (shortFormat ? 'MM/D/YYYY hh:mm A' : 'MMM D, YYYY hh:mm A') : (shortFormat ? 'D/MM/YYYY hh:mm A' : 'D MMM YYYY hh:mm A');
                        }
                        break;
                }
            }

            function getDateTimeFormat() {
                return config.currentFormat;
            }

            function setDateTimeFormat(format) {
                config.currentFormat = format || config.currentFormat;
            }
        }
    };


    function guessCountry () {
        var currentCountry = 2; // 1 - AU/UK/NZ, 2 - US

        var dateObject = new Date();
        var timeOffset = - dateObject.getTimezoneOffset() / 60;

        if (timeOffset > -3) {
            currentCountry = 1;
        }

        return currentCountry;
    }
}


})();
