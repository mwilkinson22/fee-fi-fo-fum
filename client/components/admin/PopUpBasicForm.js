//Modules
import React, { Component } from "react";

//Components
import PopUpDialog from "../PopUpDialog";
import BasicForm from "./BasicForm";

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

PopUpBasicForm.propTypes = BasicForm.propTypes;
PopUpBasicForm.defaultProps = BasicForm.defaultProps;

export default PopUpBasicForm;
