import type { ComponentChildren } from 'preact';

interface IPanelBlock {
	title: string;
	children: ComponentChildren;
}

const PanelBlock = ({ title, children }: IPanelBlock) => {
	return (
		<div className="panel-block">
			<h2>{title}</h2>
			{children}
		</div>
	);
};

export default PanelBlock;
