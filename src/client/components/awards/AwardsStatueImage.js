//Modules
import React from "react";
import { connect } from "react-redux";

function AwardsStatueImage({ bucketPaths, webp }) {
	return (
		<img
			src={`${bucketPaths.imageRoot}awards/statue.${webp ? "webp" : "png"}`}
			className="award-statue"
			alt="Award Statue"
		/>
	);
}

function mapStateToProps({ config }) {
	const { bucketPaths, webp } = config;
	return { bucketPaths, webp };
}

export default connect(mapStateToProps)(AwardsStatueImage);
