import React, { Component } from "react";
import { connect } from "react-redux";
import { gameImagePath, groundImagePath } from "../../extPaths";
import "datejs";

class GameHeaderImage extends Component {
	render() {
		const { game, className, useWebp } = this.props;
		let image;
		let alt;

		if (game.images.header) {
			image = gameImagePath + "header/" + game.images.header;
			alt = `Huddersfield Giants vs ${game._opposition.name.long} - ${game.date.toString(
				"dd/MM/yyyy"
			)}`;
		} else if (game._ground.image) {
			image = groundImagePath + game._ground.image;
			alt = game._ground.name;
		} else {
			image = groundImagePath + "pitch.jpg";
			alt = "Rugby Pitch";
		}

		const webp = image.substr(0, image.lastIndexOf(".")) + ".webp";

		return <img src={useWebp ? webp : image} className={className} alt={alt} />;
	}
}

function mapStateToProps({ config }, ownProps) {
	return {
		useWebp: config.webp,
		...ownProps
	};
}

export default connect(mapStateToProps)(GameHeaderImage);
