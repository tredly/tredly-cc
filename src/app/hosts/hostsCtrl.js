(function() {

'use strict';

angular
    .module('tredly.app')
    .controller('HostsCtrl', HostsCtrl);

function HostsCtrl ($scope, $q, tredlyConnection, tredlyApi) {
    var vm = this;

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

    function refresh () {
        vm.loaded = false;
        vm.hosts = tredlyConnection.getConnections(true);

        if (vm.canceler) {
            vm.canceler.resolve();
            vm.canceler = null;
        }

        vm.canceler = $q.defer();

        var promises = [];

        angular.forEach(vm.hosts, function (host) {

            host.active = null;
            host.partitionCount = '~';
            host.containerCount = '~';

            promises.push(
                tredlyApi.get(host.host, '/list/partitions',
                    null, null, { timeout: vm.canceler.promise }).then(function (partitions) {
                    host.active = true;
                    host.partitionCount = partitions.length || 0;
                    host.containerCount = 0;
                    angular.forEach(partitions, function (partition) {
                        host.containerCount += parseInt(partition.Containers) || 0;
                    });
                }, function () {
                    host.active = false;
                })
            );

            host.apiVersion = '~';
            host.uptime = 0;
            host.uptimeInfo = '~ minutes uptime';

            promises.push(
                tredlyApi.get(host.host, '/view/info',
                    null, null, { timeout: vm.canceler.promise }).then(function (info) {
                    host.apiVersion = info[0] && info[0].ApiVersion || '~';
                    host.uptime = info[0] && info[0].Uptime || 0;
                    host.uptimeInfo = getUptimeInfo(host.uptime);
                }, function () {

                })
            );
        });

        $q.all(promises).then(function () {

        });

        vm.loaded = true;
    }

    function getUptimeInfo (uptimeSeconds) {

        var diff = Math.floor(uptimeSeconds / 60);

        if (diff <= 1) {
            return 'Started a moment ago';
        }

        if (diff < 60) {
            return diff + ' minutes uptime';
        }

        diff = Math.floor(diff / 60);

        if (diff === 1) {
            return '1 hour uptime';
        }

        if (diff < 24) {
            return diff + ' hours uptime';
        }

        diff = Math.floor(diff / 24);

        if (diff === 1) {
            return '1 day uptime';
        }

        if (diff < 30) {
            return diff + ' days uptime';
        }

        diff = Math.floor(diff / 30);

        if (diff === 1) {
            return '1 month uptime';
        }

        if (diff < 12) {
            return diff + ' months uptime';
        }

        diff = Math.floor(diff / 12);

        if (diff === 1) {
            return '1 year uptime';
        }

        return diff + ' years uptime';
    }

}

})();
