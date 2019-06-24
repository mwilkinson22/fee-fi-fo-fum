import React, { Component } from "react";
import { connect } from "react-redux";
import { personImagePath } from "../../extPaths";

class PersonImage extends Component {
	render() {
		const { person, useWebp } = this.props;
		const { first, last } = person.name;
		const image = person.image || `blank-${person.gender}.png`;
		const { className } = this.props;
		const webp = image.substr(0, image.lastIndexOf(".")) + ".webp";
		return (
			<img
				src={`${personImagePath}${useWebp ? webp : image}`}
				className={`person-image ${className || ""}`}
				alt={`${first} ${last}`}
				title={`${first} ${last}`}
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

export default connect(mapStateToProps)(PersonImage);
