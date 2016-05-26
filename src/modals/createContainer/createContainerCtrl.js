(function() {

'use strict';

angular
    .module('tredly.modals')
    .controller('ModalCreateContainerCtrl', ModalCreateContainerCtrl);

function ModalCreateContainerCtrl ($scope, $rootScope, $state, $window, $filter, $q, $timeout, $interval, tredlyConnection, tredlyApi) {
    var vm = this;

    vm.hosts = [];
    vm.container = {};
    vm.modes = [
        {
            name: 'create',
            title: 'Create container from the server folder'
        },
        {
            name: 'upload',
            title: 'Upload container into the server folder'
        },
        {
            name: 'push',
            title: 'Upload container into the server folder and create it.'
        }
    ];
    vm.container.mode = vm.modes[0];

    vm.saving = false;
    vm.consoleOutput = '';
    vm.consoleOutputEnd = '';

    vm.validate = validate;
    vm.refresh = refresh;
    vm.save = save;
    vm.changeMode = changeMode;

    var uploadPromise = null;

    $scope.$on('fileAdded', function (event, context, file) {
        if (!/\.tar\.gz$/ig.test(file.name)) {
            file.removeMe = true;
            vm.context = null;
            vm.file = null;
            vm.fileError = 'Please, select a valid *.tar.gz file';
        } else {
            vm.context = context;
            vm.file = file;
        }
        $scope.$apply();
    });

    $scope.$on('fileUploading', function (event, context, file, xhr, formData) {
        var index = 0;
        var onprogress = xhr.onprogress;
        xhr.onprogress = function () {
            var textSoFar = xhr.responseText;
            var newText = textSoFar.substr(index);
            index = textSoFar.length;
            formatOutput(newText);
            if (onprogress) {
                return onprogress.apply(xhr, arguments);
            }
        };
    });

    $scope.$on('fileUploaded', function () {
        vm.context = null;
        vm.file = null;
        if (uploadPromise) {
            uploadPromise.resolve();
            uploadPromise = null;
        }
    });

    $scope.$on('fileUploadError', function (event, context, file, response) {
        $timeout(function() {
            if (uploadPromise) {
                uploadPromise.reject();
                uploadPromise = null;
            }
        });
    });

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
                    if (host.partitions && host.partitions.length) {
                        vm.hosts.push(host);
                    }
                }, function () {

                })
            );
        });

        $q.all(promises).then(function () {
            vm.loading = false;
            vm.loaded = !!vm.hosts.length;
        });
    }

    function uploadPackage () {
        var url = vm.container.mode.name === 'push' ? '/push/container' : '/push/files';
        url += '/?' + [
            'path=' + encodeURIComponent(vm.container.path || ''),
            'partition=' + encodeURIComponent(vm.container.Partition.Partition || ''),
            'host=' + encodeURIComponent(vm.container.Host.host || ''),
            'token=' + encodeURIComponent(vm.container.Host.token || '')
        ].join('&');

        uploadPromise = $q.defer();
        vm.context.url = url;
        vm.context.upload();

        return uploadPromise.promise;
    };

    function validate () {
        return vm.saving || !vm.container.Partition || !vm.container.Host || !vm.container.path ||
            (vm.container.mode.name !== 'create' && !vm.file);
    }

    function refresh () {
        if (vm.container.mode.name !== 'upload') {
            $state.go('app.containers', {host: vm.container.Host.host, partition: vm.container.Partition.Partition});
            $rootScope.$broadcast('refreshContent');
        }
    }

    function save () {
        if (vm.saving) {
            return;
        }

        vm.saving = true;

        var parameters = {};

        if (vm.container.path) {
            parameters.path = vm.container.path;
        }

        if (vm.container.mode.name === 'create') {
            tredlyApi.post(vm.container.Host.host,
                '/create/container/' + vm.container.Partition.Partition, parameters, formatOutput)
                .then(refresh, refresh);
        } else {
            uploadPackage()
                .then(refresh, refresh);
        }
    }

    function changeMode () {
        if (vm.container.mode.name === 'create') {
            vm.file = null;
            vm.context = null;
        }
    }

    function scrollToTheBottom () {
        var objDiv = document.getElementById('mod-container-create');
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
