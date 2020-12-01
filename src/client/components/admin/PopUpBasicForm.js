//Modules
import React, { Component } from "react";

//Components
import PopUpDialog from "../PopUpDialog";
import BasicForm from "./BasicForm";

//Constants
import { propTypes, defaultProps } from "~/constants/formPropTypes";

class PopUpBasicForm extends Component {
	render() {
		const { onDestroy, ...formProps } = this.props;
		return (
			<PopUpDialog asCard={false} onDestroy={onDestroy}>
				<BasicForm {...formProps} />
			</PopUpDialog>
		);
	}
}

PopUpBasicForm.propTypes = propTypes;
PopUpBasicForm.defaultProps = defaultProps;

export default PopUpBasicForm;
