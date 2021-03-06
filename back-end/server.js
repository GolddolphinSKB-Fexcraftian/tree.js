const http = require('http');
const { Tree } = require('./tree');

const hostname = '0.0.0.0';
const port = process.env.PORT || 3001;
const server = http.createServer(function(request, response) {
  response.statusCode = 200;
  response.setHeader('Content-Type', 'application/json')
  response.setHeader('Access-Control-Allow-Origin', '*')
  response.setHeader('Access-Control-Allow-Methods',"POST, OPTIONS")
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Origin, Access-Control-Allow-Credentials, Access-Control-Allow-Headers, Access-Control-Allow-Methods')
  response.setHeader('Access-Control-Max-Age', '86400')

  if (request.method === 'POST') {
    var body = ''
    request.on('data', chunk => {
      body += chunk.toString()
    })
    request.on('end', () => {
      const treeConfig = JSON.parse(body)
      var requestedBranches = new Tree(
        treeConfig.axiom,
        treeConfig.rules,
        treeConfig.iterations,
        treeConfig.angle,
        treeConfig.forwardMovement,
        treeConfig.branchWidth,
        treeConfig.lengths,
        treeConfig.widths,
        treeConfig.leafAngle,
        treeConfig.leafLength,
        treeConfig.stochasticSymbols)
      response.end(JSON.stringify(requestedBranches.makeTree()))
    })
  } else {
    response.end()
  }
})

server.listen(port, hostname, function() {
    console.log('Server running at http://'+ hostname + ':' + port + '/');
})