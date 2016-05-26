(function() {

'use strict';

angular
    .module('tredly.app')
    .controller('PartitionsCtrl', PartitionsCtrl);

function PartitionsCtrl ($scope, $stateParams, $q, $filter, tredlyConnection, tredlyApi) {
    var vm = this;

    if ($stateParams.filter) {
        filter($stateParams.host || '', true, true);
    }

    vm.filter = filter;
    vm.refresh = refresh;

    $scope.$on('refreshContent', function() {
        refresh();
    });

    $scope.$on('$destroy', function() {
        if (vm.canceler) {
            vm.canceler.resolve();
            vm.canceler = null;
        }
    });

    refresh();

    function filter (param, add, silent) {
        if (!add) {
            vm.host = null;
        } else {
            vm.host = {
                host: param
            }
        }

        if (!silent) {
            refresh();
        }
    }

    function refresh () {
        vm.loaded = false;

        vm.hosts = tredlyConnection.getConnections(true);
        vm.hosts = $filter('orderBy')(vm.hosts, '+name');

        vm.partitions = [];

        if (vm.canceler) {
            vm.canceler.resolve();
            vm.canceler = null;
        }

        vm.canceler = $q.defer();

        var promises = [];
        var hostFilter = false;

        angular.forEach(vm.hosts, function (host) {
            if (vm.host && vm.host.host === host.host) {
                angular.extend(vm.host, host);
                hostFilter = true;
            }
        });

        var hosts = vm.hosts;

        if (!hostFilter) {
            vm.host = null;
        } else {
            hosts = [vm.host];
        }

        angular.forEach(hosts, function (host) {

            promises.push(
                tredlyApi.get(host.host, '/list/partitions',
                    null, null, { timeout: vm.canceler.promise }).then(function (partitions) {
                    angular.forEach(partitions, function (partition) {
                        vm.partitions.push(angular.extend(partition, {
                            host: host,
                            HostName: host.name
                        }));
                    });
                    vm.loaded = true;
                }, function () {

                })
            );
        });



        $q.all(promises).then(function () {
            vm.loaded = true;
        });
    }

}

})();
