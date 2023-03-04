import { Path, useForm, UseFormRegister, SubmitHandler } from 'react-hook-form';

type InputProps = {
	label: string;
	name: string;
	register: any;
	required?: boolean;
	errors: any;
	errorsMessage: string;
	placeholder: string;
};

const Input = ({ label, name, errors, placeholder, errorsMessage, register, required = false }: InputProps) => {
	return (
		<>
			<label>{label}</label>
			<input {...register(name, { required })} className="form-control" placeholder={placeholder} />
			{errors[name] && errorsMessage}
		</>
	);
};

export default Input;
