import React, { Component } from "react";
import { connect } from "react-redux";
import icons from "megadraft/lib/icons";
import EmbeddedVideo from "~/client/components/EmbeddedVideo";

class VideoBlock extends Component {
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
		const { autoPlay, muted, src } = this.props.data;
		return (
			<div className="custom-block video-wrapper">
				<EmbeddedVideo
					autoPlay={autoPlay}
					muted={muted}
					src={`${bucketPaths.imageRoot}news/inline/${src}`}
				/>
			</div>
		);
	}
}

function mapStateToProps({ config }) {
	const { bucketPaths } = config;
	return { bucketPaths };
}

export default connect(mapStateToProps)(VideoBlock);
