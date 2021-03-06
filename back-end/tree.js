const math = require('mathjs')
const { Position, Direction } = require('./state.js')
const fs = require('fs')
const { STParser } = require('./stochastic-parser.js')

function logWrite(message, filename) {
    fs.writeFile(filename, message, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("Written to " + filename);
    });
}

function applyRules(letter, rules, iteration, final) {
    var iterativeRules = rules[iteration]

    if (final && (rules.final != undefined)) {
        if (letter in rules.final) {
            return rules.final[letter]
        }
    }
    if (!(iterativeRules == undefined)) {
        if (letter in iterativeRules) {
            return iterativeRules[letter]
        }
    }
    if (letter in rules.global) {
        return rules.global[letter]
    }
    return letter

}

exports.Tree = function(
        axiom,
        rules, 
        iterations,
        angle,
        forwardMovement,
        branchWidth,
        lengths,
        widths,
        leafAngle,
        leafLength,
        stochasticSymbols
    ) {
    this.type = 'Tree'
    this.axiom = axiom
    this.rules = rules
    this.iterations = iterations
    this.branchAngle = angle
    this.forwardMovement = forwardMovement
    this.branchWidth = branchWidth
    this.lengths = lengths
    this.widths = widths
    this.stochasticSymbols = stochasticSymbols
    
    this.instructions = ['No instructions set']
    this.branches = []
    this.leaves = []
    this.leafAngle = leafAngle
    this.leafLength = leafLength


    this.makeInstructions = function() {
        var tree = this.axiom
        this.iteration = 0
        this.finalIteration = false

        for (i=0;i<this.iterations;i++) {
            if(i > this.iterations - 2){
                this.finalIteration = true
            }
            this.iteration = i
            var tree2 = []

            var stochasticSwitch = false
            var stochasticGroup = []

            for (var x=0; x<tree.length;x++) {
                try {
                    if (tree[x] == "(") {
                        stochasticSwitch = true
                    } else if (tree[x] == ")") {
                        stochasticSwitch = false
                        var ST = new STParser(stochasticGroup, this.stochasticSymbols)
                        var returnedChoice = ST.interpretStochastic()
                        console.log(returnedChoice)
                        tree2.push(returnedChoice.split(''))
                    } else if (stochasticSwitch) {
                        stochasticGroup.push(tree[x])
                    } else {
                        tree2.push(applyRules(tree[x], this.rules, this.iteration, this.finalIteration).split(''))
                    }
            
                } catch(err) {
                    console.log(err)
                }
            }
            tree = tree2
            tree = [].concat.apply([], tree)
        }
        this.instructions = tree
    }

    this.makeBranches = function() {
        var progression = 0
        var bWidth = this.branchWidth
        var bLength = this.forwardMovement
        var currentPosition = new Position(0, 0, 0)
        var currentDirection = new Direction()
        var stateStack = []
        var newPosition = new Position()
        var leafMode = false
        this.angle = {}
        this.subleaf = []
        this.instructions.forEach(function(instruction) {
            if (leafMode) {
                this.angle.x = leafAngle.x
                this.angle.y = leafAngle.y
                this.angle.z = leafAngle.z
            } else {
                this.angle.x = this.branchAngle.x
                this.angle.y = this.branchAngle.y
                this.angle.z = this.branchAngle.z
            }
            switch(instruction) {
                case 'F':
                    extension = currentDirection.extend(bLength)
                    newPosition = new Position(
                        (extension.x + currentPosition.x), 
                        (extension.y + currentPosition.y),
                        (extension.z + currentPosition.z))
                    if (leafMode) {
                        this.subleaf.push({p0: currentPosition.makeObj(), p1: newPosition.makeObj()})
                    } else {
                        this.branches.push({p0: currentPosition.makeObj(), p1: newPosition.makeObj(), w: bWidth})
                    }
                    currentPosition.makeFromClone(newPosition.makeClone())
                    break
                case 'f':
                    var extension =  currentDirection.extend(this.forwardMovement * this.leafLength)

                    newPosition = new Position(
                        (extension.x + currentPosition.x), 
                        (extension.y + currentPosition.y),
                        (extension.z + currentPosition.z))

                    if (leafMode) {
                        this.subleaf.push(newPosition.makeObj())
                    } else {
                        this.branches.push({p0: currentPosition.makeObj(), p1: newPosition.makeObj(), w: bWidth})
                    }
                    currentPosition.makeFromClone(newPosition.makeClone())
                    break
                case '+':
                    currentDirection.rotateX(this.angle.x)
                    break
                case '-':
                    currentDirection.rotateX(-this.angle.x)
                    break
                case '&':
                    currentDirection.rotateZ(this.angle.z)
                    break    
                case '^':
                    currentDirection.rotateZ(-this.angle.z)
                    break
                case '=':
                    currentDirection.rotateY(this.angle.y)
                    break    
                case '/':
                    currentDirection.rotateY(-this.angle.y)
                    break
                case '|':
                    currentDirection.rotateX(180)
                    break
                case '[':
                    stateToStore = {"d": currentDirection.makeClone(), "p": currentPosition.makeClone()}
                    stateStack.push(stateToStore)
                    break
                    
                case ']' :
                    var currentState = stateStack.pop()
                    currentDirection = new Direction(currentState.d.H, currentState.d.L, currentState.d.U)
                    currentPosition = new Position()
                    currentPosition.makeFromClone(currentState.p)
                    break
                case '`':
                    if (leafMode) {
                        this.leaves.push(this.subleaf)
                    } else {
                        this.subleaf = []   
                    }
                    leafMode = (!leafMode)
                    break

                case '<':
                    progression++
                    bLength = this.forwardMovement * this.lengths[progression]
                    bWidth = this.branchWidth * this.widths[progression]
                    break
                    
                case '>':
                    if (progression>0){ progression-- }
                    bLength = this.forwardMovement * this.lengths[progression]
                    bWidth = this.branchWidth * this.widths[progression]
                    break
                
            }
        }, this)
        // console.log('Branches: ')
        // console.log(this.branches)
    }

    this.makeTree = function() {
        this.makeInstructions()
        this.makeBranches()
        logWrite(('Tree Instructions: ' + JSON.stringify(this.instructions) + '\n' + 'Branches: ' + JSON.stringify(this.branches)), 'tree-log.log')
        return {branches: this.branches, leaves: this.leaves}
    }
}
