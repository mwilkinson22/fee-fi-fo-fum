import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

class TeamImage extends Component {
	render() {
		const { bucketPaths, team, useWebp, className, size, variant } = this.props;
		const { name, images } = team;
		let src = images[variant] || images.main;

		//Determine if it's a raster
		const isRaster = ["png", "jpg", "jpeg"].indexOf(src.split(".").pop().toLowerCase()) > -1;

		if (isRaster) {
			//If a size is defined, look in the corresponding folder
			if (size) {
				const splitSrc = src.split("/");
				const filename = splitSrc.pop();
				src = `${splitSrc.join("/")}${size}/${filename}`;
			}

			//If webp is supported, change the extension
			if (useWebp) {
				src = src.replace(/\.[a-z]+$/, ".webp");
			}
		}
		return (
			<img
				src={`${bucketPaths.images.teams}${src}`}
				className={`team-image ${className}`}
				alt={name.long}
				title={name.long}
				key={team._id + new Date().getTime()}
			/>
		);
	}
}

function mapStateToProps({ config }) {
	const { bucketPaths, webp } = config;
	return {
		bucketPaths,
		useWebp: webp
	};
}

TeamImage.propTypes = {
	className: PropTypes.string,
	team: PropTypes.object.isRequired,
	size: PropTypes.oneOf([null, "medium", "small"])
};

TeamImage.defaultProps = {
	className: "",
	size: null
};

export default connect(mapStateToProps)(TeamImage);
