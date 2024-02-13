//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";

//Megadraft
import icons from "megadraft/lib/icons";
import insertDataBlock from "megadraft/lib/insertDataBlock";

//Components
import FileUploader from "../../admin/FileUploader";
import PopUpDialog from "~/client/components/PopUpDialog";
import BooleanSlider from "~/client/components/fields/BooleanSlider";

class ImageButton extends Component {
	constructor(props) {
		super(props);

		const { match, postList } = props;
		const { slug } = postList[match.params._id];

		this.state = {
			showFileUploader: false,
			showOptions: false,
			caption: {
				value: "",
				rightAlign: false,
				firstWordIsWhite: false,
				formatAsHeader: true
			},
			slug,
			url: "",
			src: null
		};
		this.initialState = this.state;
	}

	onDestroy() {
		this.setState(this.initialState);
	}

	renderOptions() {
		const { caption, src, url } = this.state;
		const { value, rightAlign, formatAsHeader, firstWordIsWhite } = caption;

		return (
			<PopUpDialog onDestroy={() => this.onDestroy()} asGrid={true}>
				<label>Url</label>
				<input type="text" value={url} onChange={ev => this.setState({ url: ev.target.value })} />
				<label>Caption</label>
				<input type="text" value={value} onChange={ev => this.setState({ caption: { ...caption, value: ev.target.value } })} />
				<label>Right-Align</label>
				<BooleanSlider name="rightAlign" value={rightAlign} onChange={() => this.setState({ caption: { ...caption, rightAlign: !rightAlign } })} />
				<label>Use header styling</label>
				<BooleanSlider
					name="captionAsHeader"
					value={formatAsHeader}
					onChange={() => this.setState({ caption: { ...caption, formatAsHeader: !formatAsHeader } })}
				/>
				<label>Make first word white?</label>
				<BooleanSlider
					name="firstWordWhite"
					value={formatAsHeader && firstWordIsWhite}
					onChange={() => this.setState({ caption: { ...caption, firstWordIsWhite: !firstWordIsWhite } })}
					disabled={!formatAsHeader}
				/>
				<div className="buttons">
					<button type="button" onClick={() => this.setState({ showOptions: false, showFileUploader: true })}>
						Back
					</button>
					<button
						type="button"
						onClick={() => {
							this.props.onChange(
								insertDataBlock(this.props.editorState, {
									src,
									caption,
									url,
									type: "image"
								})
							);
							this.onDestroy();
						}}
					>
						Add Image
					</button>
				</div>
			</PopUpDialog>
		);
	}

	renderFileUploader() {
		const { slug } = this.state;

		const accept = ["jpg", "jpeg", "gif", "png"];

		return (
			<FileUploader
				accept={accept}
				allowCustomName={false}
				convertImageToWebP={true}
				defaultName={`${slug}-${new Date().getTime()}`}
				isImage={true}
				resize={{ defaultSize: { width: 760 } }}
				path="images/news/inline/"
				onComplete={src => this.setState({ src, showOptions: true, showFileUploader: false })}
				onDestroy={() => this.onDestroy()}
				destroyOnComplete={false}
			/>
		);
	}

	render() {
		const { showOptions, showFileUploader } = this.state;

		if (showFileUploader) {
			return this.renderFileUploader();
		} else if (showOptions) {
			return this.renderOptions();
		} else {
			return (
				<button className={this.props.className} type="button" onClick={() => this.setState({ showFileUploader: true })} title={this.props.title}>
					<icons.ImageIcon className="sidemenu__button__icon" />
				</button>
			);
		}
	}
}

function mapStateToProps({ news }) {
	const { postList } = news;
	return { postList };
}

export default withRouter(connect(mapStateToProps)(ImageButton));
