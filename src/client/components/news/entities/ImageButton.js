//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";

//Megadraft
import icons from "megadraft/lib/icons";
import insertDataBlock from "megadraft/lib/insertDataBlock";

//Components
import FileUploader from "../../admin/FileUploader";

class ImageButton extends Component {
	constructor(props) {
		super(props);

		const { match, postList } = props;
		const { slug } = postList[match.params._id];

		this.state = {
			showFileUploader: false,
			slug
		};
	}

	onClick(e) {
		e.preventDefault();
		const src = window.prompt("Enter a URL");
		if (!src) {
			return;
		}

		const data = { src: src, type: "image", display: "medium" };

		this.props.onChange(insertDataBlock(this.props.editorState, data));
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
				onComplete={name =>
					this.props.onChange(
						insertDataBlock(this.props.editorState, { src: name, type: "image" })
					)
				}
				onDestroy={() => this.setState({ showFileUploader: false })}
			/>
		);
	}

	render() {
		const { showFileUploader } = this.state;

		if (showFileUploader) {
			return this.renderFileUploader();
		} else {
			return (
				<button
					className={this.props.className}
					type="button"
					onClick={() => this.setState({ showFileUploader: true })}
					title={this.props.title}
				>
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