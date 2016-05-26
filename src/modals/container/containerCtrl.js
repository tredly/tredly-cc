(function() {

'use strict';

angular
    .module('tredly.modals')
    .controller('ModalContainerCtrl', ModalContainerCtrl);

function ModalContainerCtrl ($scope, $rootScope, $state, $window, $filter, $interval, tredlyApi) {
    var vm = this;

    vm.container = angular.extend({}, $rootScope.modalControl.data.container);

    vm.container.CreatedStr = $filter('dateTime')(vm.container.CreatedDate);
    vm.container.UptimeStr = $filter('timeAgo')(vm.container.CreatedDate);

    vm.mode = 'view';

    vm.saving = false;
    vm.confirmed = false;
    vm.consoleOutput = '';
    vm.consoleOutputEnd = '';

    vm.terminalData = {
        sessionId: '',
        command: '',
        commands: [],
        index: 0
    };

    vm.serverPath =
        '/tredly/ptn/' + vm.container.Partition + '/data/containers/' +
        vm.container.ContainerName + '_' + vm.container.Partition;

    vm.validate = validate;
    vm.cancel = cancel;
    vm.refresh = refresh;
    vm.replace = replace;
    vm.destroy = destroy;
    vm.terminal = terminal;
    vm.runCommand = runCommand;
    vm.searchCommand = searchCommand;
    vm.resetCommand = resetCommand;

    $scope.$on('tredlyModalClose', function () {
        closeTerminal();
    });

    function validate (mode) {
        return vm.saving || (vm.mode !== 'view' && vm.mode !== mode);
    }

    function cancel () {
        vm.mode = 'view';
    }

    function refresh () {
        $state.go('app.containers');
        $rootScope.$broadcast('refreshContent');
    }

    function replace (force) {
        vm.mode = 'replace';

        if (!force) {
            return;
        }

        vm.confirmed = true;

        tredlyApi.post(vm.container.host.host,
            '/replace/container/' + vm.container.Partition + '/' + vm.container.UUID, {
                path: vm.serverPath
            }, formatOutput)
            .then(refresh, refresh);
    }

    function destroy (force) {
        vm.mode = 'destroy';

        if (!force) {
            return;
        }

        vm.confirmed = true;

        tredlyApi.post(vm.container.host.host,
            '/destroy/container/' + vm.container.UUID, null, formatOutput)
            .then(refresh, refresh);
    }

    function terminal () {
        vm.mode = 'console';

        vm.terminalData.sessionId = createToken();

        tredlyApi.post(vm.container.host.host,
            '/console/' + vm.container.UUID, null, formatOutput, {
                ignoreLoadingBar: true,
                plainTextBody: true,
                sessionId: vm.terminalData.sessionId
            })
            .then(angular.noop(), angular.noop());
    }

    function runCommand () {
        if (vm.saving || !vm.terminalData.command || vm.mode !== 'console') {
            return;
        }

        vm.saving = true;

        formatInput(vm.terminalData.command);

        tredlyApi.post(vm.container.host.host,
            '/api/stdin', vm.terminalData.command, null, {
                ignoreLoadingBar: true,
                plainTextBody: true,
                sessionId: vm.terminalData.sessionId
            })
            .then(function () {
                vm.terminalData.commands.push(vm.terminalData.command);
                vm.terminalData.command = '';
                vm.saving = false;
                resetCommand();
            }, function () {
                vm.saving = false;
            });
    }

    function closeTerminal () {
        if (!vm.terminalData.sessionId || vm.mode !== 'console') {
            return;
        }

        tredlyApi.post(vm.container.host.host,
            '/api/stdin', 'exit', null, {
                ignoreLoadingBar: true,
                plainTextBody: true,
                sessionId: vm.terminalData.sessionId
            })
            .then(function () {
                vm.terminalData.sessionId = null;
            }, function () {
                vm.terminalData.sessionId = null;
            });
    }

    function searchCommand (event) {
        switch (event.keyCode) {
            case 38: // key up
                --vm.terminalData.index;
                if (!applyCommand()) {
                    ++vm.terminalData.index;
                }
                break;
            case 40: // key down
                ++vm.terminalData.index;
                if (!applyCommand()) {
                    --vm.terminalData.index;
                }
                break;
        }
    }

    function resetCommand () {
        vm.terminalData.index = vm.terminalData.commands.length;
    }

    function applyCommand () {
        if (vm.terminalData.index >= 0 &&
            vm.terminalData.index < vm.terminalData.commands.length) {
            vm.terminalData.command = vm.terminalData.commands[vm.terminalData.index];
            return true;
        }
        return false;
    }

    function createToken (length) {
        length = length || 32;

        var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');

        var str = '';
        for (var i = 0; i < length; i++) {
            str += chars[Math.floor(Math.random() * chars.length)];
        }

        return str;
    }

    function scrollToTheBottom () {
        var objDiv = document.getElementById('mod-container-edit');
        if (objDiv) {
            objDiv.scrollIntoView(false);
        }
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

    function formatInput (data) {
        vm.consoleOutput += '<br>' + $filter('terminal')(vm.consoleOutputEnd) +
            '<br><span class="terminal-cmd"><span class="i i-arrow-right c-grey"></span> ' +
            $filter('terminal')(data) + '</span><br>';

        vm.consoleOutputEnd = '';

        $interval(scrollToTheBottom, 500, 3);
    }

}

})();
