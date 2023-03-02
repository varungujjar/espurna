import { useEffect, useState } from 'preact/hooks';

export function Mqtt({
	onWebSocketMessage,
	onChangeUpdate,
	onSubmitHandler,
}: {
	onWebSocketMessage: any;
	onChangeUpdate: any;
	onSubmitHandler: any;
}) {
	const initFormData: any = {
		mqttEnabled: false,
		mqttStatus: '',
		mqttServer: '',
		mqttPort: '1883',
		mqttUser: '',
		mqttPassword: '',
		mqttClientID: '',
		mqttQoS: '',
		mqttKeep: '',
		mqttRetain: false,
		mqttTopic: '',
		mqttUseJson: false,
	};
	const [formData, setFormData] = useState(initFormData);

	const onWebSocketMessageHandler = (onWebSocketMessage: any) => {
		console.log(onWebSocketMessage);
		Object.keys(onWebSocketMessage).forEach((key) => {
			let value = onWebSocketMessage[key];
			Object.keys(initFormData).forEach((keyForm) => {
				if (keyForm === key) {
					setFormData((prev: any) => ({ ...prev, [keyForm]: value }));
				}
			});
		});
	};

	const onChangeHandler = (event: any) => {
		setFormData((prev: any) => ({ ...prev, [event.target.name]: event.target.value }));
		onChangeUpdate(event);
	};

	useEffect(() => {
		onWebSocketMessageHandler(onWebSocketMessage);
		console.log(onWebSocketMessage);
	}, [onWebSocketMessage]);

	return (
		<div id="panel-mqtt" className="panel panel-bg">
			<h1>MQTT</h1>
			<h2>Enable Service</h2>
			<div className="wrapper-inner pb-0">
				<div className="form-group">
					<div className="form-check">
						<span className="checkbox-label-bold">Enable MQTT</span>
						<input type="checkbox" name="mqttEnabled" id="mqttEnabled" className="check-toggle" />
						<label for="mqttEnabled" className="checkbox-label"></label>
					</div>
				</div>
			</div>

			<div className="mqtt-enable">
				<h2>MQTT Server </h2>
				<div className="wrapper-inner pb-0">
					<div className="row">
						<div className="col-md-6">
							<div className="form-group">
								<label for="mqttServer">MQTT Broker</label>
								<input
									type="text"
									className="form-control"
									placeholder="IP Or Address Of Your Broker"
									name="mqttServer"
									value={formData.mqttServer}
									onChange={onChangeHandler}
								/>
							</div>
						</div>
						<div className="col-md-6">
							<div className="form-group">
								<label for="mqttPort">MQTT Port</label>
								<input
									type="number"
									className="form-control"
									name="mqttPort"
									value={formData.mqttPort}
									onChange={onChangeHandler}
								/>
							</div>
						</div>
					</div>
					<div className="row">
						<div className="col-md-6">
							<div className="form-group">
								<label for="mqttUser">MQTT User</label>
								<input
									type="text"
									className="form-control"
									placeholder="Leave Blank If No User"
									name="mqttUser"
									value={formData.mqttUser}
									onChange={onChangeHandler}
								/>
							</div>
						</div>
						<div className="col-md-6">
							<div className="form-group">
								<label for="mqttPassword">MQTT Password</label>
								<input
									type="password"
									className="form-control"
									placeholder="Leave Blank If No Password"
									name="mqttPassword"
									value={formData.mqttPass}
									onChange={onChangeHandler}
								/>
							</div>
						</div>
					</div>
					<div className="note-default">MQTT User : You can use the following placeholders: hostname,mac </div>
					<div className="form-group">
						<label for="mqttClientID">MQTT Client ID</label>
						<input type="text" className="form-control" name="mqttClientID" />
					</div>
					<div className="note-default">
						If left empty the firmware will generate a client ID based on the serial number of the chip.
					</div>
					<div className="row">
						<div className="col-md-6">
							<div className="form-group">
								<label for="mqttQoS">MQTT QoS</label>
								<select className="form-control" name="mqttQoS">
									<option value="0">0: At most once</option>
									<option value="1">1: At least once</option>
									<option value="2">2: Exactly once</option>
								</select>
							</div>
						</div>
					</div>
					<div className="form-group">
						<div className="form-check">
							<span className="checkbox-label-bold">MQTT Retain</span>
							<input type="checkbox" name="mqttRetain" id="mqttRetain" className="check-toggle" />
							<label for="mqttRetain" className="checkbox-label"></label>
						</div>
					</div>
					<div className="form-group">
						<label>MQTT Keep Alive</label>
						<input className="form-control" type="number" name="mqttKeep" min="10" max="3600" />
					</div>
					<div className="module module-mqttssl">
						<div className="form-group">
							<div className="form-check">
								<span className="checkbox-label-bold">Use Secure Connection (SSL)</span>
								<input type="checkbox" name="mqttUseSSL" id="mqttUseSSL" className="check-toggle" />
								<label for="mqttUseSSL" className="checkbox-label"></label>
							</div>
						</div>
						<div className="form-group">
							<label for="mqttFP">SSL Fingerprint</label>
							<input type="text" className="form-control" name="mqttFP" />
							<div className="note-info">
								This is the fingerprint for the SSL certificate of the server.
								<br />
								You can get it using
								<a href="https://www.grc.com/fingerprints.htm" target="_blank">
									https://www.grc.com/fingerprints.htm
								</a>
								<br />
								or using openssl from a linux box by typing:
								<br />
								<br />
								<pre>
									$ openssl s_client -connect &lt;host&gt;:&lt;port&gt; &lt; /dev/null 2&gt;/dev/null | openssl x509
									-fingerprint -noout -in /dev/stdin
								</pre>
							</div>
						</div>
					</div>
					<div className="form-group">
						<label>MQTT Root Topic</label>
						<input className="form-control" name="mqttTopic" type="text" />
					</div>
					<div className="note-default">
						This is the root topic for this device. The hostname and mac placeholders will be replaced by the device
						hostname and MAC address.
						<br />- <strong>&lt;root&gt;/status</strong> The device will report a 1 to this topic every few minutes.
						Upon MQTT disconnecting this will be set to 0.
						<br />- Other values reported (depending on the build) are: <strong>firmware</strong> and
						<strong>version</strong>,<strong>hostname</strong>, <strong>IP</strong>, <strong>MAC</strong>, signal
						strenth (<strong>RSSI</strong>),
						<strong>uptime</strong> (in seconds), <strong>free heap</strong> and <strong>power supply</strong>.
					</div>
					<div className="form-group">
						<div className="form-check">
							<span className="checkbox-label-bold">Use JSON payload</span>
							<input type="checkbox" name="mqttUseJson" id="mqttUseJson" className="check-toggle" />
							<label for="mqttUseJson" className="checkbox-label"></label>
						</div>
						<div className="note-default">
							All messages (except the device status) will be included in a JSON payload along with the timestamp and
							hostname and sent under the <strong>&lt;root&gt;/data</strong> topic.
							<br />
							Messages will be queued and sent after 100ms, so different messages could be merged into a single payload.
							<br />
							Subscribtions will still be done to single topics.
						</div>
					</div>
				</div>
			</div>
			<div className="wrapper-inner">
				<div className="form-group m-20">
					<button className="btn btn-lg btn-primary button-update" onClick={onSubmitHandler}>
						Save Settings
					</button>
				</div>
			</div>
		</div>
	);
}
