import React, { Component } from "react";
import PropTypes from "prop-types";

class ThreeDots extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		return nextProps;
	}

	render() {
		const { className, colour, isDisabled, onClick } = this.state;
		return (
			<div className={`three-dot-menu ${isDisabled ? "disabled" : ""} ${className}`} onClick={onClick}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					xmlnsXlink="http://www.w3.org/1999/xlink"
					width="30pt"
					height="30pt"
					viewBox="0 0 30 30"
				>
					<path
						style={{ fill: colour }}
						d="M 15 7.5 C 17.0625 7.5 18.75 5.8125 18.75 3.75 C 18.75 1.6875 17.0625 0 15 0 C 12.9375 0 11.25 1.6875 11.25 3.75 C 11.25 5.8125 12.9375 7.5 15 7.5 Z M 15 11.25 C 12.9375 11.25 11.25 12.9375 11.25 15 C 11.25 17.0625 12.9375 18.75 15 18.75 C 17.0625 18.75 18.75 17.0625 18.75 15 C 18.75 12.9375 17.0625 11.25 15 11.25 Z M 15 22.5 C 12.9375 22.5 11.25 24.1875 11.25 26.25 C 11.25 28.3125 12.9375 30 15 30 C 17.0625 30 18.75 28.3125 18.75 26.25 C 18.75 24.1875 17.0625 22.5 15 22.5 Z M 15 22.5 "
					/>
				</svg>
			</div>
		);
	}
}

ThreeDots.propTypes = {
	className: PropTypes.string,
	colour: PropTypes.string,
	isDisabled: PropTypes.bool,
	onClick: PropTypes.func.isRequired
};

ThreeDots.defaultProps = {
	className: "",
	colour: "#000000",
	isDisabled: false
};

export default ThreeDots;
