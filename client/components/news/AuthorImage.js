import React, { Component } from "react";
import { connect } from "react-redux";
import { userImagePath } from "../../extPaths";

class AuthorImage extends Component {
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

function mapStateToProps({ config }) {
	return {
		useWebp: config.webp
	};
}

export default connect(mapStateToProps)(AuthorImage);
