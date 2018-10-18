const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const md5 = require('md5');
const WebSocket = require('ws');
const yaml = require('js-yaml');
require('log-timestamp');

// you can pass the parameter in the command line. e.g. node server.js 3000
const port = process.argv[2] || 9000;

// maps file extention to MIME types
const mimeType = {
	'.ico': 'image/x-icon',
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.json': 'application/json',
	'.css': 'text/css',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.wav': 'audio/wav',
	'.svg': 'image/svg+xml',
	'.pdf': 'application/pdf'
};

const server = http.createServer(function (req, res) {
	console.log(`${req.method} ${req.url}`);

	// parce URL
	const parsedUrl = url.parse(req.url);

	// extract URL path
  // Avoid https://en.wikipedia.org/wiki/Directory_traversal_attack
  // e.g curl --path-as-is http://localhost:9000/../fileInDanger.txt
  // by limiting the path to current directory only
  const sanitizePath = path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
  let pathname = path.join(__dirname, sanitizePath);
  fs.exists(pathname, function (exist) {
    if(!exist) {
      // if the file is not found, return 404
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return;
    }
    // if is a directory, then look for index.html
    if (fs.statSync(pathname).isDirectory()) {
      pathname += '/index.html';
    }
    // read file from file system
    fs.readFile(pathname, function(err, data){
      if(err){
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        // based on the URL path, extract the file extention. e.g. .js, .doc, ...
        const ext = path.parse(pathname).ext;
        // if the file is found, set Content-type and send data
        res.setHeader('Content-type', mimeType[ext] || 'text/plain' );


		// Website you wish to allow to connect
		res.setHeader('Access-Control-Allow-Origin', 'http://localhost:1234');

		// Request methods you wish to allow
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

		// Request headers you wish to allow
		res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

		// Set to true if you need the website to include cookies in the requests sent
		// to the API (e.g. in case you use sessions)
		res.setHeader('Access-Control-Allow-Credentials', true);

        res.end(data);
      }
    });
  });
});

const wss = new WebSocket.Server({ server: server });

wss.on('connection', function connection(ws) {

	function sendNotification(msg) {
		ws.send('file changed');
	}

	ws.on('message', function incoming(message) {
		console.log('received: %s', message);
	})

	ws.on('open', function open() {
		ws.send('on open')
	})

	const watchFile = './swagger.yaml';

	console.log(`Watching for file changes on ${watchFile}`);

	let md5Previous = null;
	let fsWait = false;
	fs.watch(watchFile, (event, filename) => {
		if (filename) {
			if (fsWait) return;
			fsWait = setTimeout(() => {
				fsWait = false;
			}, 100);
			const md5Current = md5(fs.readFileSync(watchFile));
			if (md5Current === md5Previous) {
				return;
			}
			md5Previous = md5Current;
			console.log(`${filename} file Changed`);
			//this.sendNotification('file changed')
			try {
				var doc = yaml.safeLoad(fs.readFileSync(watchFile, 'utf8'));
				console.log('yaml => json')
				fs.writeFile('swagger.json', JSON.stringify(doc, null, 2), (err) => {
					if (err) throw err;
					console.log('swagger.json updated');
					if (ws.readyState = 1) ws.send('file changed');
				})
			} catch (e) {
				console.log('failed to parse yaml')
				var stringifyError = function(err, filter, space) {
					var plainObject = {};
					Object.getOwnPropertyNames(err).forEach(function(key) {
						plainObject[key] = err[key];
					})
					return JSON.stringify(plainObject, filter, space)
				}
				ws.send(stringifyError(e, null, '\t'));
			}
		}
	});
});

server.listen(parseInt(port));
console.log('Server listening on port http://localhost:9000');
