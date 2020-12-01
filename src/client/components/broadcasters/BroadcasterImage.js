import React, { Component } from "react";
import { connect } from "react-redux";

class BroadcasterImage extends Component {
	render() {
		const { broadcaster, bucketPaths, useWebp, className } = this.props;
		const { name, image } = broadcaster;

		const isRaster =
			["png", "jpg", "jpeg"].indexOf(
				image
					.split(".")
					.pop()
					.toLowerCase()
			) > -1;
		const webp = image.substr(0, image.lastIndexOf(".")) + ".webp";

		return (
			<img
				src={`${bucketPaths.imageRoot}broadcasters/${useWebp && isRaster ? webp : image}`}
				className={`broadcaster-logo ${className || ""}`}
				alt={`${name} Logo`}
				title={`${name} Logo`}
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

export default connect(mapStateToProps)(BroadcasterImage);
