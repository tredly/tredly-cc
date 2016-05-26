(function() {

'use strict';

angular
    .module('tredly.modals')
    .controller('ModalDisconnectCtrl', ModalDisconnectCtrl);

function ModalDisconnectCtrl ($rootScope, $state, tredlyConnection) {
    var vm = this;

    vm.host = angular.extend({}, $rootScope.modalControl.data.host);

    vm.saving = false;

    vm.disconnect = disconnect;
    vm.save = save;
    vm.validate = validate;

    function disconnect () {
        tredlyConnection.disconnect({
            host: vm.host.host
        });
        $rootScope.modalControl.close();
        $state.go('app.hosts');
        $rootScope.$broadcast('refreshContent');
    }

    function save () {
        vm.serverError = null;
        if (vm.host.username) {
            vm.saving = true;
            tredlyConnection.connect({
                host: vm.host.host,
                name: vm.host.name,
                username: vm.host.username,
                password: vm.host.password
            }).then(function () {
                $rootScope.modalControl.close();
                $state.go('app.hosts');
                $rootScope.$broadcast('refreshContent');
                vm.saving = false;
            }, function (err) {
                vm.serverError = 'Could not connect';
                vm.saving = false;
            });
        } else {
            tredlyConnection.setConnection({
                host: vm.host.host,
                name: vm.host.name
            });
            $rootScope.modalControl.close();
            $state.go('app.hosts');
            $rootScope.$broadcast('refreshContent');
        }
    }

    function validate () {

        if (vm.saving ||
            !vm.host.name ||
            vm.host.username && !vm.host.password ||
            !vm.host.username && vm.host.password) {

            return true;
        }
    }

}

})();
