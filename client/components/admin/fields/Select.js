import React, { Component } from "react";
import ReactSelect from "react-select";

export default class Select extends Component {
	render() {
		const { field, options, onChange, isClearable } = this.props;
		const styles = {
			option: (provided, state) => ({
				...provided,
				background: state.isSelected
					? "#751432"
					: state.isFocused
						? "#7514324d"
						: "transparent",
				":active": {
					backgroundColor: "#7514324d"
				}
			}),
			control: (provided, state) => ({
				...provided,
				borderColor: state.isFocused || state.isSelected ? "#751432" : null,
				boxShadow: state.isFocused || state.isSelected ? "0 0 0 1px #751432" : null,
				"&:hover": {
					borderColor: "#751432"
				}
			})
		};
		return (
			<ReactSelect
				{...field}
				options={options}
				styles={styles}
				onChange={onChange}
				isClearable={isClearable}
			/>
		);
	}
}
