import React from "react";

export default props => {
	const style = {};
	if (props.fullpage) style.height = "70vh";
	return (
		<div style={style}>
			<div className="loading-spinner" />
		</div>
	);
};
