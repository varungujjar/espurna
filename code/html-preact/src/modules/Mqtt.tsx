import { useEffect } from 'preact/hooks';
import { useForm, SubmitHandler } from 'react-hook-form';
import { onWebSocketMessageHandler, formDirtyFields, formReset } from '../helpers';
import Panel from '../components/Panel';
import PanelBlock from '../components/PanelBlock';
import Input from '../components/Input';
import Select from '../components/Select';
import Checkbox from '../components/Checkbox';
import Button from '../components/Button';
import Note from '../components/Note';

interface IMqtt {
	onWebSocketMessage: any;
	selectedModule: string;
	onFormChange: any;
}
interface IFormValues {
	mqttEnabled: boolean;
	mqttStatus: string;
	mqttServer: string;
	mqttPort: string;
	mqttUser: string;
	mqttPassword: string;
	mqttClientID: string;
	mqttQoS: string;
	mqttKeep: any;
	mqttRetain: boolean;
	mqttTopic: string;
	mqttUseJson: boolean;
}

export function Mqtt({ onWebSocketMessage, selectedModule, onFormChange }: IMqtt) {
	const initFormData: IFormValues = {
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

	const {
		formState: { dirtyFields },
		register,
		handleSubmit,
		setValue,
		getValues,
		reset,
		formState: { errors },
	} = useForm<IFormValues>({ defaultValues: { ...initFormData }, reValidateMode: 'onChange' });

	const onSubmit: SubmitHandler<IFormValues> = () => {
		const dirtyFieldsObject = formDirtyFields(dirtyFields, getValues);
		onFormChange(dirtyFieldsObject);
		formReset(reset);
	};

	useEffect(() => {
		onWebSocketMessageHandler(onWebSocketMessage, setValue, initFormData);
	}, [onWebSocketMessage]);

	return (
		<Panel name="mqtt" selectedModule={selectedModule}>
			<form onSubmit={handleSubmit(onSubmit)}>
				<PanelBlock title="Service">
					<Checkbox label="Enable MQTT" name="mqttEnabled" register={register} />
				</PanelBlock>

				<PanelBlock title="MQTT Server">
					<div className="row">
						<div className="col-md-6">
							<Input
								label="MQTT Broker"
								name="mqttServer"
								placeholder="IP Or Address Of Your Broker"
								register={register}
								errors={errors}
								errorsMessage={'This is required.'}
								required
							/>
						</div>
						<div className="col-md-6">
							<Input
								label="MQTT Port"
								name="mqttPort"
								placeholder="1883"
								register={register}
								errors={errors}
								errorsMessage={'This is required.'}
								required
							/>
						</div>
					</div>
					<div className="row">
						<div className="col-md-6">
							<Input label="MQTT User" name="mqttUser" register={register} />
						</div>
						<div className="col-md-6">
							<Input label="MQTT Password" name="mqttPassword" register={register} />
						</div>
					</div>
					<Note type="default">MQTT User : You can use the following placeholders: hostname,mac </Note>
					<Input label="MQTT Client ID" name="mqttClientID" register={register} />
					<Note type="default">
						If left empty the firmware will generate a client ID based on the serial number of the chip.
					</Note>
					<div className="row">
						<div className="col-md-6">
							<Select
								label="MQTT QoS"
								name="mqttQoS"
								options={{ 0: '0: At most once', 1: '1: At least once', 2: '2: Exactly once' }}
								register={register}
								errors={errors}
							/>
						</div>
					</div>
					<Checkbox label="MQTT Retain" name="mqttRetain" register={register} />
					<Input
						label="MQTT Keep Alive"
						name="mqttKeep"
						type="number"
						register={register}
						min={0}
						max={3600}
						errors={errors}
						errorsMessage="Number to be between 0 and 3600"
					/>
					<div className="module module-mqttssl">
						<Checkbox label="Use Secure Connection (SSL)" name="mqttUseSSL" register={register} />
						<Input label="SSL Fingerprint" name="mqttFP" register={register} />
						<Note type="info">
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
						</Note>
					</div>
					<Input label="MQTT Root Topic" name="mqttTopic" placeholder="<root>/<status>" register={register} />
					<Note type="default">
						This is the root topic for this device. The hostname and mac placeholders will be replaced by the device
						hostname and MAC address.
						<br />- <strong>&lt;root&gt;/status</strong> The device will report a 1 to this topic every few minutes.
						Upon MQTT disconnecting this will be set to 0.
						<br />- Other values reported (depending on the build) are: <strong>firmware</strong> and
						<strong>version</strong>,<strong>hostname</strong>, <strong>IP</strong>, <strong>MAC</strong>, signal
						strenth (<strong>RSSI</strong>),
						<strong>uptime</strong> (in seconds), <strong>free heap</strong> and <strong>power supply</strong>.
					</Note>
					<Checkbox label="Use JSON payload" name="mqttUseJson" register={register} />
					<Note type="default">
						All messages (except the device status) will be included in a JSON payload along with the timestamp and
						hostname and sent under the <strong>&lt;root&gt;/data</strong> topic.
						<br />
						Messages will be queued and sent after 100ms, so different messages could be merged into a single payload.
						<br />
						Subscribtions will still be done to single topics.
					</Note>

					<Button type="submit" text="Save Settings" />
				</PanelBlock>
			</form>
		</Panel>
	);
}
