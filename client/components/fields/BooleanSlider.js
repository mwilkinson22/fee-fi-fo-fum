import React, { Component } from "react";

//Pass in an onChange property which takes no arguments
//Something like onChange={ () => this.setState({ myBool: !this.state.myBool }) }

export default class BooleanSlider extends Component {
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
