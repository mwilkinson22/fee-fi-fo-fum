//Modules
import React, { Component } from "react";
import icons from "megadraft/lib/icons";

//Components
import YouTubeVideo from "../../YouTubeVideo";

export default class YouTubeBlock extends Component {
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
		const { videoId } = this.props.data;
		return (
			<div className="youtube-wrapper">
				<YouTubeVideo videoId={videoId} />
			</div>
		);
	}
}
