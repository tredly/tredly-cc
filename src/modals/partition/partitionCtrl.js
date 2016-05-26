(function() {

'use strict';

angular
    .module('tredly.modals')
    .controller('ModalPartitionCtrl', ModalPartitionCtrl);

function ModalPartitionCtrl ($scope, $rootScope, $state, $window, $filter, $interval, tredlyApi) {
    var vm = this;

    vm.partition = angular.extend({}, $rootScope.modalControl.data.partition);
    vm.partition.ipv4Whitelist = [];
    vm.partition.CPU = (vm.partition.CPU || '').replace(/[^0-9]/ig, '');
    vm.partition.RAM = (vm.partition.RAM || '').replace(/[^0-9kmg]/ig, '');

    vm.mode = 'view';

    vm.saving = false;
    vm.confirmed = false;
    vm.consoleOutput = '';
    vm.consoleOutputEnd = '';

    vm.calcHdd = calcHdd;
    vm.validate = validate;
    vm.cancel = cancel;
    vm.refresh = refresh;
    vm.update = update;
    vm.destroy = destroy;
    vm.destroyContainers = destroyContainers;

    calcHdd(true);

    parsePublicIPs();

    function parsePublicIPs () {
        var ips = (vm.partition.PublicIPs || '').replace(/[^0-9\.\,]/ig, '');
        ips = ips.split(',');
        angular.forEach(ips, function (ip) {
            if (ip) {
                vm.partition.ipv4Whitelist.push({
                    value: ip
                });
            }
        });
    }

    function calcHdd (parse) {
        function calcPrecent (currentHdd, totalHdd) {
            currentHdd = currentHdd.replace(/k/ig, 1024).replace(/m/ig, 1024 * 1024).replace(/g/ig, 1024 * 1024 * 1024);
            totalHdd = totalHdd.replace(/k/ig, 1024).replace(/m/ig, 1024 * 1024).replace(/g/ig, 1024 * 1024 * 1024);

            currentHdd = parseInt(currentHdd) || 0;
            totalHdd = parseInt(totalHdd) || currentHdd;

            return (totalHdd && totalHdd > currentHdd)  ? (currentHdd / totalHdd * 100) : 100;
        }

        var nativeHdd, currentHdd, totalHdd, percentHdd;

        if (parse) {
            nativeHdd = vm.partition['HDD(Used/Total)'] || '';
            nativeHdd = nativeHdd.split('/');

            currentHdd = (nativeHdd[0] || '').replace(/[^0-9kmg]/ig, '');
            totalHdd = (nativeHdd[1] || '').replace(/[^0-9kmg]/ig, '');

            vm.partition.HDD = totalHdd;
            vm.partition.HddCurrent = currentHdd;
            percentHdd = calcPrecent(currentHdd, totalHdd);

            vm.partition.HddPercent = percentHdd;
        } else {
            totalHdd = vm.partition.HDD;
            currentHdd = vm.partition.HddCurrent;
            percentHdd = calcPrecent(currentHdd, totalHdd);

            vm.partition.HddPercent = percentHdd;
            nativeHdd = currentHdd + '/' + totalHdd;
            vm.partition['HDD(Used/Total)'] = nativeHdd;
        }
    }

    function validate (mode) {
        return vm.saving || (vm.mode !== 'view' && vm.mode !== mode) || !vm.partition.Partition;
    }

    function cancel () {
        vm.mode = 'view';
    }

    function refresh () {
        $state.go('app.partitions');
        $rootScope.$broadcast('refreshContent');
    }

    function update () {
        if (vm.mode !== 'view') {
            return;
        }

        vm.mode = 'update';

        var parameters = {
            partitionName: vm.partition.Partition
        };

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

        tredlyApi.post(vm.partition.host.host,
            '/modify/partition/' + $rootScope.modalControl.data.partition.Partition, parameters, formatOutput)
            .then(refresh, refresh);
    }

    function destroy (force) {
        vm.mode = 'destroy';

        if (!force) {
            return;
        }

        vm.confirmed = true;

        tredlyApi.post(vm.partition.host.host,
            '/destroy/partition/' + $rootScope.modalControl.data.partition.Partition, null, formatOutput)
            .then(refresh, refresh);
    }

    function destroyContainers (force) {
        vm.mode = 'destroy-containers';

        if (!force) {
            return;
        }

        vm.confirmed = true;

        tredlyApi.post(vm.partition.host.host,
            '/destroy/containers/' + $rootScope.modalControl.data.partition.Partition, null, formatOutput)
            .then(refresh, refresh);
    }

    function scrollToTheBottom () {
        var objDiv = document.getElementById('mod-partition-edit');
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
