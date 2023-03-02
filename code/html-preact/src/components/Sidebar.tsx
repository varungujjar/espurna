import { Link } from 'react-router-dom';
import { MODULES } from '../config';

type iSidebar = {
	selectedModule: any;
};

const Sidebar = ({ selectedModule }: iSidebar) => {
	const Item = ({ item }: { item: any }) => {
		const _name = item[0];
		const name = item[1];

		return (
			<li>
				<Link
					to={`/${_name}`}
					className="menu-link"
					data-panel={`panel-${_name}`}
					onClick={() => selectedModule(_name)}
				>
					<span className={`icon ${_name}`}></span>
					{name}
				</Link>
			</li>
		);
	};

	return (
		<div className="sidebar">
			<ul className="nav">
				{Object.entries(MODULES).map((item: any) => (
					<Item item={item} />
				))}
			</ul>
		</div>
	);
};

export default Sidebar;
