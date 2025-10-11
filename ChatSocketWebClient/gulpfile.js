import gulp from 'gulp'
import concat from 'gulp-concat'
import uglify from 'gulp-uglify-es'
import obfuscator from 'gulp-obfuscator'

const { src, dest, task } = gulp
const uglifyES = uglify.default // required because uglify-es uses default export

task('build-js', () => {
  return src([
    './js/TRA/ByteArrayConverter.js',
    './js/TRA/TRA.js',
    './js/FallingChars.js',
    './js/Utils.js',
    './js/HypixelUtils.js',
    './js/ChatSocketProtocol.js',
    './js/ChatSocketWebClient.js',
    './js/app.js',
    './js/form/formValidator.js',
    './js/form/chatSocket.js',
    './js/form/chatSocketSettings.js',
    './js/index.js',
  ])
    .pipe(concat('bundle.min.js'))
    .pipe(uglifyES())
    .pipe(
      obfuscator({
        compact: true,
        controlFlowFlattening: true,
      })
    )
    .pipe(dest('./dist'))
})
