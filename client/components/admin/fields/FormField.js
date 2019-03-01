import React, { Component } from "react";
import { Field, ErrorMessage } from "formik";
import Boolean from "./Boolean";
import Radio from "./Radio";
import Select from "./Select";
import Form from "../games/AdminGameOverview";

export default class FormField extends Component {
	render() {
		const {
			form,
			field,
			type,
			options,
			label,
			required,
			withLabel,
			controls,
			min,
			max,
			placeholder
		} = this.props;
		//Get Component
		let component;
		switch (type) {
			case "Boolean":
				component = <Boolean key="field" field={field} />;
				break;
			case "Radio":
				component = <Radio key="field" field={field} options={options} />;
				break;
			case "Select":
				component = (
					<Select
						key="field"
						field={field}
						options={options}
						onChange={option => {
							form.setFieldValue(field.name, option);
						}}
					/>
				);
				break;
			default:
				component = (
					<input
						key="field"
						{...field}
						type={type}
						min={min}
						max={max}
						placeholder={placeholder}
					/>
				);
				break;
		}
		//Handle "contains"
		if (controls && field.value) {
			component = (
				<div key="component" className="controlling-field-wrapper">
					{component}
					<Field component={FormField} withLabel={false} {...controls} />
				</div>
			);
		}

		if (withLabel) {
			return [
				<label key="label" className={required ? "required" : ""}>
					{label}
				</label>,
				component,
				<span className="error" key="error">
					<ErrorMessage name={field.name} />
				</span>
			];
		} else {
			return component;
		}
	}
}
