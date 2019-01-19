import React, { Component } from "react";
import Image from "react-image-webp";
import { teamImagePath } from "../../extPaths";

export default class TeamImage extends Component {
	render() {
		const { team } = this.props;
		const { name, image } = team;
		const { className } = this.props;
		if (
			["png", "jpg", "jpeg"].indexOf(
				image
					.split(".")
					.pop()
					.toLowerCase()
			) === -1
		) {
			return (
				<img
					src={teamImagePath + image}
					className={`team-image ${className || ""}`}
					alt={name.long}
				/>
			);
		} else {
			const webp = image.substr(0, image.lastIndexOf(".")) + ".webp";
			return (
				<Image
					src={teamImagePath + image}
					webp={teamImagePath + webp}
					className={`team-image ${className || ""}`}
					alt={name.long}
				/>
			);
		}
	}
}
