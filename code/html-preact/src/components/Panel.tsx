import type { ComponentChildren } from 'preact';
import { MODULES } from '../config';

interface IPanel {
	name: string;
	selectedModule: string;
	children: ComponentChildren;
}

const Panel = ({ name, selectedModule, children }: IPanel) => {
	return (
		<div className={`panel panel-bg ${selectedModule === name && 'panel-show'}`}>
			<h1>{MODULES[name]}</h1>
			{children}
		</div>
	);
};

export default Panel;
