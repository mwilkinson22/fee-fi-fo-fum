import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

class PersonImage extends Component {
	render() {
		const { bucketPaths, className, person, useWebp, variant } = this.props;
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

		//Get URL
		let src = bucketPaths.images.people + "full/" + image;
		if (useWebp) {
			src = src.substr(0, src.lastIndexOf(".")) + ".webp";
		}
		return (
			<img
				src={src}
				className={`person-image ${className || ""}`}
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
	person: PropTypes.object.isRequired,
	useWebp: PropTypes.bool.isRequired,
	variant: PropTypes.oneOf(["main", "coach", "player"])
};

PersonImage.defaultProps = {
	useWebp: true,
	variant: "main"
};

export default connect(mapStateToProps)(PersonImage);
