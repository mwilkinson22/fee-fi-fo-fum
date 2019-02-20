import _ from "lodash";
import React, { Component } from "react";
import { reduxForm, Field } from "redux-form";

export default props => {
	const { fieldGroups, formName, customValidation, isNew } = props;

	class AdminStandardForm extends Component {
		renderField(field) {
			const { submitFailed, error } = field.meta;
			const id = field.input.name;
			let inputElement;

			switch (field.type) {
				case "select":
					inputElement = this.renderSelect(field);
					break;
				default:
					inputElement = (
						<input
							key={field.name}
							type={field.type}
							{...field.input}
							value={field.defaultValue}
						/>
					);
					break;
			}
			return [
				<label key="label" htmlFor={id} className={field.required ? "required" : ""}>
					{field.label}
				</label>,
				inputElement,
				<span key="error" className="error">
					{submitFailed ? error : ""}
				</span>
			];
		}

		renderSelect(field) {
			let i = 0;
			return (
				<select key="input" {...field.input} value={field.defaultValue}>
					{_.map(field.options, (value, title) => {
						return (
							<option key={i++} value={value}>
								{title}
							</option>
						);
					})}
				</select>
			);
		}

		renderFieldGroups() {
			return _.map(fieldGroups, (fields, header) => {
				const elements = _.map(fields, field => (
					<Field key={field.name} component={this.renderField.bind(this)} {...field} />
				));
				return [<h6 key={header}>{header}</h6>, ...elements];
			});
		}

		render() {
			const { handleSubmit, onSubmit } = this.props;
			return (
				<div className="container">
					<form onSubmit={handleSubmit(onSubmit)}>
						<div className="form-card">
							{this.renderFieldGroups()}
							<div className="buttons">
								<button type="reset">Reset</button>
								<button type="submit">{isNew ? "Add" : "Update"}</button>
							</div>
						</div>
					</form>
				</div>
			);
		}
	}

	//Helper Methods
	function validate(values) {
		const errors = {};
		_.map(fieldGroups, fields => {
			_.map(fields, field => {
				const { name, required, type } = field;

				//Check for empty required fields
				if (required) {
					let isValid = false;
					switch (type) {
						case "select":
							break;
						default:
							isValid = values[name];
					}

					if (!isValid) {
						errors[name] = "Please enter a value";
					}
				}
			});
		});

		if (customValidation) {
			customValidation(values, errors, fieldGroups);
		}

		return errors;
	}
	const Form = reduxForm({ form: formName, validate })(AdminStandardForm);
	return <Form {...props} />;
};
