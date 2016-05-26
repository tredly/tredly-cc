(function() {

'use strict';

angular
    .module('tredly.app')
    .controller('AddCtrl', AddCtrl);

function AddCtrl ($scope, $q, tredlyConnection, tredlyApi) {
    var vm = this;

    vm.refresh = refresh;

    $scope.$on('refreshContent', function() {
        refresh();
    });

    refresh();

    function refresh () {
        vm.loaded = false;
        vm.canCreatePartition = false;
        vm.canCreateContainer = false;
        vm.hosts = [];

        var hosts = tredlyConnection.getConnections(true);

        var promises = [];

        angular.forEach(hosts, function (host) {
            promises.push(
                tredlyApi.get(host.host, '/list/partitions').then(function (partitions) {
                    host.partitions = partitions;
                    vm.canCreatePartition = true;
                    vm.canCreateContainer = !!partitions.length;
                    vm.hosts.push(host);
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
