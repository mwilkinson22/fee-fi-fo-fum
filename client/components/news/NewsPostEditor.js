//Modules
import React, { Component } from "react";
import PropTypes from "prop-types";

//Components
import { Editor } from "medium-draft";

class NewsPostEditor extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		const { editorState, onChange } = this.props;
		return (
			<Editor editorState={editorState} onChange={onChange} placeholder={"Write Post Here"} />
		);
	}
}

NewsPostEditor.propTypes = {
	editorState: PropTypes.object.isRequired,
	onChange: PropTypes.func.isRequired
};

NewsPostEditor.defaultProps = {};

export default NewsPostEditor;
