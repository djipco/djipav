const gulp = require("gulp");
const concat = require("gulp-concat");
const minify = require("gulp-minify");
const jsdoc = require("gulp-jsdoc3");
const ghPages = require('gulp-gh-pages');

function doc(cb) {

  let config = require("./.jsdoc.json");

  return gulp
    .src(["README.md", "./src/**/*.js"], {read: false})
    .pipe(jsdoc(config, cb));

}

function bundle() {

  return gulp.src(["./src/*.js"])                       // fetch source files
    .pipe(concat(`djipav.js`))                     // concatenate them
    .pipe(minify({ext: { min:".min.js" } } ))      // minify
    .pipe(gulp.dest("./dist"));                         // write to disk

}

function uploadDocs() {
  return gulp.src('./docs/**/*')
    .pipe(ghPages());
}

exports.doc = doc;
exports.uploadDocs = uploadDocs;
exports.build = gulp.series(bundle, doc, uploadDocs);
