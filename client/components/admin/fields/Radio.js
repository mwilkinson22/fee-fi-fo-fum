import _ from "lodash";
import React, { Component } from "react";

export default class Radio extends Component {
	render() {
		const { field, options } = this.props;
		return (
			<div key={field.name} className="radio-fields">
				{_.map(options, option => {
					const id = `${field.name}-${option.value}`;
					return [
						<input key="input" type="radio" id={id} {...field} value={option.value} />,
						<label key="label" htmlFor={id}>
							{option.label}
						</label>
					];
				})}
			</div>
		);
	}
}
