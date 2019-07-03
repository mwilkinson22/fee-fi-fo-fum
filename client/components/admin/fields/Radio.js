import _ from "lodash";
import React, { Component } from "react";

export default class Radio extends Component {
	render() {
		const { name, options } = this.props;
		return (
			<div key={name} className="radio-fields">
				{_.map(options, option => {
					const id = `${name}-${option.value}`;
					return [
						<input
							key="input"
							type="radio"
							id={id}
							{...this.props}
							value={option.value}
							defaultChecked={this.props.value === option.value}
						/>,
						<label key="label" htmlFor={id}>
							{option.label}
						</label>
					];
				})}
			</div>
		);
	}
}
