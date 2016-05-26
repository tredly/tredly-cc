(function() {

'use strict';

angular
    .module('tredly.lib.core')
    .directive('tredlyModal', tredlyModal)
    .directive('tredlyModalOpen', tredlyModalOpen);

function tredlyModal ($timeout, $document) {

    return {
        restrict: 'E',
        link: link,
        controller: controller,
        controllerAs: 'modalControl',
        templateUrl: '/lib/core/directives/modal/modal.html'
    };

    function link (scope, element) {

        $document.on('touchstart touchend', function(event) {
            if (scope.modalControl.showing) {
                event.preventDefault();
                event.stopPropagation();
            }
        });

        element.on('click', function($event) {
            $timeout(function () {
                scope.modalControl.backgroundClose($event);
            });
        });
    }

    function controller ($scope, $rootScope, $timeout, $window) {
        var vm = this;

        $rootScope.modalControl = vm;

        vm.show = false;
        vm.showing = false;

        vm.template = null;
        vm.data = {};
        vm.options = {};

        vm.close = modalClose;
        vm.backgroundClose = backgroundClose;

        vm.scrollTo = null;

        $scope.$on('tredlyModalOpen', function (event, obj) {
            if (vm.show || vm.showing) {
                return;
            }

            vm.showing = true;

            vm.scrollTo = {
                x: $window.pageXOffset,
                y: $window.pageYOffset
            };

            $window.scrollTo(0, 0);

            vm.template = obj.template || '';


            vm.data = obj.data || {};
            vm.options = obj.options || {};

            $timeout(function() {
                vm.show = true;
                $timeout(function() {
                    vm.showing = false;
                }, 100);
            }, 100);
        });

        function backgroundClose ($event) {
            if (angular.element($event.target).hasClass('modalContainer')) {
                modalClose();
            }
        };

        function modalClose () {

            if (!vm.show) {
                vm.showing = false;
            }

            vm.showing = true;
            vm.show = false;

            if (vm.scrollTo) {
                $window.scrollTo(vm.scrollTo.x, vm.scrollTo.y);
            }

            $timeout(function() {

                $rootScope.$broadcast('tredlyModalClose');

                vm.showing = false;
                vm.template = null;
                vm.data = {};
                vm.options = {};

            }, 600);

        }

    }
}

function tredlyModalOpen ($rootScope, $parse) {
    return {
        link: link
    };

    function link (scope, element, attrs) {
        element.bind('click', function() {

            var data = $parse(attrs.tredlyModalData);
            var options = $parse(attrs.tredlyModalOptions);

            $rootScope.$broadcast('tredlyModalOpen', {
                template: attrs.tredlyModalOpen,
                data: data(scope),
                options: options(scope)
            });

            scope.$apply();
        });
    }
}

})();
