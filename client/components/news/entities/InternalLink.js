//Modules
import React from "react";
import { Link } from "react-router-dom";

const InternalLink = ({ entityKey, children, contentState }) => {
	const { url } = contentState.getEntity(entityKey).getData();
	return (
		<Link className="editor__link" to={url} title={url}>
			{children}
		</Link>
	);
};

export default InternalLink;
