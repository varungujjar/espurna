import { useState } from 'preact/hooks';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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

	const selectedModuleHandler = (moduleName: String) => {
		setSelectedModule(String(moduleName));
	};
	const sidebarClickHandler = () => {
		setIsSidebarOpen(!isSidebarOpen);
	};

	const onFormChangeHandler = (data: any) => {
		const WebsocketData = { settings: { set: { ...data }, del: [] } };
		webSocketSend(JSON.stringify(WebsocketData));
		console.log(data);
	};

	return (
		<BrowserRouter>
			<div className="wrapper">
				<Sidebar selectedModule={selectedModuleHandler} />
				<div className={`content ${isSidebarOpen && 'isOpen'}`}>
					<Header sidebarClickHandler={sidebarClickHandler} selectedModule={selectedModule} />
					<div className="wrapper-content wrapper-overlap">
						<Status
							onWebSocketMessage={onWebSocketMessage}
							selectedModule={selectedModule}
							onFormChange={onFormChangeHandler}
						/>
						<Mqtt
							onWebSocketMessage={onWebSocketMessage}
							selectedModule={selectedModule}
							onFormChange={onFormChangeHandler}
						/>
					</div>
					<Footer />
				</div>
			</div>
		</BrowserRouter>
	);
};

export default App;
