import main from './main.js';

let url = 'http://localhost:9000/swagger.json';
window.SWAGGER_FILE  = url
window.onload =  main.load

const ws = new WebSocket('ws://localhost:9000');
let consl = document.getElementById('console');

ws.addEventListener('open', function open() {
	ws.send('client open');
});

ws.addEventListener('message', function incoming(data) {
	hideConsole()
	console.log('from server', data)
	if (data.data === 'file changed') {
		main.load()
	} else {
		let errorMessage = JSON.parse(data.data).message
		console.log(errorMessage)
		showConsole(errorMessage)
	}
});

function showConsole(msg) {
	consl.innerHTML = msg
	consl.classList.add("show")
}

function hideConsole()
{
	consl.innerHTML = "";
	consl.classList.remove("show")
}
