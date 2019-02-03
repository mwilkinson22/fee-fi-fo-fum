import React, { Component } from "react";
import Image from "react-image-webp";
import { personImagePath } from "../../extPaths";

export default class PersonImage extends Component {
	render() {
		const { person } = this.props;
		const { first, last } = person.name;
		const image = person.image || "blank.png";
		const { className } = this.props;
		const webp = image.substr(0, image.lastIndexOf(".")) + ".webp";
		return (
			<Image
				src={`${personImagePath}${image}`}
				webp={`${personImagePath}${webp}`}
				className={`person-image ${className}`}
				alt={`${first} ${last}`}
			/>
		);
	}
}
