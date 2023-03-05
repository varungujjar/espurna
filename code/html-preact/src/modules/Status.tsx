import { useEffect } from 'preact/hooks';

interface IStatus {
	onWebSocketMessage: any;
	selectedModule: string;
	onFormChange: any;
}

export function Status({ onWebSocketMessage, selectedModule, onFormChange }: IStatus) {
	useEffect(() => {
		// console.log(onWebSocketMessage);
	}, [onWebSocketMessage]);

	return (
		<div className={`panel panel-bg ${selectedModule === 'status' && 'panel-show'}`}>
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
	);
}
