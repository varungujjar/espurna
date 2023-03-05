export const onWebSocketMessageHandler = (onWebSocketMessage: any, setValue: any, initFormData: any) => {
	console.log(onWebSocketMessage);
	Object.keys(onWebSocketMessage).forEach((key) => {
		const value = onWebSocketMessage[key];
		Object.keys(initFormData).forEach((keyForm) => {
			if (keyForm === key) {
				setValue(keyForm as any, value);
			}
		});
	});
};

export const formDirtyFields = (dirtyFields: object, getValues: any) => {
	let changedFields = {};
	Object.keys(dirtyFields).map(
		(fieldName) =>
			(changedFields = {
				...changedFields,
				[fieldName]: getValues(fieldName as any),
			})
	);
	return changedFields;
};

export const formReset = (reset: any) => {
	reset({}, { keepValues: true });
};
