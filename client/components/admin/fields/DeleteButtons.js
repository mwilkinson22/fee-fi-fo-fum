import React, { Component } from "react";
import PropTypes from "prop-types";

class DeleteButtons extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		const { promptClicked } = this.state;
		let buttons;
		if (promptClicked) {
			buttons = [
				<button
					type="button"
					key="cancel"
					onClick={() => this.setState({ promptClicked: false })}
				>
					Cancel
				</button>,
				<button
					type="button"
					className="delete"
					key="confirm"
					onClick={this.props.onDelete}
				>
					Confirm
				</button>
			];
		} else {
			buttons = (
				<button
					type="button"
					className="delete"
					onClick={() => this.setState({ promptClicked: true })}
				>
					Delete
				</button>
			);
		}
		return (
			<div className="form-card">
				<div className="buttons">{buttons}</div>
			</div>
		);
	}
}

DeleteButtons.propTypes = {
	onDelete: PropTypes.func.isRequired
};

export default DeleteButtons;
