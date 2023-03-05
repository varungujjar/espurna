interface ISelect {
	label: string;
	name: string;
	options: object;
	required?: boolean;
	register: any;
	errors?: any;
	errorsMessage?: string;
}

const Select = ({ label, name, options, required = false, register, errors, errorsMessage }: ISelect) => {
	return (
		<div className="form-group">
			<div className="form-check">
				<label for={name}>{label}</label>
				<select {...register(name, { required })} className="form-control">
					{Object.entries(options).map(([value, option]) => (
						<option value={value}>{option}</option>
					))}
				</select>
			</div>
			{errors && errors[name] && errorsMessage}
		</div>
	);
};

export default Select;
