var fs = require('fs')
var TC = require('./tree.js')

function logWrite(message) {
    fs.writeFile("tree-log.log", message, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("Written to log");
    });
}

var testTree2D = new TC.Tree2D()

testTree2D.makeTree()

logWrite('Tree Instructions: '+testTree2D.instructions)