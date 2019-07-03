import React, { Component } from "react";
import { connect } from "react-redux";
import { googleBucket } from "../../extPaths";

class GameLogo extends Component {
	render() {
		const { game, useWebp } = this.props;
		const className = this.props.className || "";
		let image;
		let alt;

		if (game.images.logo) {
			image = googleBucket + game.images.logo;
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
	return {
		useWebp: config.webp
	};
}

export default connect(mapStateToProps)(GameLogo);
