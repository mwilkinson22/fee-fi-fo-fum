import React, { Component } from "react";
import { connect } from "react-redux";
import { teamImagePath } from "../../extPaths";

class TeamImage extends Component {
	render() {
		const { team, useWebp, className } = this.props;
		const { name, image } = team;
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
				webp={teamImagePath + webp}
				className={`team-image ${className || ""}`}
				alt={name.long}
			/>
		);
	}
}

function mapStateToProps({ config }, ownProps) {
	return {
		useWebp: config.webp,
		...ownProps
	};
}

export default connect(mapStateToProps)(TeamImage);
