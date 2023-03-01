import { useState, useEffect } from 'preact/hooks';
import { Link } from 'react-router-dom';

export function Mqtt({ onWebSocketMessage }: { onWebSocketMessage: any }) {
	const [isOpen, setIsOpen] = useState(false);

	const sidebarClickHandler = () => {
		setIsOpen(!isOpen);
	};

	useEffect(() => {
		console.log(onWebSocketMessage);
	}, [onWebSocketMessage]);

	return (
		<div className="wrapper">
			<div className="sidebar">
				<ul className="nav">
					<li>
						<Link to="/" className="menu-link" data="panel-dashboard">
							<span className="icon dashboard"></span>Dashboard
						</Link>
					</li>
					<li>
						<a href="#" className="menu-link" data="panel-wifi">
							<span className="icon wifi"></span>WiFi
						</a>
					</li>
					<li>
						<Link to="/mqtt" className="menu-link" data="panel-mqtt">
							<span className="icon mqtt"></span>MQTT
						</Link>
					</li>
					<li className="enable-dev">
						<a href="#" className="menu-link" data="panel-ntp">
							<span className="icon ntp"></span>Date & Time
						</a>
					</li>
					<li className="enable-dev">
						<a href="#" className="menu-link" data="panel-sensors">
							<span className="icon ntp"></span>Sensors
						</a>
					</li>
					<li>
						<a href="#" className="menu-link" data="panel-admin">
							<span className="icon general"></span>Admin
						</a>
					</li>
				</ul>
			</div>
			<div className={`content ${isOpen ? 'isOpen' : ''}`}>
				<div className="header">
					<div className="sidebar-button" onClick={sidebarClickHandler}>
						<div className="sidebar-line"></div>
						<div className="sidebar-line"></div>
						<div className="sidebar-line sidebar-line-half"></div>
					</div>
					<div className="wrapper-content">
						<div id="error-notification"></div>
						<div className="header-info">
							<h1>Indoor MQTT</h1>
							<h3 data-key="app_version">...</h3>
						</div>
					</div>
				</div>
				<div className="wrapper-content wrapper-overlap">
					<div id="panel-dashboard" className="panel">
						<div className="card card-red wifiStatus">
							<div className="card-icon">
								<span className="icon icon-wifi"></span>
							</div>
							<div className="card-details">
								<div className="card-inner">
									<div className="card-details-title" data-key="network">
										...
									</div>
									<div className="card-details-data m-1">
										<span className="card-details-unit text-bold" data-key="deviceip">
											...
										</span>
									</div>
								</div>
							</div>
							<div className="card-config">
								<a href="#" className="icon icon-settings menu-link" data="panel-wifi"></a>
							</div>
						</div>
						<div className="card mqttStatus card-default">
							<div className="card-icon">
								<span className="icon icon-mqtt"></span>
							</div>
							<div className="card-details ">
								<div className="card-inner">
									<div className="card-details-title">MQTT</div>
									<div className="card-details-data m-1">
										<span className="card-details-unit text-bold " data-key="mqttStatus">
											...
										</span>
									</div>
								</div>
							</div>
							<div className="card-config">
								<a href="#" className="icon icon-settings menu-link" data="panel-mqtt"></a>
							</div>
						</div>
						<div className="card ntpStatus">
							<div className="card-icon">
								<span className="icon icon-clock"></span>
							</div>
							<div className="card-details">
								<div className="card-inner">
									<div className="card-details-title" data-key="now">
										0000-00-00 --:--:--
									</div>
									<div className="card-details-data m-1">
										<span className="card-details-unit text-bold" data-key="ntpStatus">
											...
										</span>
									</div>
								</div>
							</div>
							<div className="card-config enable-dev">
								<a href="#" className="icon icon-settings menu-link" data="panel-ntp"></a>
							</div>
						</div>
						<div id="magnitudes"></div>
					</div>
					<div className="clr"></div>

					<div className="clr"></div>
				</div>
				<div className="footer">
					<div className="wrapper-content">©2023 Kenosis Solution.Designed & Engineered in India.</div>
				</div>
			</div>
		</div>
	);
}
