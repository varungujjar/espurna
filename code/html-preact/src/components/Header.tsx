import { MODULES } from '../config';

type iHeader = {
	sidebarClickHandler: any;
	selectedModule: any;
};

const Header = ({ sidebarClickHandler, selectedModule }: iHeader) => {
	return (
		<div className="header">
			<div className="sidebar-button" onClick={sidebarClickHandler}>
				<div className="sidebar-line"></div>
				<div className="sidebar-line"></div>
				<div className="sidebar-line sidebar-line-half"></div>
			</div>
			<div className="wrapper-content">
				<div id="error-notification"></div>
				<div className="header-info">
					<h1>Sensor</h1>
					<h3 data-key="app_version">Version 1.5.6</h3>
				</div>
			</div>
		</div>
	);
};

export default Header;
