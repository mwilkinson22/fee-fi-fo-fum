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
		const {
			asCard,
			asGrid,
			children,
			className,
			fullSize,
			closeButtonText,
			onDestroy
		} = this.props;

		let dialogClassName = ["pop-up-dialog"];

		if (asCard) {
			dialogClassName.push("form-card");
			if (asGrid) {
				dialogClassName.push("grid");
			}
		}
		if (fullSize) {
			dialogClassName.push("full-size");
		}
		if (className) {
			dialogClassName.push(className);
		}

		return (
			<div className="pop-up-dialog-bg" onClick={ev => this.handleBackgroundClick(ev)}>
				<div className={dialogClassName.join(" ")}>
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
	asCard: PropTypes.bool,
	asGrid: PropTypes.bool,
	children: PropTypes.node.isRequired,
	clickBackgroundToClose: PropTypes.bool,
	className: PropTypes.string,
	closeButtonText: PropTypes.string, //Doesn't display, if null
	fullSize: PropTypes.bool,
	onDestroy: PropTypes.func.isRequired
};

PopUpDialog.defaultProps = {
	asCard: true,
	asGrid: false,
	fullSize: false,
	clickBackgroundToClose: true,
	closeButtonText: null
};

export default PopUpDialog;
