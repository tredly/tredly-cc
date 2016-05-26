(function() {

'use strict';

angular
    .module('tredly.lib.core')
    .decorator('$xhrFactory', tredlyXhrDecorator)
    .provider('tredlyConnection', tredlyConnectionProvider)
    .provider('tredlyApi', tredlyApiProvider);

function tredlyXhrDecorator ($delegate, $rootScope) {
    'ngInject';

    return function(method, url) {
        var xhr = $delegate(method, url);

        xhr.setRequestHeader = (function (sup) {
            return function (header, value) {
                if (header === '__XHR__' && angular.isFunction(value)) {
                    value(this);
                } else {
                    sup.apply(this, arguments);
                }
            };
        })(xhr.setRequestHeader);

        return xhr;
    };
}

function tredlyConnectionProvider () {

    var config = {
        keyConnections: 'tredlyConnections'
    };

    return {
        config: function (options) {
            if (!options) {
                return angular.extend({}, config);
            }
            angular.extend(config, options);
        },
        $get: function ($q, $http, $filter, tredlyStorage) {

            return {
                getConnections: getConnections,
                getConnection: getConnection,
                setConnection: setConnection,
                connect: connect,
                disconnect: disconnect,
                disconnectAll: disconnectAll,
                disconnectMain: disconnectMain
            };

            function getConnections (array) {
                var connections = tredlyStorage.getItem(config.keyConnections);
                if (connections) {
                    connections = JSON.parse(connections);
                }
                if (array) {
                    array = [];
                    angular.forEach(connections, function (connection) {
                        array.push(connection);
                    });
                    connections = $filter('orderBy')(array, '+name');
                }
                return connections || {};
            }

            function getConnection (host) {
                var connections = getConnections();
                return connections[host];
            }

            function setConnection (connection) {
                var connections = getConnections();

                connections[connection.host] = angular.extend(connections[connection.host] || {}, connection);
                connections = JSON.stringify(connections);

                tredlyStorage.setItem(config.keyConnections, connections);

                return connection;
            }

            function connect (options, settings) {
                options = options || {};
                settings = settings || {};

                var connection = getConnection(options.host);

                function success (response) {
                    if (response.data && response.data.token) {
                        var newConnection = {
                            host: options.host,
                            name: options.name || connection.name || options.host,
                            token: response.data.token
                        };
                        if (options.username) {
                            newConnection.profile = {
                                name: options.username
                            };
                        }
                        return setConnection(newConnection);
                    }
                }

                if (options.username && options.password) {
                    return $http({
                        method: 'POST',
                        url: '/tredly/v1/auth/login',
                        ignoreLoadingBar: !!settings.ignoreLoadingBar,
                        timeout: settings.timeout,
                        headers: {
                            'x-tredly-api-host': options.host
                        },
                        data: {
                            username: options.username,
                            password: options.password,
                            permanent: true
                        }
                    }).then(success);
                } else if (connection) {
                    return $http({
                        method: 'POST',
                        url: '/tredly/v1/auth/refresh',
                        ignoreLoadingBar: !!settings.ignoreLoadingBar,
                        timeout: settings.timeout,
                        headers: {
                            'x-tredly-api-host': options.host
                        },
                        data: {
                            token: connection.token
                        }
                    }).then(success);
                } else {
                    return $q.resolve();
                }
            }

            function disconnect (options) {
                var connections = getConnections();

                var connection = connections[options.host];
                delete connections[options.host];
                connections = JSON.stringify(connections);

                tredlyStorage.setItem(config.keyConnections, connections);

                return connection;
            }

            function disconnectAll () {
                tredlyStorage.setItem(config.keyConnections, JSON.stringify({}));
            }

            function disconnectMain () {
                return disconnect({ host: '' });
            }

        }
    };
}

function tredlyApiProvider () {

    var config = {

    };

    return {
        config: function (options) {
            if (!options) {
                return angular.extend({}, config);
            }
            angular.extend(config, options);
        },
        $get: function ($http, tredlyConnection) {

            return {
                get: request.bind(null, 'GET'),
                post: request.bind(null, 'POST')
            };

            function request (method, host, url, data, progress, options) {

                options = options || {};

                url = '/tredly/v1' + url;

                var headers = {
                    'x-tredly-api-host': host
                };

                if (options.sessionId) {
                    headers['x-tredly-api-session'] = options.sessionId;
                }

                if (method === 'GET') {
                    headers.Accept = 'application/json';
                } else {
                    headers.Accept = 'text/plain';
                    headers['x-tredly-api-first-chunk-size'] = '1024';
                }

                if (options.plainTextBody) {
                    headers['Content-Type'] = 'text/plain';
                }

                return tredlyConnection.connect({
                    host: host
                }, options).then(function (connection) {

                    if (connection && connection.token) {
                        headers.Authorization = 'Bearer ' + connection.token;
                    }

                    if (progress) {
                        headers.__XHR__ = function() {
                            var index = 0;
                            return function (xhr) {
                                xhr.onprogress = function () {
                                    var textSoFar = xhr.responseText;
                                    var newText = textSoFar.substr(index);
                                    index = textSoFar.length;
                                    progress(newText);
                                };
                            };
                        };
                    }

                    return $http({
                        method: 'POST',
                        url: url,
                        headers: headers,
                        data: data,
                        ignoreLoadingBar: !!options.ignoreLoadingBar,
                        timeout: options.timeout
                    }).then(function (response) {
                        var data = response && response.data;
                        if (method === 'GET') {
                            data = data && data.data || data;
                        }
                        return data;
                    });
                });
            }
        }
    };
}

})();
