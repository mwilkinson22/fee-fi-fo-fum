//Modules
import React, { Component } from "react";
import icons from "megadraft/lib/icons";
import TweetEmbed from "react-tweet-embed";

export default class TwitterBlock extends Component {
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
		const { tweetId } = this.props.data;
		return (
			<div className="custom-block twitter-wrapper">
				<TweetEmbed id={tweetId} />
			</div>
		);
	}
}
