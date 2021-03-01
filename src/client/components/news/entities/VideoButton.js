//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";

//Megadraft
import icons from "megadraft/lib/icons";
import insertDataBlock from "megadraft/lib/insertDataBlock";

//Components
import PopUpDialog from "../../PopUpDialog";
import FileUploader from "../../admin/FileUploader";
import BooleanSlider from "../../fields/BooleanSlider";
import EmbeddedVideo from "~/client/components/EmbeddedVideo";

class VideoButton extends Component {
	constructor(props) {
		super(props);

		const { match, postList } = props;
		const { slug } = postList[match.params._id];

		this.state = {
			showForm: false,
			showFileUploader: false,
			showPreviewVideo: false,
			videoFile: "",
			autoPlay: true,
			muted: true,
			slug
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

	renderUploader() {
		const { showFileUploader, slug } = this.state;
		if (showFileUploader) {
			return (
				<FileUploader
					accept={["mp4", "webm"]}
					allowCustomName={false}
					defaultName={`${slug}-${new Date().getTime()}`}
					isImage={false}
					path="images/news/inline/"
					onComplete={videoFile => this.setState({ videoFile, showFileUploader: false })}
					onDestroy={() => this.setState({ showFileUploader: false })}
				/>
			);
		}
	}

	renderInput() {
		const { bucketPaths } = this.props;
		const { videoFile, autoPlay, muted } = this.state;

		//Get destroy callback
		const onDestroy = () => this.setState({ showForm: false, videoFile: "", previewVideoId: null });

		//Render Video Upload Button Or Name
		let buttonOrName;
		if (videoFile.length) {
			buttonOrName = <input value={videoFile} disabled={true} />;
		} else {
			buttonOrName = (
				<button type="button" onClick={() => this.setState({ showFileUploader: true })}>
					Upload
				</button>
			);
		}

		//Render preview
		let preview;
		if (videoFile.length) {
			preview = (
				<div className="full-span">
					<EmbeddedVideo
						autoPlay={autoPlay}
						muted={muted}
						src={`${bucketPaths.imageRoot}news/inline/${videoFile}`}
					/>
				</div>
			);
		}

		return (
			<PopUpDialog asGrid={true} onDestroy={onDestroy}>
				<label>Video</label>
				{buttonOrName}
				{this.renderUploader()}
				<label>Auto-play</label>
				<BooleanSlider
					value={autoPlay}
					name="autoPlay"
					onChange={() => this.setState({ autoPlay: !autoPlay })}
				/>
				<label>Muted</label>
				<BooleanSlider value={muted} name="muted" onChange={() => this.setState({ muted: !muted })} />
				{preview}
				<div className="buttons">
					<button type="button" onClick={onDestroy}>
						Cancel
					</button>
					<button
						type="button"
						className="confirm"
						disabled={!videoFile.length}
						onClick={() => {
							this.props.onChange(
								insertDataBlock(this.props.editorState, {
									src: videoFile,
									autoPlay,
									muted,
									type: "video"
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
		const { showForm } = this.state;

		if (showForm) {
			return this.renderInput();
		} else {
			return (
				<button
					className={this.props.className}
					type="button"
					onClick={() => this.setState({ showForm: true })}
					title={this.props.title}
				>
					<icons.VideoIcon className="sidemenu__button__icon" />
				</button>
			);
		}
	}
}

function mapStateToProps({ config, news }) {
	const { bucketPaths } = config;
	const { postList } = news;
	return { bucketPaths, postList };
}

export default withRouter(connect(mapStateToProps)(VideoButton));
