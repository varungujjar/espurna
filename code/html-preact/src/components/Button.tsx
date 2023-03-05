interface IButton {
	type?: string;
	text: string;
}

const Button = ({ type = 'button', text }: IButton) => {
	return (
		<button className="btn btn-lg btn-primary" type={type}>
			{text}
		</button>
	);
};

export default Button;
