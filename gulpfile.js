'use strict';

var gulp = require('gulp');
var path = require('path');

// load plugins
var $ = require('gulp-load-plugins')();

gulp.task('sass', function () {
  return gulp.src('app/styles/main.scss')
    .pipe($.sass())
    // .pipe($.autoprefixer('last 1 version'))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe($.size());

});

gulp.task('styles', ['sass'], function() {
  return gulp.src('.tmp/styles/main.css')
    .pipe($.sourcemaps.init({
      loadMaps: true,
      includeContent: false,
      sourceRoot: '../cats'
    }))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('.tmp/styles'));
});

gulp.task('scripts', function () {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.jshint())
    .pipe($.jshint.reporter(require('jshint-stylish')))
    .pipe($.size());
});

gulp.task('html', ['styles', 'scripts'], function () {
  var jsFilter = $.filter('**/*.js');
  var cssFilter = $.filter('**/*.css');

  return gulp.src('app/index.html')
    .pipe($.useref.assets({searchPath: '{.tmp,app}'}))
    .pipe(jsFilter)
    .pipe($.uglify())
    .pipe(jsFilter.restore())
    .pipe(cssFilter)
    .pipe($.csso())
    .pipe($.minifyCss())
    .pipe(cssFilter.restore())
    .pipe($.rev())
    .pipe($.useref.restore())
    .pipe($.useref())
    .pipe($.revReplace())
    .pipe(gulp.dest('dist'))
    .pipe($.size());
});

gulp.task('extras', function () {
  return gulp.src(['app/*.*', '!app/index.html'], { dot: true })
    .pipe(gulp.dest('dist'));
});


gulp.task('clean', function () {
  return gulp.src(['.tmp', 'dist'], { read: false })
    .pipe($.clean());
});


gulp.task('express', ['mongod'], function () {
  var express = require('express')
    , app = express();

  app.use(require('connect-livereload')({ port: 35729 }));

  app.use(require('compression')());
  app.use(express.static('app'));
  app.use(express.static('.tmp'));
  process.env.DEV = true;
  process.env.DEBUG = true;

  var server = require(path.join(__dirname, 'server', 'server.js'));
  server.start(app);

});


gulp.task('mongod', function() {
  //From here: http://stackoverflow.com/questions/18334181/spawn-on-node-js-windows-server-2012
  var spawn = require('child_process').spawn;
  spawn(process.env.comspec, ['/c', 'start mongod',]);
});


// inject bower components
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;

  gulp.src('app/styles/*.scss')
    .pipe(wiredep({
      directory: 'app/bower_components'
    }))
    .pipe(gulp.dest('app/styles'));

  gulp.src('app/*.html')
    .pipe(wiredep({
      directory: 'app/bower_components'
    }))
    .pipe(gulp.dest('app'));
});


gulp.task('watch', ['express'], function () {
  var server = $.livereload();

  // watch for changes

  gulp.watch([
    'app/*.html',
    '.tmp/styles/**/*.css',
    'app/scripts/**/*.js',
    'app/images/**/*'
  ]).on('change', function (file) {
    server.changed(file.path);
  });

  gulp.watch('app/styles/**/*.scss', ['styles']);
  gulp.watch('app/scripts/**/*.js', ['scripts']);
  gulp.watch('app/images/**/*', ['images']);
  gulp.watch('bower.json', ['wiredep']);
});

gulp.task('build', ['html', 'extras']);
// gulp.task('build', ['html', 'images', 'fonts', 'extras']);

gulp.task('default', ['clean'], function () {
  gulp.start('build');
});
