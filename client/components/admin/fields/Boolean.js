import React, { Component } from "react";

export default class Boolean extends Component {
	render() {
		const { name, value, readOnly } = this.props;
		return (
			<div className={`boolean ${readOnly ? "read-only" : ""}`}>
				<input
					{...this.props}
					defaultChecked={value}
					type="checkbox"
					className="boolean-checkbox"
					id={`bool-${name}`}
				/>
				<label className="boolean-slider" htmlFor={`bool-${name}`} />
			</div>
		);
	}
}
