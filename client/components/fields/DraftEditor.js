//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { MegadraftEditor } from "megadraft";
import actions from "megadraft/lib/actions/default";
import LinkInput from "megadraft/lib/entity_inputs/LinkInput";

//Components
import LinkIcon from "../news/entities/LinkIcon";
import InternalLinkInput from "../news/entities/InternalLinkInput";

//Constants
import newsPlugins from "~/constants/newsPlugins";

class DraftEditor extends Component {
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
							entity: "INTERNAL_PAGE_LINK",
							icon: () => <LinkIcon internal={true} />
						},
						{
							...action,
							icon: () => <LinkIcon internal={false} />
						}
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
		const { value, onChange, post } = this.props;

		return (
			<MegadraftEditor
				editorState={value}
				onChange={onChange}
				actions={this.customActions()}
				entityInputs={this.customEntityInputs()}
				plugins={newsPlugins(post)}
			/>
		);
	}
}

DraftEditor.propTypes = {
	value: PropTypes.object.isRequired,
	onChange: PropTypes.func.isRequired,
	post: PropTypes.object.isRequired
};

DraftEditor.defaultProps = {};

export default DraftEditor;
