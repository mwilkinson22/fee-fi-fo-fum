//Modules
import React from "react";

const ExternalLink = ({ entityKey, children, contentState }) => {
	const { url } = contentState.getEntity(entityKey).getData();
	return (
		<a className="editor__link" href={url} target="_blank" rel="noopener noreferrer">
			{children}
		</a>
	);
};

export default ExternalLink;
