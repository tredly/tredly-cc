(function() {

'use strict';

angular
    .module('tredly.app', [

    ])
    .config(routes)
    .config(animations)
    .config(loadinBar)
    .controller('AppCtrl', AppCtrl);

function routes($locationProvider, $stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider) {

    $locationProvider.html5Mode(true);
    $urlMatcherFactoryProvider.strictMode(false);

    $urlRouterProvider
        .when('/', '/hosts')
        .otherwise('/hosts');

    $stateProvider
        .state('app', {
            url: '',
            templateUrl: '/app/index.html',
            controller: 'AppCtrl as vm'
        })
        .state('app.hosts', {
            url: '/hosts',
            templateUrl: '/app/hosts/index.html',
            controller: 'HostsCtrl as vm'
        })
        .state('app.partitions', {
            url: '/partitions',
            templateUrl: '/app/partitions/index.html',
            controller: 'PartitionsCtrl as vm',
            params: {
                filter: null,
                host: null
            }
        })
        .state('app.containers', {
            url: '/containers',
            templateUrl: '/app/containers/index.html',
            controller: 'ContainersCtrl as vm',
            params: {
                filter: null,
                host: null,
                partition: null
            }
        });
}

function animations($animateProvider) {

    $animateProvider.classNameFilter(/^(?:(?!ng-animate-disabled).)*$/);
}

function loadinBar(cfpLoadingBarProvider) {

    cfpLoadingBarProvider.includeSpinner = false;
}

function AppCtrl ($scope, $rootScope, $state, tredlyConnection) {
    var vm = this;

    var profile = {
        name: 'Main Host',
        actions: [
            {
                name: 'Connect',
                handler: function () {
                    $rootScope.$broadcast('tredlyModalOpen', {
                        template: '/modals/connect/index.html',
                        data: {
                            mainHost: true
                        }
                    });
                }
            }
        ]
    };

    $scope.$on('refreshContent', function() {
        refresh();
    });

    refresh();

    function refresh () {

        vm.profile = profile;

        var hosts = tredlyConnection.getConnections(true);
        var profileFound = false;

        angular.forEach(hosts, function (host) {
            if (!profileFound && host.profile && host.host === '') {
                vm.profile = angular.extend({
                    actions: [
                        {
                            name: 'Disconnect',
                            handler: function () {
                                tredlyConnection.disconnectMain();
                                vm.profile = profile;
                                $state.go('app.hosts');
                                $rootScope.$broadcast('refreshContent');
                            }
                        }
                    ]
                }, host.profile);

                profileFound = true;
            }
        });
    }
}

})();
