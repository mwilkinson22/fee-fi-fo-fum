import _ from "lodash";
import React, { Component } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import LoadingPage from "../../LoadingPage";
import * as Yup from "yup";
import Select from "react-select";
import Radio from "../fields/Radio";
import Boolean from "../fields/Boolean";

export default class AdminStandardForm extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { fieldGroups, onSubmit } = nextProps;
		return { fieldGroups, onSubmit };
	}

	getInitialValues() {
		const initialValues = {};
		_.each(this.state.fieldGroups, fields => {
			_.each(fields, field => (initialValues[field.name] = field.value || ""));
		});
		return initialValues;
	}

	renderForm() {
		const { fieldGroups } = this.state;
		const content = [];
		_.each(fieldGroups, (fields, group) => {
			content.push(<h6 key={group + " title"}>{group}</h6>);
			_.each(fields, field => {
				//Check for required fields
				if (field.validation) {
					field.required =
						typeof _.find(
							field.validation.describe().tests,
							test => test.name === "required"
						) === "object";
				}

				//Get Core Values
				const { name, label, required } = field;

				//Add Label
				content.push(
					<label
						key={`${name} label`}
						htmlFor={name}
						className={required ? "required" : ""}
					>
						{label}
					</label>
				);

				//Add Field
				content.push(this.renderField(field));

				//Add Error Message
				content.push(
					<div className="error" key={name + " error"}>
						<ErrorMessage name={name} />
					</div>
				);
			});
		});
		return (
			<Form>
				<div className="form-card">
					{content}
					<div className="buttons">
						<button type="reset">Reset Form</button>
						<button type="submit">Submit</button>
					</div>
				</div>
			</Form>
		);
	}

	renderField(field) {
		const { name, type, label, disabled, validation } = field;
		const fieldProps = {
			key: name + " field",
			name,
			title: label,
			disabled,
			id: name
		};
		switch (field.type) {
			case "boolean":
				fieldProps.component = Boolean;
				break;
			case "radio":
				fieldProps.component = Radio;
				fieldProps.options = field.options;
				break;
			case "select":
				fieldProps.component = Select;
				fieldProps.isDisabled = field.disabled;
				fieldProps.options = field.options;
				fieldProps.styles = {
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
						borderColor: "#751432",
						boxShadow: state.isFocused || state.isSelected ? "0 0 0 1px #751432" : null,
						"&:hover": {
							borderColor: "#751432"
						}
					})
				};
				break;
			default:
				fieldProps.component = "input";
				fieldProps.type = type;
				if (validation) {
					const tests = _.keyBy(field.validation.describe().tests, "name");
					//Check for min max
					if (tests.min) {
						fieldProps.min = tests.min.params.min;
					}
					if (tests.max) {
						fieldProps.max = tests.max.params.max;
					}
				}
				break;
		}

		return <Field {...fieldProps} />;
	}

	getValidationSchema() {
		const schema = {};
		_.each(this.state.fieldGroups, fields => {
			_.each(fields, field => {
				const { validation } = field;
				if (validation) {
					validation._label = field.label;
				}
				schema[field.name] = validation || "";
			});
		});
		return Yup.object().shape(schema);
	}

	render() {
		const { fieldGroups, onSubmit } = this.state;
		if (!fieldGroups || !onSubmit) {
			return <LoadingPage />;
		} else {
			return (
				<Formik
					initialValues={this.getInitialValues()}
					validationSchema={this.getValidationSchema()}
					render={() => this.renderForm()}
				/>
			);
		}
	}
}
