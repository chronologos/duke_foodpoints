// https://markgoodyear.com/2014/01/getting-started-with-gulp/
var gulp = require('gulp'),
  sass = require('gulp-ruby-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  minifycss = require('gulp-minify-css'),
  jshint = require('gulp-jshint'),
  uglify = require('gulp-uglify'),
  imagemin = require('gulp-imagemin'),
  rename = require('gulp-rename'),
  concat = require('gulp-concat'),
  notify = require('gulp-notify'),
  cache = require('gulp-cache'),
  rimraf = require('gulp-rimraf');
  ignore = require('gulp-ignore');


gulp.task('styles', function() {
  return sass('src/styles/main.scss', { style: 'expanded' })
  .pipe(autoprefixer('last 2 version'))
  .pipe(gulp.dest('src/styles'))
  .pipe(rename({suffix: '.min'}))
  .pipe(minifycss())
  .pipe(gulp.dest('public/styles'))
  .pipe(notify({ message: 'Styles task complete' }));
});

gulp.task('scripts', function() {
  return gulp.src(['src/js/**/*.js','src/js/*.js'])
  .pipe(ignore('main.js'))
  // .pipe(jshint('.jshintrc'))
  .pipe(jshint())
  .pipe(jshint.reporter('default'))
  .pipe(concat('main.js'))
  .pipe(gulp.dest('src/js'))
  .pipe(rename({suffix: '.min'}))
  .pipe(uglify())
  .pipe(gulp.dest('public/js'))
  .pipe(notify({ message: 'Scripts task complete' }));
});

//Before deploying, it’s a good idea to clean out the destination folders and
// rebuild the files—just in case any have been removed from the source and are
// left hanging out in the destination folder:
gulp.task('clean', function(cb) {
  return gulp.src(['public/js/*.js','public/styles/*.css'], { read: false }) // much faster
  // .pipe(ignore('node_modules/**'))
  .pipe(rimraf());
});

//To watch our files and perform the necessary task when they change,
//we firstly need to create a new task, then use the gulp.watch API to begin watching files:
gulp.task('watch', function() {
  // Watch .scss files
  gulp.watch('src/styles/*.scss', ['styles']);

  // Watch .js files
  gulp.watch('src/js/*.js', ['scripts']);
});

//We can create a default task, ran by using $ gulp, to run all three tasks we have created:
gulp.task('default', ['clean'], function() {
    gulp.start('styles', 'scripts');
});
