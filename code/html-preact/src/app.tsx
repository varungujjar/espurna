import { useState } from 'preact/hooks';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Status } from './modules/Status';
import { Mqtt } from './modules/Mqtt';
import useWebsocket from './hooks/useWebsocket';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';

const App = () => {
	const { onWebSocketMessage, webSocketSend } = useWebsocket();
	const [selectedModule, setSelectedModule] = useState('status'); //Default module is status
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);
	const [unSavedSettings, setUnSavedSettings] = useState({});

	const selectedModuleHandler = (moduleName: String) => {
		setSelectedModule(String(moduleName));
	};
	const sidebarClickHandler = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	const onSubmitHandler = () => {
		const WebsocketData = { settings: { set: { ...unSavedSettings }, del: [] } };
		console.log(JSON.stringify(WebsocketData));
		webSocketSend(JSON.stringify(WebsocketData));
	};

	const onChangeUpdate = (event: any) => {
		setUnSavedSettings((prev) => ({ ...prev, [event.target.name]: event.target.value }));
		console.log(event.type);
	};

	return (
		<BrowserRouter>
			<div className="wrapper">
				<Sidebar selectedModule={selectedModuleHandler} />
				<div className={`content ${isSidebarOpen ? 'isOpen' : ''}`}>
					<Header sidebarClickHandler={sidebarClickHandler} selectedModule={selectedModule} />
					<div className="wrapper-content wrapper-overlap">
						<Status onWebSocketMessage={onWebSocketMessage} />
						<Mqtt
							onWebSocketMessage={onWebSocketMessage}
							onChangeUpdate={onChangeUpdate}
							onSubmitHandler={onSubmitHandler}
						/>
						{/* <Routes>
							<Route path="/" element={<Status onWebSocketMessage={onWebSocketMessage} />} />
							<Route path="/status" element={<Status onWebSocketMessage={onWebSocketMessage} />} />
							<Route path="/mqtt" element={<Mqtt onWebSocketMessage={onWebSocketMessage} />} />
						</Routes> */}
					</div>
					<Footer />
				</div>
			</div>
		</BrowserRouter>
	);
};

export default App;
