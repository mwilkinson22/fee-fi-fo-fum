import React, { Component } from "react";

export default class Boolean extends Component {
	render() {
		const { field } = this.props;
		return (
			<div className="boolean">
				<input
					{...field}
					defaultChecked={field.value}
					type="checkbox"
					className="boolean-checkbox"
					id={field.name}
				/>
				<label className="boolean-slider" htmlFor={field.name} />
			</div>
		);
	}
}
