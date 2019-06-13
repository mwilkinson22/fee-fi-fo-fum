import React, { Component } from "react";
import PropTypes from "prop-types";

class PopUpDialog extends Component {
	handleBackgroundClick(ev) {
		const { clickBackgroundToClose, onDestroy } = this.props;

		if (clickBackgroundToClose && ev.target === ev.currentTarget) {
			onDestroy();
		}
	}

	render() {
		const { asGrid, children, className, closeButtonText, onDestroy } = this.props;

		return (
			<div className="pop-up-dialog-bg" onClick={ev => this.handleBackgroundClick(ev)}>
				<div
					className={`pop-up-dialog form-card ${asGrid ? "grid" : ""} ${className || ""}`}
				>
					{children}
					{closeButtonText && (
						<div className="buttons">
							<button type="button" onClick={() => onDestroy()}>
								{closeButtonText}
							</button>
						</div>
					)}
				</div>
			</div>
		);
	}
}

PopUpDialog.propTypes = {
	asGrid: PropTypes.bool,
	children: PropTypes.node.isRequired,
	clickBackgroundToClose: PropTypes.bool,
	className: PropTypes.string,
	closeButtonText: PropTypes.string, //Doesn't display, if null
	onDestroy: PropTypes.func.isRequired
};

PopUpDialog.defaultProps = {
	asGrid: false,
	clickBackgroundToClose: true,
	closeButtonText: null
};

export default PopUpDialog;
