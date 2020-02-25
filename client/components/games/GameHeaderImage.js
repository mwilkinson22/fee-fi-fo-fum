import React, { Component } from "react";
import { connect } from "react-redux";

class GameHeaderImage extends Component {
	render() {
		const { bucketPaths, game, className, useWebp } = this.props;
		let image;
		let alt;

		if (game.images.header) {
			image = bucketPaths.images.games + "header/" + game.images.header;
			alt = `Huddersfield Giants vs ${game._opposition.name.long} - ${game.date.toString(
				"dd/MM/yyyy"
			)}`;
		} else if (game._ground.image) {
			image = bucketPaths.images.grounds + game._ground.image;
			alt = game._ground.name;
		} else {
			image = bucketPaths.images.grounds + "pitch.jpg";
			alt = "Rugby Pitch";
		}

		const webp = image.substr(0, image.lastIndexOf(".")) + ".webp";

		return (
			<img
				src={useWebp ? webp : image}
				className={`game-header-image ${className || ""}`}
				alt={alt}
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

export default connect(mapStateToProps)(GameHeaderImage);
