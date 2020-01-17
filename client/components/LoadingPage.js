import React from "react";

const LoadingPage = props => {
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

export default LoadingPage;
