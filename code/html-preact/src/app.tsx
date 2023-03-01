import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useWebsocket from './hooks/useWebsocket';
import { Dashboard } from './modules/Dashboard';
import { Mqtt } from './modules/Mqtt';

const App = () => {
	const { onWebSocketMessage } = useWebsocket();
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<Dashboard onWebSocketMessage={onWebSocketMessage} />} />
				<Route path="/mqtt" element={<Mqtt onWebSocketMessage={onWebSocketMessage} />} />
			</Routes>
		</BrowserRouter>
	);
};

export default App;
