import React, { Component } from "react";
import { connect } from "react-redux";

class GameLogo extends Component {
	render() {
		const { bucketPaths, game, useWebp } = this.props;
		const className = this.props.className || "";
		let image;
		let alt;

		if (game.images.logo) {
			image = bucketPaths.root + game.images.logo;
			alt = game.title;
		}

		if (image) {
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
					src={useWebp && isRaster ? webp : image}
					webp={webp}
					className={className}
					alt={alt}
				/>
			);
		} else {
			return null;
		}
	}
}

function mapStateToProps({ config }) {
	const { bucketPaths, webp } = config;
	return {
		bucketPaths,
		useWebp: webp
	};
}

export default connect(mapStateToProps)(GameLogo);
