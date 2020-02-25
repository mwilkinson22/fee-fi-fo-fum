import React, { Component } from "react";
import { connect } from "react-redux";

class TeamImage extends Component {
	render() {
		const { bucketPaths, team, useWebp, className, variant } = this.props;
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
				src={`${bucketPaths.images.teams}${useWebp && isRaster ? webp : image}`}
				className={`team-image ${className || ""}`}
				alt={name.long}
				title={name.long}
				key={team._id + new Date().getTime()}
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

export default connect(mapStateToProps)(TeamImage);
