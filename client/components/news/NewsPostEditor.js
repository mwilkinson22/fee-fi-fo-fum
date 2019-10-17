//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { MegadraftEditor } from "megadraft";
import actions from "megadraft/lib/actions/default";
import LinkInput from "megadraft/lib/entity_inputs/LinkInput";

//Components
import InternalLinkInput from "./entities/InternalLinkInput";

//Constants
import newsPlugins from "~/constants/newsPlugins";

class NewsPostEditor extends Component {
	customActions() {
		//Convert H2 to H3
		let customActions = actions.map(action => {
			switch (action.label) {
				case "H2":
					return {
						...action,
						label: "H3",
						style: "header-three"
					};
				case "Link":
					return [
						{
							...action,
							label: "Page Link",
							entity: "INTERNAL_PAGE_LINK"
						},
						action
					];
				default:
					return action;
			}
		});
		return _.flatten(customActions);
	}

	customEntityInputs() {
		return {
			LINK: LinkInput,
			INTERNAL_PAGE_LINK: InternalLinkInput
		};
	}

	render() {
		const { editorState, onChange } = this.props;

		return (
			<MegadraftEditor
				editorState={editorState}
				onChange={onChange}
				actions={this.customActions()}
				entityInputs={this.customEntityInputs()}
				plugins={newsPlugins}
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
