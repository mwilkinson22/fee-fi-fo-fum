import React, { Component } from "react";
import { connect } from "react-redux";

class AuthorImage extends Component {
	render() {
		const { author, bucketPaths, useWebp, className } = this.props;
		const { image, name } = author;

		const webp = image.substr(0, image.lastIndexOf(".")) + ".webp";
		return (
			<img
				src={`${bucketPaths.images.users}${useWebp ? webp : image}`}
				className={`author-image ${className || ""}`}
				alt={name.full}
				title={name.full}
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

export default connect(mapStateToProps)(AuthorImage);
