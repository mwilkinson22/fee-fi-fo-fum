import React, { Component } from "react";
import { connect } from "react-redux";
import { userImagePath } from "../../extPaths";

class TeamImage extends Component {
	render() {
		const { author, useWebp, className } = this.props;
		const { image, name } = author;

		const webp = image.substr(0, image.lastIndexOf(".")) + ".webp";
		return (
			<img
				src={`${userImagePath}${useWebp ? webp : image}`}
				className={`author-image ${className || ""}`}
				alt={name.full}
				title={name.full}
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
