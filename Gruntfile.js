module.exports = function (grunt) {
    grunt.initConfig({
        ts: {
            default: {
                tsconfig: './tsconfig.json'
            }
        },
        watch: {
            files: "src/*",
            tasks: "default"
        }
    });
    function buildtime() {
        var x = new Date();
        var y = x.getFullYear().toString();
        var m = (x.getMonth() + 1).toString();
        var d = x.getDate().toString();
        var h = x.getHours().toString();
        var mi = x.getMinutes().toString();
        var s = x.getSeconds().toString();
        (d.length == 1) && (d = '0' + d);
        (m.length == 1) && (m = '0' + m);
        (h.length == 1) && (h = '0' + h);
        (mi.length == 1) && (mi = '0' + mi);
        (s.length == 1) && (s = '0' + s);

        var yyyymmdd = y + m + d + h + mi + s;
        return yyyymmdd;
    }
    grunt.loadNpmTasks("grunt-ts");
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.registerTask("add-build-meta", "adds build metadata", function () {
        grunt.file.write("bin/Internal/build.json", JSON.stringify({
            "build-meta": buildtime()
        }));
    });
    grunt.registerTask("default", ["ts", "add-build-meta"]);
};