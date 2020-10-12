//Modules
import React, { Component } from "react";
import PropTypes from "prop-types";

class PageSwitch extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		const { currentValue, onChange, options } = this.props;

		return (
			<div className="page-switch">
				{options.map(({ label, value, className }) => (
					<div
						onClick={() => onChange(value)}
						key={value}
						className={
							`${className || ""} ${value == currentValue ? "active" : ""}`.trim() ||
							null
						}
					>
						{label || value}
					</div>
				))}
			</div>
		);
	}
}

PageSwitch.propTypes = {
	currentValue: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	options: PropTypes.arrayOf(
		PropTypes.shape({
			className: PropTypes.string,
			label: PropTypes.string,
			value: PropTypes.string.isRequired
		})
	).isRequired
};

export default PageSwitch;
