import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

class AuthorImage extends Component {
	render() {
		const { author, bucketPaths, useWebp, className, size } = this.props;

		let src = bucketPaths.images.users + author.image;

		//Determine if it's a raster
		const isRaster =
			["png", "jpg", "jpeg"].indexOf(
				src
					.split(".")
					.pop()
					.toLowerCase()
			) > -1;

		if (isRaster) {
			//If a size is defined, look in the corresponding folder
			if (size) {
				const splitSrc = src.split("/");
				const filename = splitSrc.pop();
				src = `${splitSrc.join("/")}/${size}/${filename}`;
			}

			//If webp is supported, change the extension
			if (useWebp) {
				src = src.replace(/\.[a-z]+$/, ".webp");
			}
		}

		return (
			<img src={src} className={`author-image ${className}`} alt={author.name.full} title={author.name.full} />
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

AuthorImage.propTypes = {
	className: PropTypes.string,
	author: PropTypes.object.isRequired,
	size: PropTypes.oneOf([null, "small"])
};

AuthorImage.defaultProps = {
	className: "",
	size: null
};

export default connect(mapStateToProps)(AuthorImage);
