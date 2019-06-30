//Modules
import React, { Component } from "react";
import PropTypes from "prop-types";

//Components
import { Editor } from "medium-draft";
import CustomImageSideButton from "./CustomImageSideButton";

class NewsPostEditor extends Component {
	render() {
		const { editorState, onChange } = this.props;

		const sideButtons = [
			{
				title: "Image",
				component: CustomImageSideButton
			}
		];

		return (
			<Editor
				editorState={editorState}
				onChange={onChange}
				placeholder={"Write Post Here"}
				sideButtons={sideButtons}
			/>
		);
	}
}

NewsPostEditor.propTypes = {
	editorState: PropTypes.object.isRequired,
	onChange: PropTypes.func.isRequired
};

NewsPostEditor.defaultProps = {};

export default NewsPostEditor;
