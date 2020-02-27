import React, { Component } from "react";
import { connect } from "react-redux";
import icons from "megadraft/lib/icons";

class ImageBlock extends Component {
	constructor(props) {
		super(props);

		this.actions = [
			{
				key: "delete",
				icon: icons.DeleteIcon,
				action: this.props.container.remove
			}
		];
	}

	render() {
		const { bucketPaths } = this.props;
		return (
			<div className="custom-block image-wrapper">
				<img src={`${bucketPaths.imageRoot}news/inline/${this.props.data.src}`} alt="" />
			</div>
		);
	}
}

function mapStateToProps({ config }) {
	const { bucketPaths } = config;
	return { bucketPaths };
}

export default connect(mapStateToProps)(ImageBlock);
