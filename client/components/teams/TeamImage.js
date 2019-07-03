import React, { Component } from "react";
import { connect } from "react-redux";
import { teamImagePath } from "../../extPaths";

class TeamImage extends Component {
	render() {
		const { team, useWebp, className, variant } = this.props;
		const { name, images } = team;
		const image = images[variant] || images.main;

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
				src={`${teamImagePath}${useWebp && isRaster ? webp : image}`}
				className={`team-image ${className || ""}`}
				alt={name.long}
				title={name.long}
			/>
		);
	}
}

function mapStateToProps({ config }) {
	return {
		useWebp: config.webp
	};
}

export default connect(mapStateToProps)(TeamImage);
