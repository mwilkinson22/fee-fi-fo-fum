import React, { Component } from "react";

export default class Boolean extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { value, readOnly } = nextProps;
		return { value, readOnly };
	}

	render() {
		const { name } = this.props;
		const { value, readOnly } = this.state;
		return (
			<div className={`boolean ${readOnly ? "read-only" : ""}`}>
				<input
					{...this.props}
					checked={value}
					type="checkbox"
					className="boolean-checkbox"
					id={`bool-${name}`}
				/>
				<label className="boolean-slider" htmlFor={`bool-${name}`} />
			</div>
		);
	}
}
