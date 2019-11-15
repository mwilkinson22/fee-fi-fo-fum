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
import { nestedObjectToDot } from "~/helpers/genericHelper";
import { extractYupData, renderFieldGroup } from "~/helpers/formHelper";

class BasicForm extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const newState = _.pick(nextProps, [
			"fieldGroups",
			"initialValues",
			"isNew",
			"validationSchema"
		]);

		return newState;
	}

	getFieldGroups(values) {
		const { fieldGroups } = this.props;
		if (typeof fieldGroups === "function") {
			return fieldGroups(values);
		} else {
			return fieldGroups;
		}
	}

	validateFieldGroups(values) {
		const fieldGroups = this.getFieldGroups(values);

		_.chain(fieldGroups)
			.filter("fields")
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
	}

	processValues(values, fields, parentPath = [], isArray = false) {
		const callback = (val, key) => {
			let newValue;
			if (typeof val !== "object") {
				newValue = val;
			} else if (Array.isArray(val)) {
				newValue = this.processValues(val, fields, [...parentPath, key], true);
			} else {
				//First we determine whether there is a field by this name
				let field;
				if (isArray) {
					field = fields[parentPath.join(".")];
				} else {
					field = fields[[...parentPath, key].join(".")];
				}

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

			return newValue == null || newValue.length === 0 ? null : newValue;
		};

		if (isArray) {
			return _.map(values, callback);
		} else {
			return _.mapValues(values, callback);
		}
	}

	async handleSubmit(fValues) {
		const {
			alterValuesBeforeSubmit,
			history,
			onSubmit,
			redirectOnSubmit,
			testMode
		} = this.props;

		const fieldGroups = this.getFieldGroups(fValues);

		//Get flat field list
		const fields = _.chain(fieldGroups)
			.map("fields")
			.flatten()
			.keyBy("name")
			.value();

		//Process values (pull value from select fields, convert empty strings to null, etc)
		let values = this.processValues(_.cloneDeep(fValues), fields);

		//Custom callback to manipulate values before submitting
		if (alterValuesBeforeSubmit) {
			alterValuesBeforeSubmit(values);
		}

		//Submit
		if (testMode) {
			console.info("Test outcome: ", values);
		} else {
			const result = await onSubmit(values);

			//Redirect
			if (typeof redirectOnSubmit === "function" && result && redirectOnSubmit(result)) {
				history.push(redirectOnSubmit(result));
			} else if (typeof redirectOnSubmit === "string") {
				history.push(redirectOnSubmit);
			}
		}
	}

	async handleDelete() {
		const { history, onDelete, redirectOnDelete, testMode } = this.props;

		if (!testMode) {
			const success = await onDelete();

			if (success && redirectOnDelete) {
				history.replace(redirectOnDelete);
			}
		}
	}

	renderFields(values) {
		const { fastFieldByDefault } = this.props;
		const { validationSchema } = this.state;
		const fieldGroups = this.getFieldGroups(values);

		//Validate
		this.validateFieldGroups(values);

		return fieldGroups.map(({ label, fields, render }) => {
			let content;

			if (render) {
				//Custom Render
				content = render(values);
			} else if (fields) {
				//Standard fields
				content = renderFieldGroup(fields, validationSchema, fastFieldByDefault);
			}
			return [label ? <h6 key="label">{label}</h6> : null, content];
		});
	}

	renderErrors(nestedErrors, nestedTouched) {
		const { validationSchema } = this.props;

		//Convert from { address : { city: "" } } to { address.city: "" }
		const touched = nestedObjectToDot(nestedTouched);

		//Only log the touched errors
		const errors = {};
		_.each(nestedObjectToDot(nestedErrors), (err, key) => {
			if (touched[key]) {
				errors[key] = err;
			}
		});

		if (Object.keys(errors).length) {
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

	renderSubmitButtons(isValid, isSubmitting) {
		const { itemType } = this.props;
		const { isNew } = this.state;

		let submitButtonText;
		if (isSubmitting) {
			if (isNew) {
				submitButtonText = "Adding";
			} else {
				submitButtonText = "Updating";
			}
		} else {
			if (isNew) {
				submitButtonText = "Add";
			} else {
				submitButtonText = "Update";
			}
		}

		const disableButtons = !isValid || isSubmitting;

		return (
			<div className="buttons">
				<button type="reset" disabled={disableButtons}>
					Reset
				</button>
				<button
					type="submit"
					className={disableButtons ? "" : "confirm"}
					disabled={disableButtons}
				>
					{submitButtonText} {itemType}
				</button>
			</div>
		);
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
		const { initialValues, validationSchema } = this.state;

		return (
			<Formik
				enableReinitialize={true}
				isInitialValid={false}
				initialValues={initialValues}
				onSubmit={values => this.handleSubmit(values)}
				validationSchema={validationSchema}
				render={({ errors, values, touched, isValid, isSubmitting }) => {
					return (
						<Form>
							<Prompt
								//As long as isInitialValid = false,
								//the isValid property will mean the form has changes
								//the !isSubmitting prevents prompts on redirectOnSubmit
								when={!isSubmitting && isValid}
								message="You have unsaved changes. Are you sure you want to navigate away?"
							/>
							<div className="form-card grid">
								{this.renderFields(values)}
								{this.renderErrors(errors, touched)}
								{this.renderSubmitButtons(isValid, isSubmitting)}
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
	alterValuesBeforeSubmit: PropTypes.func,
	fastFieldByDefault: PropTypes.bool,
	fieldGroups: PropTypes.oneOfType([
		PropTypes.func,
		PropTypes.arrayOf(
			PropTypes.shape({
				label: PropTypes.string,
				fields: PropTypes.arrayOf(
					PropTypes.shape({
						name: PropTypes.string.isRequired,
						type: PropTypes.oneOf(_.values(fieldTypes))
					})
				),
				//IMPORTANT! Fields produced by render will not go through processFields
				render: PropTypes.func //values => <FieldArray />
			})
		)
	]).isRequired,
	initialValues: PropTypes.object.isRequired,
	isNew: PropTypes.bool.isRequired,
	itemType: PropTypes.string.isRequired,
	onDelete: PropTypes.func, // Action
	onSubmit: PropTypes.func.isRequired, //values => Action(id, values)
	redirectOnDelete: PropTypes.string,
	//Either a simple string, or a callback passing in form values and action result
	redirectOnSubmit: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
	testMode: PropTypes.bool,
	validationSchema: PropTypes.object.isRequired
};

BasicForm.defaultProps = {
	fastFieldByDefault: true,
	redirectOnDelete: `/admin/`,
	testMode: false
};

export default withRouter(BasicForm);
