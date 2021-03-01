//Modules
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import TweetEmbed from "react-tweet-embed";

//Megadraft
import insertDataBlock from "megadraft/lib/insertDataBlock";

//Components
import PopUpDialog from "../../PopUpDialog";
import TwitterIcon from "./TwitterIcon";

class TwitterButton extends Component {
	constructor(props) {
		super(props);

		this.state = {
			showInput: false,
			tweetId: "",
			previewTweetId: null
		};
	}

	onClick(e) {
		e.preventDefault();
		const src = window.prompt("Enter a URL");
		if (!src) {
			return;
		}

		const data = { src: src, type: "tweet", display: "large" };

		this.props.onChange(insertDataBlock(this.props.editorState, data));
	}

	renderInput() {
		const { previewTweetId, tweetId } = this.state;

		//Get destroy callback
		const onDestroy = () => this.setState({ showInput: false, tweetId: "", previewTweetId: null });

		//Render preview
		let previewTweet;
		if (previewTweetId) {
			previewTweet = (
				<div className="full-span">
					<TweetEmbed id={previewTweetId} />
				</div>
			);
		}

		return (
			<PopUpDialog asGrid={true} onDestroy={onDestroy}>
				<label>Tweet ID</label>
				<input type="text" onChange={ev => this.setState({ tweetId: ev.target.value, previewTweetId: null })} />
				{previewTweet}
				<div className="buttons">
					<button type="button" onClick={onDestroy}>
						Cancel
					</button>
					<button type="button" onClick={() => this.setState({ previewTweetId: tweetId })}>
						Preview
					</button>
					<button
						type="button"
						className="confirm"
						disabled={!tweetId.length}
						onClick={() => {
							this.props.onChange(
								insertDataBlock(this.props.editorState, {
									tweetId,
									type: "twitter"
								})
							);
							onDestroy();
						}}
					>
						Add Tweet
					</button>
				</div>
			</PopUpDialog>
		);
	}

	render() {
		const { showInput } = this.state;

		if (showInput) {
			return this.renderInput();
		} else {
			return (
				<button
					className={this.props.className}
					type="button"
					onClick={() => this.setState({ showInput: true })}
					title={this.props.title}
				>
					<div className="sidemenu__button__icon">
						<TwitterIcon />
					</div>
				</button>
			);
		}
	}
}

export default withRouter(TwitterButton);
