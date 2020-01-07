//Modules
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import TweetEmbed from "react-tweet-embed";

//Megadraft
import insertDataBlock from "megadraft/lib/insertDataBlock";

//Components
import PopUpDialog from "../../PopUpDialog";

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
		const onDestroy = () =>
			this.setState({ showInput: false, tweetId: "", previewTweetId: null });

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
				<input
					type="text"
					onChange={ev =>
						this.setState({ tweetId: ev.target.value, previewTweetId: null })
					}
				/>
				{previewTweet}
				<div className="buttons">
					<button type="button" onClick={onDestroy}>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => this.setState({ previewTweetId: tweetId })}
					>
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
						<svg width="24" height="24" viewBox="0 0 24 24">
							<path
								d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"
								fill="currentColor"
								fillRule="evenodd"
							/>
						</svg>
					</div>
				</button>
			);
		}
	}
}

export default withRouter(TwitterButton);
