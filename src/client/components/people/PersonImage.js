import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

class PersonImage extends Component {
	render() {
		const { bucketPaths, className, person, useWebp, size, variant } = this.props;
		const { images, name, gender } = person;
		const { first, last } = name;

		//Get the correct image
		let image;
		if (images) {
			image = images[variant] || images.main;
		}
		if (!image) {
			image = `blank-${gender}.png`;
		}

		//Determine if it's a raster
		const isRaster = ["png", "jpg", "jpeg"].indexOf(image.split(".").pop().toLowerCase()) > -1;

		if (isRaster) {
			//If a size is defined, look in the corresponding folder
			if (size) {
				image = `${size}/${image}`;
			}

			//If webp is supported, change the extension
			if (useWebp) {
				image = image.replace(/\.[a-z]+$/, ".webp");
			}
		}

		return (
			<img
				src={bucketPaths.images.people + "full/" + image}
				className={`person-image ${className}`}
				alt={`${first} ${last}`}
				title={`${first} ${last}`}
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

PersonImage.propTypes = {
	className: PropTypes.string,
	person: PropTypes.object.isRequired,
	size: PropTypes.oneOf([null, "medium", "small"]),
	useWebp: PropTypes.bool.isRequired,
	variant: PropTypes.oneOf(["main", "coach", "player"])
};

PersonImage.defaultProps = {
	className: "",
	size: null,
	useWebp: true,
	variant: "main"
};

export default connect(mapStateToProps)(PersonImage);
