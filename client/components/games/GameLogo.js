import React, { Component } from "react";
import { connect } from "react-redux";
import { gameImagePath, competitionImagePath } from "../../extPaths";

class GameLogo extends Component {
	render() {
		const { game, useWebp } = this.props;
		const className = this.props.className || "";
		let image;
		let alt;

		if (game.images.logo) {
			image = gameImagePath + "logo/" + game.images.logo;
			alt = game.title;
		} else if (game._competition.image) {
			image = competitionImagePath + game._competition.image;
			alt = game._competition.name + " Logo";
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

function mapStateToProps({ config }, ownProps) {
	return {
		useWebp: config.webp,
		...ownProps
	};
}

export default connect(mapStateToProps)(GameLogo);
