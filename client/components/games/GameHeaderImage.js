import React, { Component } from "react";
import Image from "react-image-webp";
import { gameImagePath, groundImagePath } from "../../extPaths";
import "datejs";

export default class GameHeaderImage extends Component {
	render() {
		const { game, className } = this.props;
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

		return <Image src={image} webp={webp} className={className} alt={alt} />;
	}
}
