(function() {

'use strict';

angular
    .module('tredly.app')
    .controller('ContainersCtrl', ContainersCtrl);

function ContainersCtrl ($scope, $stateParams, $q, $filter, tredlyConnection, tredlyApi) {
    var vm = this;

    vm.table = {
        filters: [],
        sort: {
            column: 'ContainerName',
            direction: '+'
        },
        columns: [
            {
                name: 'ContainerName',
                title: 'Name'
            },
            {
                name: 'HostName',
                title: 'Host'
            },
            {
                name: 'Partition',
                title: 'Partition'
            },
            {
                name: 'ContainerGroup',
                title: 'Group'
            },
            {
                name: 'State',
                title: 'State'
            },
            {
                name: 'CreatedDate',
                title: 'Uptime'
            }
        ]
    };

    if ($stateParams.filter) {
        filter('host', $stateParams.host || '', true, true);
    }

    if ($stateParams.partition) {
        filter('partition', $stateParams.partition, true, true);
    }

    vm.filter = filter;
    vm.refresh = refresh;
    vm.reorder = reorder;
    vm.hideFilters = hideFilters;
    vm.toggleFilter = toggleFilter;

    $scope.$on('refreshContent', function() {
        refresh();
    });

    $scope.$on('$destroy', function() {
        if (vm.canceler) {
            vm.canceler.resolve();
            vm.canceler = null;
        }
    });

    hideFilters();

    refresh();

    function hideFilters () {
        vm.showFilterHosts = false;
        vm.showFilterPartitions = false;
    }

    function toggleFilter (event, filter) {
        if (filter) {
            if (filter.type === 'host') {
                vm.showFilterHosts = !vm.showFilterHosts;
                vm.showFilterPartitions = false;
            } else if (filter.type === 'partition') {
                vm.showFilterHosts = false;
                vm.showFilterPartitions = !vm.showFilterPartitions;
            }
        } else {
            if (vm.table.filters.length === 0 && vm.hosts.length) {
                vm.showFilterHosts = !vm.showFilterHosts;
                vm.showFilterPartitions = false;
            } else if (vm.table.filters.length === 1 && vm.partitions.length) {
                vm.showFilterHosts = false;
                vm.showFilterPartitions = !vm.showFilterPartitions;
            }
        }

        event.stopPropagation();

    }

    function filter (type, param, add, silent) {

        var index = -1;
        angular.forEach(vm.table.filters, function (filter, ind) {
            if (filter.name === param && filter.type === type) {
                index = ind;
            }
        });


        if (!add) {
            if (index >= 0) {
                if (type === 'host') {
                    vm.table.filters = [];
                } else {
                    vm.table.filters.splice(index, 1);
                }
            }
        } else {
            if (index < 0) {
                if (type === 'host') {
                    vm.table.filters = [
                        {
                            name: param,
                            type: type
                        }
                    ];
                } else {
                    vm.table.filters = [
                        vm.table.filters[0],
                        {
                            name: param,
                            type: type
                        }
                    ];
                }
            }
        }

        if (!silent) {
            refresh();
        }
    }

    function refresh () {
        vm.loaded = false;
        vm.partitions = [];
        vm.containers = [];

        vm.hosts = tredlyConnection.getConnections(true);
        vm.hosts = $filter('orderBy')(vm.hosts, '+name');

        var filteredHosts =[]

        var partitions = null;
        var hosts = tredlyConnection.getConnections();
        var filters = vm.table.filters;

        if (vm.canceler) {
            vm.canceler.resolve();
            vm.canceler = null;
        }

        vm.canceler = $q.defer();

        vm.table.filters = [];
        angular.forEach(filters, function (filter) {
            if (filter.type === 'host') {
                if (hosts[filter.name]) {
                    filter.host = hosts[filter.name];
                    filter.title = filter.host.name;
                    filteredHosts.push(filter.host);
                    vm.table.filters.push(filter);
                }
            } else if (filter.type === 'partition') {
                filter.title = filter.name;
                partitions = partitions || {};
                partitions[filter.name] = true;
                vm.table.filters.push(filter);
            }
        });

        if (!filteredHosts.length) {
            filteredHosts = vm.hosts;
        }

        var promises = [];

        angular.forEach(filteredHosts, function (host) {

            if (vm.table.filters.length > 0) {
                promises.push(
                    tredlyApi.get(vm.table.filters[0].host.host, '/list/partitions',
                        null, null, { timeout: vm.canceler.promise }).then(function (partitions) {
                        angular.forEach(partitions, function (partition) {
                            vm.partitions.push(angular.extend(partition, {
                                host: vm.table.filters[0].host
                            }));
                        });
                    }, function () {

                    })
                );
            }

            promises.push(
                tredlyApi.get(host.host, '/list/containers',
                    null, null, { timeout: vm.canceler.promise }).then(function (containers) {
                    angular.forEach(containers, function (container) {
                        if (partitions && !partitions[container.Partition]) {
                            return;
                        }
                        vm.containers.push(angular.extend(container, {
                            host: host,
                            HostName: host.name,
                            CreatedDate: moment(container.Created, 'DD/MM/YYYY HH:mm:ss Z').toDate()
                        }));
                    });
                    vm.loaded = true;
                }, function () {

                })
            );
        });

        return $q.all(promises).then(function () {
            vm.loaded = true;
        });
    }


    function reorder (column) {
        if (vm.table.sort.column !== column.name) {
            vm.table.sort.column = column.name;
            vm.table.sort.direction = '+';
        } else {
            vm.table.sort.direction = (vm.table.sort.direction === '+' ? '-' : '+');
        }
    }

}

})();
