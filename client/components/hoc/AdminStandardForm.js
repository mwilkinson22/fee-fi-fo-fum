import _ from "lodash";
import React, { Component } from "react";
import { reduxForm, Field } from "redux-form";

export default props => {
	const { fieldGroups, onSubmit, formName, customValidation, isNew } = props;

	class AdminStandardForm extends Component {
		renderField(field) {
			const { touched, error } = field.meta;
			const id = field.input.name;
			return [
				<label key="label" htmlFor={id} className={field.required ? "required" : ""}>
					{field.label}
				</label>,
				<input key="input" type={field.type} {...field.input} value={field.defaultValue} />,
				<span key="error" className="error">
					{touched ? error : ""}
				</span>
			];
		}

		renderFieldGroups() {
			return _.map(fieldGroups, (fields, header) => {
				const elements = _.map(fields, field => (
					<Field key={field.name} component={this.renderField} {...field} />
				));
				return [<h6 key={header}>{header}</h6>, ...elements];
			});
		}

		render() {
			const { handleSubmit } = this.props;
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
				const { name, required } = field;

				//Check for empty required fields
				if (required && !values[name]) {
					errors[name] = "Please enter a value";
				}
			});
		});

		if (customValidation) {
			customValidation(values, errors);
		}

		return errors;
	}
	const Form = reduxForm({ form: formName, validate })(AdminStandardForm);
	return <Form {...props} />;
};
