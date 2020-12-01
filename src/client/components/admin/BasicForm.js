//Modules
import _ from "lodash";
import React, { Component } from "react";
import { withRouter, Prompt } from "react-router-dom";
import { Formik, Form } from "formik";
import { editorStateToJSON } from "megadraft";
import { diff } from "deep-object-diff";

//Components
import DeleteButtons from "../fields/DeleteButtons";
import BooleanSlider from "../fields/BooleanSlider";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import { propTypes, defaultProps } from "~/constants/formPropTypes";

//Helpers
import { extractYupData, renderFieldGroup, getTouchedNestedErrors } from "~/helpers/formHelper";

class BasicForm extends Component {
	constructor(props) {
		super(props);

		if (props.testMode) {
			console.info("Form loaded in test mode");
		}

		this.state = {
			disableRedirect: false
		};
	}

	static getDerivedStateFromProps(nextProps) {
		const newState = _.pick(nextProps, [
			"enableRedirectBoolean",
			"fieldGroups",
			"initialValues",
			"isNew",
			"validationSchema",
			"readOnly"
		]);

		if (!newState.enableRedirectBoolean) {
			newState.disableRedirect = false;
		}

		return newState;
	}

	getFieldGroups(values) {
		const { fieldGroups } = this.props;
		const { readOnly } = this.state;

		//Get Groups
		let groups;
		if (typeof fieldGroups === "function") {
			groups = fieldGroups(values);
		} else {
			groups = fieldGroups;
		}

		//Conditionally add readonly
		if (readOnly) {
			groups = groups.map(group => {
				if (group.fields) {
					group.fields = group.fields.map(f => ({ ...f, readOnly }));
				}
				return group;
			});
		}

		return groups;
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
				//Convert megadraft to raw JSON.
				//editorStateToJSON actually returns a JSON.stringify result with
				//newlines and spaces, so we parse and re-stringify to compress for the
				//database
				newValue = JSON.stringify(JSON.parse(editorStateToJSON(val)));
			} else if (Array.isArray(val)) {
				//For arrays, go recursive, with isArray set to true
				newValue = this.processValues(val, fields, [...parentPath, key], true);
			} else if (typeof val === "object") {
				//For objects, we check for select fields
				const isSelect =
					field &&
					[fieldTypes.asyncSelect, fieldTypes.creatableSelect].indexOf(field.type) > -1;

				if (isSelect) {
					//If it's a creatable or async select, we pull off the value
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
		const { disableRedirect } = this.state;

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
			if (!disableRedirect) {
				if (typeof redirectOnSubmit === "function" && result && redirectOnSubmit(result)) {
					history.push(redirectOnSubmit(result));
				} else if (typeof redirectOnSubmit === "string") {
					history.push(redirectOnSubmit);
				}
			}

			//Required in case the submit is unsuccessful
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
		const { useFormCard, validationSchema } = this.props;

		const errors = getTouchedNestedErrors(nestedErrors, nestedTouched);

		if (Object.keys(errors).length) {
			const errorList = Object.keys(errors).map(name => {
				const yupField = extractYupData(name, validationSchema);
				const label = yupField && yupField.label ? yupField.label : name;
				return <li key={name}>{label}</li>;
			});
			const content = (
				<div className="error">
					<strong>The following fields have errors:</strong>
					<ul>{errorList}</ul>
				</div>
			);

			if (useFormCard) {
				//If the parent is a form-card, we return as-is
				return content;
			} else {
				//Otherwise, wrap it in in a form-card
				return <div className="form-card">{content}</div>;
			}
		}
	}

	renderSubmitButtons(formHasChanged, isSubmitting) {
		let {
			isInitialValid,
			itemType,
			replaceResetButton,
			enforceDisable,
			submitButtonText,
			useFormCard
		} = this.props;
		const { disableRedirect, enableRedirectBoolean, isNew, readOnly } = this.state;

		if (readOnly) {
			return null;
		}

		//Get text for submit button
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

		//Work out whether buttons are disabled
		const disableReset = (!formHasChanged && !isInitialValid) || isSubmitting;
		const disableSubmit = enforceDisable || disableReset;

		const resetButton = replaceResetButton || (
			<button type="reset" disabled={disableReset}>
				Reset
			</button>
		);

		//Create Buttons
		const content = [
			<div className="buttons" key="buttons">
				{resetButton}
				<button
					type="submit"
					className={disableSubmit ? "" : "confirm"}
					disabled={disableSubmit}
				>
					{submitButtonText}
				</button>
			</div>
		];

		//Add redirect boolean, if necessary
		if (enableRedirectBoolean) {
			content.unshift(
				<hr key="redirect-bool-divider" />,
				<label key="redirect-bool-label">Disable Redirect on Submit?</label>,
				<BooleanSlider
					value={disableRedirect}
					name="disable-redirect"
					key="redirect-bool"
					onChange={() => this.setState({ disableRedirect: !disableRedirect })}
				/>
			);
		}

		//Return data
		if (useFormCard) {
			//If the parent is a form-card, we return as-is
			return content;
		} else {
			//Otherwise, wrap it in in a form-card
			return <div className="form-card grid">{content}</div>;
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
		const {
			className,
			isInitialValid,
			onReset,
			promptOnExit,
			retrieveValues,
			useFormCard,
			useGrid
		} = this.props;
		const { initialValues, readOnly, validationSchema } = this.state;

		let divClass;
		if (useFormCard) {
			divClass = "form-card";

			if (useGrid) {
				divClass += " grid";
			}
		}

		return (
			<Formik
				enableReinitialize={true}
				isInitialValid={isInitialValid}
				initialValues={initialValues}
				onReset={onReset}
				onSubmit={(values, formikProps) =>
					readOnly ? {} : this.handleSubmit(values, formikProps)
				}
				validationSchema={validationSchema}
			>
				{formikProps => {
					const { errors, initialValues, values, touched, isSubmitting } = formikProps;

					if (retrieveValues) {
						retrieveValues(values);
					}

					const formHasChanged = Object.keys(diff(values, initialValues)).length > 0;
					return (
						<Form className={className}>
							<Prompt
								when={promptOnExit && !isSubmitting && formHasChanged}
								message="You have unsaved changes. Are you sure you want to navigate away?"
							/>
							<div className={divClass}>
								{this.renderFields(values, formikProps)}
								{this.renderErrors(errors, touched)}
								{this.renderSubmitButtons(formHasChanged, isSubmitting)}
							</div>
							{this.renderDeleteButtons()}
						</Form>
					);
				}}
			</Formik>
		);
	}
}

BasicForm.propTypes = propTypes;
BasicForm.defaultProps = defaultProps;

export default withRouter(BasicForm);
