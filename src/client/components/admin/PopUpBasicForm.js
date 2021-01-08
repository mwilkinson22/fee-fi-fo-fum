//Modules
import React, { Component } from "react";
import PropTypes from "prop-types";

//Components
import PopUpDialog from "../PopUpDialog";
import BasicForm from "./BasicForm";

//Constants
import { propTypes, defaultProps } from "~/constants/formPropTypes";

class PopUpBasicForm extends Component {
	render() {
		const { fullSize, onDestroy, ...formProps } = this.props;
		return (
			<PopUpDialog asCard={false} fullSize={fullSize} onDestroy={onDestroy}>
				<BasicForm {...formProps} />
			</PopUpDialog>
		);
	}
}

PopUpBasicForm.propTypes = {
	fullSize: PropTypes.bool,
	onDestroy: PropTypes.func.isRequired,
	...propTypes
};
PopUpBasicForm.defaultProps = { fullSize: false, ...defaultProps };

export default PopUpBasicForm;
