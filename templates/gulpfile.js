/* eslint-disable jsdoc/require-jsdoc */

const {watch, src, dest, series, parallel} = require("gulp");
const mocha = require("gulp-mocha");
const eslint = require("gulp-eslint7");
const jsdoc = require("gulp-jsdoc3");
const nodemon = require("gulp-nodemon");
// const istanbul = require("gulp-istanbul"); // gulp-istanbul is broken; hasn't been updated in 3 years
let {spawn} = require("child_process");
const browserSync = require("browser-sync").create();

const sources = ["src/*.js", "lib/*.js", "index.js"];
const tests = ["test/*.js"];
const support = ["gulpfile.js", "package.json", ".eslintrc.js", "docs.json"];
const js = [... sources, ... tests];
const css = ["./jsdoc.css"];
const markdown = ["**/*.md"];
const documentation = [... sources, ... markdown, ... css];
const all = [... sources, ... tests, ... support];
const jsDocConfig = require("./.jsdoc-conf.json");

/* ************
 * TESTING
 **************/
function test(testReporter = "spec") {
    return src(tests)
        .pipe(mocha({reporter: testReporter, exit: true}));
}

function testQuiet() {
    return test.bind(null, "min")();
}

function watchTest() {
    return watch(all, test.bind(null, "min"));
}

/* ************
 * LINT
 **************/
function lintBasic() {
    return src(js)
        .pipe(eslint({quiet: true}))
        .pipe(eslint.format());
}

function lint() {
    return lintBasic()
        .pipe(eslint.failAfterError());
}

function watchLint() {
    return watch(all, function() {
        return lintBasic();
    });
}

/* ************
 * COVERAGE
 **************/
function runIstanbul(done) {
    let cmd = "nyc";
    let args = [
        "--reporter=text",
        "--reporter=html",
        "--reporter=lcov",
        "mocha",
    ];
    let opts = {
        stdio: "inherit",
    };
    spawn(cmd, args, opts).on("close", done);
}

const coverage = runIstanbul;

function coverageRefresh() {
    return watch(js, runIstanbul);
}

function coverageBrowserSync() {
    browserSync.init({
        server: {
            baseDir: "./coverage",
        },
    });

    watch("coverage/*").on("change", browserSync.reload);
    watch("coverage/*").on("add", browserSync.reload);
}

const watchCoverage = parallel(coverageBrowserSync, coverageRefresh);

/* ************
 * DOCS
 **************/
function docsBuild(done) {
    src(documentation, {read: false})
        .pipe(jsdoc(jsDocConfig, done));
}

const docs = series(docsBuild, copyCss);

function copyCss() {
    return src("jsdoc.css")
        .pipe(dest("./docs"));
}

function docsBrowserSync() {
    browserSync.init({
        server: {
            baseDir: "./docs",
        },
    });

    watch("docs/*").on("change", browserSync.reload);
    watch("docs/*").on("add", browserSync.reload);
}

function docsRefresh() {
    watch(css, copyCss);
    watch(documentation, docsBuild);
}

const watchDocs = parallel(docsBrowserSync, docsRefresh);

/* ************
 * MAIN
 **************/
function watchMain(done) {
    let stream = nodemon({script: "main.js",
        watch: js,
        done: done,
    });

    stream
        .on("restart", function() {
            console.log("Restarting...");
        })
        .on("crash", function() {
            console.error("Application crashed!\n");
            stream.emit("restart", 10); // restart the server in 10 seconds
        });
}

/* ************
 * RELEASE
 **************/
const ready = parallel(test, audit, lint, coverage, docs);

function audit(done) {
    let cmd = "npm";
    let args = [
        "audit",
    ];
    let opts = {
        stdio: "inherit",
    };
    let aud = spawn(cmd, args, opts).on("close", done);
}

module.exports = {
    audit,
    test,
    "test:quiet": testQuiet,
    lint,
    coverage,
    docs,
    ready,
    "default": watchTest,
    "dev:test": watchTest,
    "dev:lint": watchLint,
    "dev:coverage": watchCoverage,
    "dev:docs": watchDocs,
    "dev:main": watchMain,
};
