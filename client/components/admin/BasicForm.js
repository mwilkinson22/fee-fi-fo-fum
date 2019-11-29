//Modules
import _ from "lodash";
import React, { Component } from "react";
import { withRouter, Prompt } from "react-router-dom";
import PropTypes from "prop-types";
import { Formik, Form } from "formik";
import { convertToRaw } from "draft-js";

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

		if (props.testMode) {
			console.info("Form loaded in test mode");
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		return _.pick(nextProps, ["fieldGroups", "initialValues", "isNew", "validationSchema"]);
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
					case fieldTypes.select: {
						if (!field.options) {
							error = `Field of type ${field.type} must have an options property`;
						}
						break;
					}
					case fieldTypes.asyncSelect: {
						if (!field.loadOptions) {
							error = `Field of type ${field.type} must have a loadOptions property`;
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
			//First we determine whether there is a field by this name
			let field;
			if (isArray) {
				field = fields[parentPath.join(".")];
			} else {
				field = fields[[...parentPath, key].join(".")];
			}

			//Convert value
			let newValue;
			if (field && field.type === fieldTypes.draft) {
				//For rich text fields, simply convert to raw
				newValue = JSON.stringify(convertToRaw(val.getCurrentContent()));
			} else if (Array.isArray(val)) {
				//For arrays, go recursive, with isArray set to true
				newValue = this.processValues(val, fields, [...parentPath, key], true);
			} else if (typeof val === "object") {
				//For objects, we check for select fields
				const isSelect =
					field &&
					[fieldTypes.select, fieldTypes.asyncSelect, fieldTypes.creatableSelect].indexOf(
						field.type
					) > -1;

				if (isSelect) {
					//If it's a select, we pull off the value
					newValue = val.value;
				} else {
					//Otherwise, we go recursive
					newValue = this.processValues(val, fields, [...parentPath, key]);
				}
			} else {
				//For any non-object/array fields, simply return the value as is
				newValue = val;
			}

			return newValue == null || newValue.length === 0 ? null : newValue;
		};

		if (isArray) {
			return _.map(values, callback);
		} else {
			return _.mapValues(values, callback);
		}
	}

	async handleSubmit(fValues, formikProps) {
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
			const newValues = alterValuesBeforeSubmit(values);
			//Most of the time we just manipulate the object without
			//returning anything from this method.
			//When we do return, we assign the returned value here
			if (newValues) {
				values = newValues;
			}
		}

		//Submit
		if (testMode) {
			console.info("Test outcome: ", values);
		} else {
			const result = await onSubmit(values, formikProps);

			//Redirect
			if (typeof redirectOnSubmit === "function" && result && redirectOnSubmit(result)) {
				history.push(redirectOnSubmit(result));
			} else if (typeof redirectOnSubmit === "string") {
				history.push(redirectOnSubmit);
			}

			//Required in case the submit is unsuccesful
			formikProps.setSubmitting(false);
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

	renderFields(values, formikProps) {
		const { fastFieldByDefault, testMode } = this.props;
		const { validationSchema } = this.state;
		const fieldGroups = this.getFieldGroups(values);

		//Validate
		this.validateFieldGroups(values);

		//Log in test mode
		if (testMode) {
			console.info("Values", values);
			console.info("Field Groups", fieldGroups);
			if (Object.keys(formikProps.errors).length) {
				console.info("Errors", formikProps.errors);
			}
		}

		return fieldGroups.map(({ label, fields, render }) => {
			let content;

			if (render) {
				//Custom Render
				content = render(values, formikProps);
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
		let { itemType, submitButtonText, useFormCard } = this.props;
		const { isNew } = this.state;

		if (!submitButtonText) {
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
			submitButtonText += ` ${itemType}`;
		}

		const disableButtons = !isValid || isSubmitting;

		const buttons = (
			<div className="buttons">
				<button type="reset" disabled={disableButtons}>
					Reset
				</button>
				<button
					type="submit"
					className={disableButtons ? "" : "confirm"}
					disabled={disableButtons}
				>
					{submitButtonText}
				</button>
			</div>
		);

		if (useFormCard) {
			//If the parent is a form-card, we return as-is
			return buttons;
		} else {
			//Otherwise, wrap it in in a form-card
			return <div className="form-card">{buttons}</div>;
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
		const { className, isInitialValid, onReset, useFormCard, useGrid } = this.props;
		const { initialValues, validationSchema } = this.state;

		const divClass = [className];
		if (useFormCard) {
			divClass.push("form-card");

			if (useGrid) {
				divClass.push("grid");
			}
		}

		return (
			<Formik
				enableReinitialize={true}
				isInitialValid={isInitialValid}
				initialValues={initialValues}
				onReset={onReset}
				onSubmit={(values, formikProps) => this.handleSubmit(values, formikProps)}
				validationSchema={validationSchema}
				render={formikProps => {
					const { errors, values, touched, isValid, isSubmitting } = formikProps;
					return (
						<Form>
							<Prompt
								//As long as isInitialValid = false,
								//the isValid property will mean the form has changes
								//the !isSubmitting prevents prompts on redirectOnSubmit
								when={!isSubmitting && isValid}
								message="You have unsaved changes. Are you sure you want to navigate away?"
							/>
							<div className={divClass.join(" ")}>
								{this.renderFields(values, formikProps)}
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
	className: PropTypes.string,
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
	isInitialValid: PropTypes.bool,
	isNew: PropTypes.bool.isRequired,
	itemType: PropTypes.string.isRequired,
	onDelete: PropTypes.func, // Action
	onReset: PropTypes.func,
	onSubmit: PropTypes.func.isRequired, //values => Action(id, values)
	redirectOnDelete: PropTypes.string,
	//Either a simple string, or a callback passing in form values and action result
	redirectOnSubmit: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
	submitButtonText: PropTypes.string,
	testMode: PropTypes.bool,
	useGrid: PropTypes.bool,
	useFormCard: PropTypes.bool,
	validationSchema: PropTypes.object.isRequired
};

BasicForm.defaultProps = {
	className: "",
	fastFieldByDefault: true,
	isInitialValid: false,
	redirectOnDelete: `/admin/`,
	submitButtonText: null,
	testMode: false,
	useGrid: true,
	useFormCard: true
};

export default withRouter(BasicForm);
