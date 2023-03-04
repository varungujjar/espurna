import { useEffect, useState, useRef } from 'preact/hooks';

class UrlsBase {
	root: any;
	ws: any;
	[path: string]: any;
	constructor(root: any) {
		this.root = root;
		const paths = ['ws', 'upgrade', 'config', 'auth'];
		paths.forEach((path) => {
			this[path] = new URL(path, root);
			this[path].protocol = root.protocol;
		});

		if (this.root.protocol === 'https:') {
			this.ws.protocol = 'wss:';
		} else {
			this.ws.protocol = 'ws:';
		}
	}
}

const useWebsocket = () => {
	const ws: any = useRef(null);
	let WebsockPingPong: any = null;
	const [onWebSocketMessage, setOnWebSocketMessage] = useState({});

	const webSocketSend = (payload: String) => {
		ws.current.send(payload);
	};

	const sendAction = (action: any, data: any) => {
		webSocketSend(JSON.stringify({ action, data }));
	};

	function webSocketPing() {
		sendAction('ping', {});
	}

	const onWebSocketMessageFormat = (event: any) => {
		let data = {};
		try {
			data = JSON.parse(event.data.replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t'));
		} catch (e) {
			// notifyError(null, null, 0, 0, e);
		}
		setOnWebSocketMessage((prev) => ({ ...data }));
	};

	const onWebSocketOpen = () => {
		WebsockPingPong = setInterval(webSocketPing, 5000);
	};

	const onWebSocketClose = () => {
		clearInterval(WebsockPingPong);
		if (window.confirm('Connection lost with the device, click OK to refresh the page')) {
			window.location.reload();
		}
	};

	const webSocketConnect = () => {
		let url: any;
		const search = new URLSearchParams(window.location.search);
		let host = search.get('host');
		if (host !== null) {
			if (!host.startsWith('http:') && !host.startsWith('https:')) {
				host = 'http://' + host;
			}
			url = new URL(host);
		} else {
			url = new URL(String(window.location));
		}
		url = new URL('http://192.168.1.105');

		const urls = new UrlsBase(url);
		// setInterval(() => ntp.keepTime(), 1000);
		fetch(urls.auth.href, {
			method: 'GET',
			credentials: 'same-origin',
		})
			.then((response) => {
				if (response.status === 200) {
					ws.current = new WebSocket(urls.ws.href);
					ws.current.onmessage = onWebSocketMessageFormat;
					ws.current.onclose = onWebSocketClose;
					ws.current.onopen = onWebSocketOpen;
					// document.getElementById('downloader').href = urls.config.href;
					return;
				}
				// Nothing to do, reload page and retry on errors
				// util.notifyError(
				// 	`${Urls.ws.href} responded with status code ${response.status}, reloading the page`,
				// 	null,
				// 	0,
				// 	0,
				// 	null
				// );
				// pageReloadIn(5000);
			})
			.catch((error) => {
				// util.notifyError(null, null, 0, 0, error);
				// pageReloadIn(5000);
			});
	};

	useEffect(() => {
		webSocketConnect();
		console.log('remndering');
		return () => {
			clearInterval(WebsockPingPong);
			ws.current.disconnect();
		};
	}, []);

	return { onWebSocketMessage, webSocketSend, onWebSocketClose, onWebSocketOpen };
};

export default useWebsocket;
