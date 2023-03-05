type InputProps = {
	label: string;
	name: string;
	type?: string;
	min?: number;
	max?: number;
	placeholder?: string;
	required?: boolean;
	register: any;
	errors?: any;
	errorsMessage?: string;
};

const Input = ({
	label,
	name,
	type = 'text',
	min,
	max,
	placeholder,
	required = false,
	register,
	errors,
	errorsMessage,
}: InputProps) => {
	const numberLimit = { min: min, max: max };

	return (
		<div className="form-group">
			<label>{label}</label>
			<input
				{...register(name, { required, ...numberLimit })}
				className="form-control"
				placeholder={placeholder}
				type={type}
			/>
			{errors && errors[name] && errorsMessage}
		</div>
	);
};

export default Input;
