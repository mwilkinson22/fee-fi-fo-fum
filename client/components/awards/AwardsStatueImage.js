//Modules
import React from "react";
import { connect } from "react-redux";

//Constants
import { imagePath } from "../../extPaths";

function AwardsStatueImage({ webp }) {
	return (
		<img src={`${imagePath}awards/statue.${webp ? "webp" : "png"}`} className="award-statue" />
	);
}

function mapStateToProps({ config }) {
	const { webp } = config;
	return { webp };
}

export default connect(mapStateToProps)(AwardsStatueImage);
