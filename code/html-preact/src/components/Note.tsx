import type { ComponentChildren } from 'preact';

type INote = {
	type: string;
	children: ComponentChildren;
};

const Note = ({ type, children }: INote) => {
	return <div className={`note-${type}`}>{children}</div>;
};

export default Note;
