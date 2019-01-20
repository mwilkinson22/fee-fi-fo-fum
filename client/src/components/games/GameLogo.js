import React, { Component } from "react";
import Image from "react-image-webp";
import { gameImagePath, competitionImagePath } from "../../extPaths";

export default class GameLogo extends Component {
	render() {
		const { game } = this.props;
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
			const useWebp =
				["png", "jpg", "jpeg"].indexOf(
					image
						.split(".")
						.pop()
						.toLowerCase()
				) > -1;
			if (useWebp) {
				const webp = image.substr(0, image.lastIndexOf(".")) + ".webp";
				return <Image src={image} webp={webp} className={className} alt={alt} />;
			} else {
				return <img src={image} className={className} alt={alt} />;
			}
		} else {
			return null;
		}
	}
}
