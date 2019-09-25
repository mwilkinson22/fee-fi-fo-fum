import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { personImagePath } from "../../extPaths";

class PersonImage extends Component {
	render() {
		const { className, person, useWebp, variant } = this.props;
		const { images, name, gender } = person;
		const { first, last } = name;

		//Get the correct image
		const image = images[variant] || images.main || `blank-${gender}.png`;

		//Get URL
		let src = personImagePath + image;
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
	return {
		useWebp: config.webp
	};
}

PersonImage.propTypes = {
	person: PropTypes.object.isRequired,
	useWebp: PropTypes.bool.isRequired,
	variant: PropTypes.oneOf(["main", "coach", "player"])
};

PersonImage.defaultProps = {
	variant: "main"
};

export default connect(mapStateToProps)(PersonImage);
