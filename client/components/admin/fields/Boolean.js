import React, { Component } from "react";

export default class Boolean extends Component {
	render() {
		const { name, value } = this.props;
		return (
			<div className="boolean">
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
