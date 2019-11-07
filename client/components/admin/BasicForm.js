//Modules
import _ from "lodash";
import React, { Component } from "react";
import { withRouter, Prompt } from "react-router-dom";
import PropTypes from "prop-types";
import { Formik, Form } from "formik";

//Components
import DeleteButtons from "./fields/DeleteButtons";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { extractYupData, renderFieldGroup as rFG } from "~/helpers/formHelper";

class BasicForm extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isSubmitting: false,
			unsavedChanges: false
		};
	}

	static getDerivedStateFromProps(nextProps) {
		const newState = _.pick(nextProps, [
			"fieldGroups",
			"initialValues",
			"isNew",
			"validationSchema"
		]);

		//Validate field groups
		_.chain(nextProps.fieldGroups)
			.map("fields")
			.flatten()
			.each(field => {
				let error;
				switch (field.type) {
					case fieldTypes.radio:
					case fieldTypes.select:
					case fieldTypes.asyncSelect: {
						if (!field.options || !field.options.length) {
							error = `Field of type ${field.type} must have an options property`;
						}
						break;
					}
					case fieldTypes.image: {
						if (!field.path) {
							error = `Field of type ${field.type} must have a path property`;
						}
						break;
					}
				}

				if (error) {
					console.error(error, field);
				}
			})
			.value();

		return newState;
	}

	//TO BE DELETED
	renderFieldGroup(fields, disableFastField = false) {
		const { validationSchema } = this.state;
		return rFG(fields, validationSchema, !disableFastField);
	}

	processValues(values, fields, parentPath = []) {
		return _.mapValues(values, (val, key) => {
			let newValue;
			if (typeof val !== "object") {
				newValue = val;
			} else if (Array.isArray(val)) {
				//multi select
				newValue = val.length ? val.map(({ value }) => value) : null;
			} else {
				//First we determine whether there is a field by this name
				const field = fields[[...parentPath, key].join(".")];

				if (
					field &&
					(field.type === fieldTypes.select || field.type === fieldTypes.asyncSelect)
				) {
					//If it's a select, we pull off the value
					newValue = val.value;
				} else {
					//Otherwise, we go recursive
					newValue = this.processValues(val, fields, [...parentPath, key]);
				}
			}

			return newValue === "" ? null : newValue;
		});
	}

	async handleSubmit(fValues) {
		const { history, onSubmit, redirectOnSubmit } = this.props;
		const { fieldGroups } = this.state;

		//Disable the submit button
		this.setState({ isSubmitting: true });

		//Get flat field list
		const fields = _.chain(fieldGroups)
			.map("fields")
			.flatten()
			.keyBy("name")
			.value();

		//Process values (pull value from select fields, convert empty strings to null, etc)
		const values = this.processValues(_.cloneDeep(fValues), fields);

		//Submit
		const result = await onSubmit(values);

		//Revert State
		this.setState({ isSubmitting: true, unsavedChanges: false });

		//Redirect
		if (typeof redirectOnSubmit === "function" && result && redirectOnSubmit(result)) {
			history.push(redirectOnSubmit(result));
		} else if (typeof redirectOnSubmit === "string") {
			history.push(redirectOnSubmit);
		}
	}

	async handleDelete() {
		const { history, onDelete, redirectOnDelete } = this.props;

		const success = await onDelete();

		if (success && redirectOnDelete) {
			history.replace(redirectOnDelete);
		}
	}

	renderFields() {
		const { fastFieldByDefault } = this.props;
		const { fieldGroups, unsavedChanges, validationSchema } = this.state;

		let extraOnChange;
		if (!unsavedChanges) {
			extraOnChange = () => this.setState({ unsavedChanges: true });
		}

		return fieldGroups.map(({ label, fields }) => {
			return [
				label ? <h6 key="label">{label}</h6> : null,
				rFG(fields, validationSchema, fastFieldByDefault, extraOnChange)
			];
		});
	}

	renderErrors(nestedErrors) {
		const { validationSchema } = this.props;

		if (Object.keys(nestedErrors).length) {
			//Convert from { address : { city: "" } } to { address.city: "" }
			const errors = {};
			(function recurse(obj, current) {
				for (var key in obj) {
					var value = obj[key];
					var newKey = current ? current + "." + key : key;
					if (value && typeof value === "object") {
						recurse(value, newKey);
					} else {
						errors[newKey] = value;
					}
				}
			})(nestedErrors);

			const errorList = Object.keys(errors).map(name => {
				const yupField = extractYupData(name, validationSchema);
				const label = yupField && yupField.label ? yupField.label : name;
				return <li key={name}>{label}</li>;
			});
			return (
				<div className="error">
					<strong>The following fields have errors:</strong>
					<ul>{errorList}</ul>
				</div>
			);
		}
	}

	renderDeleteButtons() {
		const { onDelete } = this.props;
		if (onDelete) {
			return (
				<div className="form-card">
					<DeleteButtons onDelete={() => this.handleDelete()} />
				</div>
			);
		}
	}

	render() {
		const { itemType } = this.props;
		const { initialValues, isNew, isSubmitting, validationSchema, unsavedChanges } = this.state;

		return (
			<Formik
				enableReinitialize={true}
				initialValues={initialValues}
				onSubmit={values => this.handleSubmit(values)}
				validationSchema={validationSchema}
				render={({ errors }) => {
					return (
						<Form>
							<Prompt
								when={unsavedChanges}
								message="You have unsaved changes. Are you sure you want to navigate away?"
							/>
							<div className="form-card grid">
								{this.renderFields()}
								{this.renderErrors(errors)}
								<div className="buttons">
									<button type="reset">Reset</button>
									<button
										type="submit"
										className="confirm"
										disabled={isSubmitting || Object.keys(errors).length}
									>
										{isNew ? "Add" : "Update"} {itemType}
									</button>
								</div>
							</div>
							{this.renderDeleteButtons()}
						</Form>
					);
				}}
			/>
		);
	}
}

BasicForm.propTypes = {
	fastFieldByDefault: PropTypes.bool,
	fieldGroups: PropTypes.arrayOf(
		PropTypes.shape({
			label: PropTypes.string,
			fields: PropTypes.arrayOf(
				PropTypes.shape({
					name: PropTypes.string.isRequired,
					type: PropTypes.oneOf(_.values(fieldTypes))
				})
			).isRequired
		})
	).isRequired,
	initialValues: PropTypes.object.isRequired,
	isNew: PropTypes.bool.isRequired,
	itemType: PropTypes.string.isRequired,
	onDelete: PropTypes.func, // Action
	onSubmit: PropTypes.func.isRequired, //values => Action(id, values)
	redirectOnDelete: PropTypes.string,
	//Either a simple string, or a callback passing in form values and action result
	redirectOnSubmit: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
	validationSchema: PropTypes.object.isRequired
};

BasicForm.defaultProps = {
	fastFieldByDefault: true,
	redirectOnDelete: `/admin/`
};

export default withRouter(BasicForm);
