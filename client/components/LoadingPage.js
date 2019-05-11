import React from "react";

export default props => {
	const style = {};
	if (props.fullpage) {
		style.height = "70vh";
	}
	return (
		<div style={style} className={props.className}>
			<div className="loading-spinner" />
		</div>
	);
};
