'use strict';

var path = require('path');

var gulp = require('gulp');
var compass = require('gulp-compass');
var ngHtml2Js = require('gulp-ng-html2js');
var concat = require('gulp-concat');
var iconfont    = require('gulp-iconfont');
var iconfontCss = require('gulp-iconfont-css');
var rename = require('gulp-rename');


gulp.task('compass', function () {
  gulp.src('./assets/sass/**/*.scss')
    .pipe(compass({
        sass: './assets/sass',
        css: './dist/public/css',
        require: ['ceaser-easing', 'susy', 'breakpoint'],
        relative: false
    }))
    .pipe(gulp.dest('./dist/public/css'));
});

gulp.task('copy-images', function () {
  gulp.src('./assets/images/**')
    .pipe(gulp.dest('./dist/public/images'));
});

gulp.task('copy-components', function () {
  gulp.src('./bower_components/**/*')
    .pipe(gulp.dest('./dist/public/components'));
});

gulp.task('copy-html', function () {
  gulp.src('./*.html')
    .pipe(gulp.dest('./dist/public'));
});

gulp.task('copy-tredlycc', function () {
  gulp.src('./tredlycc-container')
    .pipe(rename('tredlycc'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('copy-server', function () {
  gulp.src('./server.js')
    .pipe(gulp.dest('./dist'));
});

gulp.task('copy-config', function () {
  gulp.src('./package.json')
    .pipe(gulp.dest('./dist'));
});

gulp.task('copy-tredlyfile', function () {
  gulp.src('./Tredlyfile')
    .pipe(gulp.dest('./dist'));
});

gulp.task('copy-ssh', function () {
  gulp.src('./ssl.sh')
    .pipe(gulp.dest('./dist'));
});

gulp.task('copy', [
    'copy-images',
    'copy-components',
    'copy-html',
    'copy-tredlycc',
    'copy-server',
    'copy-config',
    'copy-tredlyfile',
    'copy-ssh'
]);

gulp.task('angular-templates', function () {
  gulp.src('./src/**/*.html')
    .pipe(ngHtml2Js({
        moduleName: 'tredly.templates',
        prefix: '/'
    }))
    .pipe(gulp.dest('./dist/public/templates'))
    .pipe(concat('templates.js'))
    .pipe(gulp.dest('./dist/public/templates'));
});

gulp.task('angular-scripts', function () {
  gulp.src('./src/**/*.js')
    .pipe(concat('index.js'))
    .pipe(gulp.dest('./dist/public/app'));
});

gulp.task('angular', [
    'angular-templates',
    'angular-scripts'
]);

gulp.task('icon-font', function () {
    var fontName = 'icons';
    gulp.src('./assets/icons/**/*.svg')
        .pipe(iconfontCss({
            fontName: fontName,
            path: './assets/sass/icons.css',
            targetPath: '../css/icons.css',
            fontPath: '/'+ fontName +'/',
            cssClass: 'i'
        }))
        .pipe(iconfont({
            fontName: fontName,
            timestamp: Math.round(Date.now() / 1000),
            normalize: true,
            fontHeight: 1001
        }))
        .pipe(gulp.dest('./dist/public/icons'));
});

gulp.task('default', [
    'compass',
    'copy',
    'angular',
    'icon-font'
]);
