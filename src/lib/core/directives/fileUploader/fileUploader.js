(function() {

'use strict';

angular
    .module('tredly.lib.core')
    .directive('fileUploader', fileUploader);

function fileUploader ($timeout, $rootScope) {
    return {
        restrict: 'C',
        link: link,
        translude: true
    };

    function link (scope, element, attrs) {

        var template = '<div class="dz-default" style="pointer-events: none;">' +
            '<div class="center"><img data-dz-thumbnail class="i xxxlarge"/></div>' +
            '<br><br><p class="center"><strong data-dz-name></strong></p>' +
            '</div>';

        var context = { url: null, uploadProgress: 0 };

        var config = {
            url: function (files) {
                if (angular.isFunction(context.url)) {
                    return context.url(files);
                } else {
                    return context.url;
                }
            },
            previewTemplate: template,
            parallelUploads: 1000,
            maxFilesize: 1500,
            autoProcessQueue: false,
            clickable: angular.isUndefined(attrs.ngClick)
        };

        var dropzone = new Dropzone(element[0], config);

        context.upload = dropzone.processQueue.bind(dropzone);
        context.reset = dropzone.removeAllFiles.bind(dropzone);

        dropzone.on('addedfile', fileAdded);
        dropzone.on('success', fileUploaded);
        dropzone.on('error', fileError);
        dropzone.on('uploadprogress', uploadProgress);
        dropzone.on('sending', fileUploading);

        function fileAdded (file) {
            if (!context.multipleFiles) {
                for (var i = this.files.length - 2; i >= 0; --i) {
                    this.removeFile(this.files[i]);
                }
            }

            $rootScope.$broadcast('fileAdded', context, file);

            if (file.removeMe) {
                this.removeFile(this.files[this.files.length - 1]);
            }
        }

        function fileUploaded (file, response) {
            $rootScope.$broadcast('fileUploaded', context, file, response);
        }

        function fileUploading (file, xhr, formData) {
            // Preventing double-request attempts
            //xhr.timeout = 180 * 60 * 1000;
            //xhr.ontimeout = uploadTimeout(context, file, xhr);
            $rootScope.$broadcast('fileUploading', context, file, xhr, formData);
        }

        function fileError (file, response) {
            context.error = response;
            $rootScope.$broadcast('fileUploadError', context, file, context.error);
        }

        function uploadTimeout (context, file, xhr) {
            return function () {
                xhr.ontimeout = null;
                context.error = context.error || 'Upload timeout';
                $rootScope.$broadcast('fileUploadError', context, file, context.error);
            };
        }

        function uploadProgress (file, progress) {
            $timeout(function () {
                context.uploadProgress = Math.floor(progress);
                $rootScope.$broadcast('fileUploadProgress', context, file);
            });
        }
    }
}

})();
