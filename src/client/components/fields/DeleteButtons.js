import React, { Component } from "react";
import PropTypes from "prop-types";

class DeleteButtons extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		const { promptClicked } = this.state;
		const { deleteText } = this.props;
		let buttons;
		if (promptClicked) {
			buttons = [
				<button type="button" key="cancel" onClick={() => this.setState({ promptClicked: false })}>
					Cancel
				</button>,
				<button
					type="button"
					className="delete"
					key="confirm"
					onClick={() => {
						this.setState({ promptClicked: false });
						this.props.onDelete();
					}}
				>
					Confirm
				</button>
			];
		} else {
			buttons = (
				<button type="button" className="delete" onClick={() => this.setState({ promptClicked: true })}>
					{deleteText}
				</button>
			);
		}
		return <div className="buttons">{buttons}</div>;
	}
}

DeleteButtons.propTypes = {
	onDelete: PropTypes.func.isRequired,
	deleteText: PropTypes.string
};

DeleteButtons.defaultProps = {
	deleteText: "Delete"
};

export default DeleteButtons;
