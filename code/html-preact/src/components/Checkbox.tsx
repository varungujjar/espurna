interface ICheckbox {
	label: string;
	name: string;
	required?: boolean;
	register: any;
	errors?: any;
	errorsMessage?: string;
}

const Checkbox = ({ label, name, required = false, register, errors, errorsMessage }: ICheckbox) => {
	return (
		<div className="form-group">
			<div className="form-check">
				<span className="checkbox-label-bold">{label}</span>
				<input {...register(name, { required })} className="check-toggle" type="checkbox" id={name} />
				<label for={name} className="checkbox-label"></label>
			</div>
			{errors && errors[name] && errorsMessage}
		</div>
	);
};

export default Checkbox;
