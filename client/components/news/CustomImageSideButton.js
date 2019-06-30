import React from "react";
import { ImageSideButton, Block, addNewBlock } from "medium-draft";
import { connect } from "react-redux";
import { uploadInlineImage } from "../../actions/newsActions";

class CustomImageSideButton extends ImageSideButton {
	async onChange(e) {
		const file = e.target.files[0];
		if (file.type.indexOf("image/") === 0) {
			//Get Slug
			const slug = window.location.pathname.split("/").pop();

			// This is a post request to server endpoint with image as `image`
			const formData = new FormData();
			formData.append("image", file);
			formData.append("name", `${slug}-${new Date().getTime()}`);
			const url = await this.props.uploadInlineImage(formData);
			if (url) {
				this.props.setEditorState(
					addNewBlock(this.props.getEditorState(), Block.IMAGE, {
						src: url
					})
				);
			}
		}
		this.props.close();
	}
}

function mapStateToProps({ config }) {
	const { localTeam } = config;
	return { localTeam };
}

export default connect(
	mapStateToProps,
	{ uploadInlineImage }
)(CustomImageSideButton);
