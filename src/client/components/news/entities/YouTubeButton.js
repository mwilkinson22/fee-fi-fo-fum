//Modules
import React, { Component } from "react";
import { withRouter } from "react-router-dom";

//Megadraft
import icons from "megadraft/lib/icons";
import insertDataBlock from "megadraft/lib/insertDataBlock";

//Components
import PopUpDialog from "../../PopUpDialog";
import YouTubeVideo from "../../YouTubeVideo";

class YouTubeButton extends Component {
	constructor(props) {
		super(props);

		this.state = {
			showInput: false,
			videoId: "",
			videoStartTime: 0,
			previewVideoId: null
		};
	}

	onClick(e) {
		e.preventDefault();
		const src = window.prompt("Enter a URL");
		if (!src) {
			return;
		}

		const data = { src: src, type: "video", display: "large" };

		this.props.onChange(insertDataBlock(this.props.editorState, data));
	}

	renderInput() {
		const { previewVideoId, videoId, videoStartTime } = this.state;

		//Get destroy callback
		const onDestroy = () =>
			this.setState({ showInput: false, videoId: "", previewVideoId: null });

		//Render preview video
		let previewVideo;
		if (previewVideoId) {
			previewVideo = (
				<div className="full-span">
					<YouTubeVideo videoId={previewVideoId} startTime={videoStartTime} />
				</div>
			);
		}

		return (
			<PopUpDialog asGrid={true} onDestroy={onDestroy}>
				<label>YouTube Video ID</label>
				<input
					type="text"
					onChange={ev =>
						this.setState({ videoId: ev.target.value, previewVideoId: null })
					}
				/>
				<label>Start Time</label>
				<input
					type="number"
					onChange={ev =>
						this.setState({ videoStartTime: ev.target.value, previewVideoId: null })
					}
				/>
				{previewVideo}
				<div className="buttons">
					<button type="button" onClick={onDestroy}>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => this.setState({ previewVideoId: videoId })}
					>
						Preview
					</button>
					<button
						type="button"
						className="confirm"
						disabled={!videoId.length}
						onClick={() => {
							this.props.onChange(
								insertDataBlock(this.props.editorState, {
									videoId,
									videoStartTime,
									type: "youtube"
								})
							);
							onDestroy();
						}}
					>
						Add Video
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
					<icons.VideoIcon className="sidemenu__button__icon" />
				</button>
			);
		}
	}
}

export default withRouter(YouTubeButton);
