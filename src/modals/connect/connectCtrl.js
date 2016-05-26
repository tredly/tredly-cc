(function() {

'use strict';

angular
    .module('tredly.modals')
    .controller('ModalConnectCtrl', ModalConnectCtrl);

function ModalConnectCtrl ($scope, $rootScope, $state, $q, tredlyConnection) {
    var vm = this;

    vm.host = {
        name: $rootScope.modalControl.data.mainHost && 'Main Host' || '',
        host: ''
    };

    vm.saving = false;

    vm.save = save;
    vm.validate = validate;

    $scope.$on('$destroy', function() {
        if (vm.canceler) {
            vm.canceler.resolve();
            vm.canceler = null;
        }
    });


    function save () {
        vm.serverError = null;
        vm.saving = true;

        if (vm.canceler) {
            vm.canceler.resolve();
            vm.canceler = null;
        }

        vm.canceler = $q.defer();

        tredlyConnection.connect({
            host: vm.host.host,
            name: vm.host.name,
            username: vm.host.username,
            password: vm.host.password
        }, {
            timeout: vm.canceler.promise
        }).then(function () {
            $rootScope.modalControl.close();
            $state.go('app.hosts');
            $rootScope.$broadcast('refreshContent');
            vm.saving = false;
        }, function (err) {
            vm.serverError = 'Could not connect';
            vm.saving = false;
        });
    }

    function validate () {

        if (vm.saving || !vm.host.username || !vm.host.password ||
            !$rootScope.modalControl.data.mainHost && (!vm.host.name || !vm.host.host)) {
            return true;
        }
    }

}

})();
