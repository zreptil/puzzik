"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
// @ts-ignore
var xliff_1 = require("xliff");
var fileList = [];
// const lng = localStorage.getItem('language') || 'de-DE';
var outFile = '../src/locale/messages.json';
// Erzeugt aus den Dateien messages.xxx.xlf die Datei messages.json
// createJson(['de-DE', 'en-GB'], []);
createJson(['de-DE'], []);
// createJson(['de-DE'], []);
function createJson(codes, list) {
    var file = "../src/locale/messages.".concat(codes[0], ".xlf");
    var content = fs.readFileSync(getPath(file)).toString();
    parseTranslationsForLocalize(content).then(function (result) {
        list.push({ id: codes[0], data: result });
        codes.splice(0, 1);
        if (codes.length === 0) {
            fs.writeFileSync(getPath(outFile), JSON.stringify(list));
            console.log("Die Datei ".concat(getPath(outFile), " wurde erstellt"));
        }
        else {
            createJson(codes, list);
        }
        //  console.log('Geladene Übersetzungen', result);
        //  loadTranslations(parsedTranslations);
    });
}
function getPath(dir, file) {
    if (dir.startsWith('.') || dir.startsWith('/')) {
        return file ? path.join(__dirname, dir, file) : path.join(__dirname, dir);
    }
    return file ? path.join(dir, file) : dir;
}
function parseTranslationsForLocalize(xml) {
    return xliff_1["default"].xliff12ToJs(xml).then(function (parserResult) {
        var xliffContent = parserResult.resources['ng2.template'];
        //    console.log('xliff', xliffContent);
        return Object.keys(xliffContent)
            .reduce(function (result, current) {
            var elem = xliffContent[current].target;
            if (elem == null) {
                elem = xliffContent[current].source;
            }
            if (typeof elem === 'string') {
                result[current] = elem;
            }
            else {
                if (elem != null) {
                    // console.log(elem);
                    result[current] = elem.map(function (entry) {
                        return typeof entry === 'string' ? entry : '{$' + entry['Standalone'].id + '}';
                        //              return typeof entry === 'string' ? entry : '{$' + entry.Standalone['equiv-text'] + '}';
                    }).map(function (entry) {
                        return entry;
                        //                .replace('{{', '{$')
                        //                .replace('}}', '}');
                    }).join('');
                }
            }
            return result;
        }, {});
    });
}
