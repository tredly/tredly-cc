(function() {

'use strict';

angular
    .module('tredly.modals')
    .controller('ModalCreatePartitionCtrl', ModalCreatePartitionCtrl);

function ModalCreatePartitionCtrl ($scope, $rootScope, $state, $window, $filter, $q, $interval, tredlyConnection, tredlyApi) {
    var vm = this;

    vm.hosts = [];
    vm.partition = {};
    vm.partition.ipv4Whitelist = [];

    vm.saving = false;
    vm.consoleOutput = '';
    vm.consoleOutputEnd = '';

    vm.validate = validate;
    vm.refresh = refresh;
    vm.save = save;

    $scope.$on('$destroy', function() {
        if (vm.canceler) {
            vm.canceler.resolve();
            vm.canceler = null;
        }
    });

    load();

    function load () {
        vm.loaded = false;
        vm.loading = true;
        vm.hosts = [];

        var hosts = tredlyConnection.getConnections(true);

        if (vm.canceler) {
            vm.canceler.resolve();
            vm.canceler = null;
        }

        vm.canceler = $q.defer();

        var promises = [];

        angular.forEach(hosts, function (host) {
            promises.push(
                tredlyApi.get(host.host, '/list/partitions',
                    null, null, { timeout: vm.canceler.promise }).then(function (partitions) {
                    host.partitions = partitions;
                    vm.hosts.push(host);
                }, function () {

                })
            );
        });

        $q.all(promises).then(function () {
            vm.loading = false;
            vm.loaded = !!vm.hosts.length;
        });
    }

    function validate (mode) {
        return vm.saving || !vm.partition.Partition || !vm.partition.Host;
    }

    function refresh () {
        $state.go('app.partitions', {filter: true, host: vm.partition.Host.host});
        $rootScope.$broadcast('refreshContent');
    }

    function save () {
        if (vm.saving) {
            return;
        }

        vm.saving = true;

        var parameters = {};

        if (vm.partition.CPU) {
            parameters.CPU = vm.partition.CPU;
        }

        if (vm.partition.RAM) {
            parameters.RAM = vm.partition.RAM;
        }

        if (vm.partition.HDD) {
            parameters.HDD = vm.partition.HDD;
        }

        var ipv4Whitelist = [];
        angular.forEach(vm.partition.ipv4Whitelist, function (ip) {
            if (ip.value) {
                ipv4Whitelist.push(ip.value);
            }
        });
        ipv4Whitelist = ipv4Whitelist.join(',').replace(/[,]+/igm, ',').replace(/[\s]+/igm, '');
        if (ipv4Whitelist && ipv4Whitelist.length > 1) {
            parameters.ipv4Whitelist = ipv4Whitelist;
        }

        tredlyApi.post(vm.partition.Host.host,
            '/create/partition/' + vm.partition.Partition, parameters, formatOutput)
            .then(refresh, refresh);
    }

    function scrollToTheBottom () {
        var objDiv = document.getElementById('mod-partition-create');
        objDiv.scrollIntoView(false);
    }

    function formatOutput (data) {
        var newData = data.split('\n');

        if (newData.length === 1) {
            vm.consoleOutputEnd += data;
        } else {
            newData[0] = '<br>' + vm.consoleOutputEnd + newData[0];
            vm.consoleOutputEnd = newData.pop();

            angular.forEach(newData, function (line, index) {
                newData[index] = $filter('terminal')(line);
            });

            vm.consoleOutput += newData.join('<br>');
        }

        $interval(scrollToTheBottom, 500, 3);
    }

}

})();
