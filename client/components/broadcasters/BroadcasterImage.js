import React, { Component } from "react";
import { connect } from "react-redux";
import { imagePath } from "../../extPaths";

class BroadcasterImage extends Component {
	render() {
		const { broadcaster, useWebp, className } = this.props;
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
				src={`${imagePath}broadcasters/${useWebp && isRaster ? webp : image}`}
				className={`broadcaster-logo ${className || ""}`}
				alt={`${name} Logo`}
				title={`${name} Logo`}
			/>
		);
	}
}

function mapStateToProps({ config }) {
	return {
		useWebp: config.webp
	};
}

export default connect(mapStateToProps)(BroadcasterImage);
