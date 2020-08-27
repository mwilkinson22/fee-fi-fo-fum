//Modules
import _ from "lodash";
import React from "react";
import { Field, FastField, ErrorMessage, FieldArray } from "formik";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import CreatableSelect from "react-select/creatable";

//Input Components
import BooleanSlider from "~/client/components/fields/BooleanSlider";
import Radio from "~/client/components/fields/Radio";
import ImageField from "~/client/components/fields/ImageField";
import DraftEditor from "~/client/components/fields/DraftEditor";
import TweetComposer from "~/client/components/TweetComposer";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import selectStyling from "~/constants/selectStyling";

//Helpers
import { nestedObjectToDot } from "./genericHelper";

export function extractYupData(name, validationSchema) {
	return (
		name
			//Handle objects
			.split(".")
			.join(".fields.")
			//Handle arrays of objects
			.replace(/\.fields\.\d+\./g, ".innerType.")
			//Handle arrays of simple types
			.replace(/\.fields\.\d+$/g, ".innerType")
			//Convert to dot notation
			.split(".")
			.reduce(
				(prev, curr) => (prev ? prev[curr] : null),
				validationSchema.describe().fields || self
			)
	);
}

export function renderFieldGroup(fields, validationSchema, fastFieldByDefault = true) {
	return fields.map(field => renderField(field, validationSchema, fastFieldByDefault));
}
export function renderField(field, validationSchema, fastFieldByDefault = true) {
	if (!validationSchema || !validationSchema.describe()) {
		throw new Error("Yup Validation Schema required");
	}

	if (field.type == fieldTypes.fieldArray) {
		const key = field.key || field.name + "-fieldArray";
		return <FieldArray name={field.name} render={field.render} key={key} />;
	} else {
		//Pull meta data from yup
		const yupField = extractYupData(field.name, validationSchema);

		if (!yupField) {
			throw new Error(`Field name '${field.name}' not found in validation schema`);
		}

		//Get Label
		field.label = field.label || yupField.label;
		if (field.label == null) {
			field.label = field.name;
		}

		//Determine Required Status
		field.required = Boolean(yupField.tests.find(test => test.name === "required"));

		//Get Min & Max
		const min = yupField.tests.find(test => test.name === "min");
		const max = yupField.tests.find(test => test.name === "max");
		if (min) {
			field.min = min.params.min;
		}
		if (max) {
			field.max = max.params.max;
		}

		//FastField eligibility
		if (field.fastField == null) {
			field.fastField = fastFieldByDefault;
		}

		//Get Label
		let label;
		if (field.label) {
			label = (
				<label key={`${field.name}-label`} className={field.required ? "required" : ""}>
					{field.label}
				</label>
			);
		}

		//Render Field Input
		const input = renderInput(field);

		//Error Message
		const error = (
			<span key={`${field.name}-error`} className="error">
				<ErrorMessage name={field.name} />
			</span>
		);

		return [label, input, error];
	}
}

export function renderInput(field) {
	const { label, type, name, fastField, customOnChange, ...props } = field;

	if (!_.find(fieldTypes, t => t == type)) {
		throw new Error(
			`Invalid field type '${type}' supplied to renderField for field '${label}' `
		);
	}

	//Get Render Method
	const render = formikProps => {
		//Update default onChange method for custom Select component
		switch (type) {
			case fieldTypes.select:
			case fieldTypes.creatableSelect:
				formikProps.field.onChange = option => {
					formikProps.form.setFieldTouched(field.name, true);
					if (props.isMulti) {
						formikProps.form.setFieldValue(
							field.name,
							option ? option.map(o => o.value) : ""
						);
					} else {
						formikProps.form.setFieldValue(field.name, option ? option.value : "");
					}
				};
				break;
			case fieldTypes.asyncSelect:
			case fieldTypes.image:
			case fieldTypes.draft:
			case fieldTypes.tweet:
				formikProps.field.onChange = option => {
					formikProps.form.setFieldTouched(field.name, true);
					formikProps.form.setFieldValue(field.name, option || "");
				};
				break;
		}

		//Customise readonly property where necessary
		switch (type) {
			case fieldTypes.select:
			case fieldTypes.creatableSelect:
			case fieldTypes.asyncSelect:
				formikProps.field.isDisabled = field.readOnly;
		}

		//Wire in custom onChange
		//Mainly used to set unsavedChanges
		if (customOnChange) {
			const originalOnChange = formikProps.field.onChange;
			formikProps.field.onChange = option => {
				originalOnChange(option);
				customOnChange(option, formikProps);
			};
		}

		//We load in formikProps.field first, so we can overwrite
		//the default methods in the initial field object
		const mainProps = {
			...formikProps.field,
			...props
		};

		//Get the main component
		switch (type) {
			case fieldTypes.boolean:
				return <BooleanSlider {...mainProps} />;
			case fieldTypes.radio:
				return <Radio {...mainProps} />;
			case fieldTypes.creatableSelect:
				if (mainProps.showDropdown === false) {
					mainProps.components = { DropdownIndicator: () => null, Menu: () => null };
					delete mainProps.showDropdown;
				}

				if (mainProps.isMulti) {
					if (mainProps.value) {
						mainProps.value = mainProps.value.map(str => ({
							value: str,
							label: str
						}));
					} else {
						mainProps.value = [];
					}
				} else {
					mainProps.value = { value: mainProps.value, label: mainProps.value };
				}
				return (
					<CreatableSelect
						className="react-select"
						styles={selectStyling}
						{...mainProps}
						value={mainProps.value || ""}
					/>
				);
			case fieldTypes.select: {
				let { options, value } = mainProps;

				//Flatten Options if nested
				if (mainProps.isNested) {
					options = _.flatten(mainProps.options.map(o => o.options || o));
				}

				//Pull value from nested options
				if (mainProps.isMulti) {
					if (mainProps.value) {
						value = mainProps.value.map(valueInArray =>
							options.find(({ value }) => value == valueInArray)
						);
					} else {
						value = [];
					}
				} else {
					value = options.find(({ value }) => value == mainProps.value);
				}

				return (
					<Select
						className="react-select"
						styles={selectStyling}
						{...mainProps}
						value={value || ""}
					/>
				);
			}
			case fieldTypes.asyncSelect:
				return (
					<AsyncSelect
						className="react-select"
						cacheOptions
						styles={selectStyling}
						{...mainProps}
					/>
				);
			case fieldTypes.image:
				return <ImageField {...mainProps} />;
			case fieldTypes.draft:
				return <DraftEditor {...mainProps} />;
			case fieldTypes.tweet:
				return (
					<TweetComposer
						initialContent={mainProps.value}
						textContent={mainProps.value}
						includeButton={false}
						{...mainProps}
					/>
				);
			case fieldTypes.textarea:
				return <textarea className="form-textarea" rows={10} {...mainProps} />;
			default:
				return <input {...mainProps} type={type} />;
		}
	};

	const fieldProps = {
		name,
		key: name,
		render
	};

	if (fastField) {
		return <FastField {...fieldProps} />;
	} else {
		return <Field {...fieldProps} />;
	}
}

export function getTouchedNestedErrors(nestedErrors, nestedTouched) {
	//Convert from { address : { city: "" } } to { address.city: "" }
	const touched = nestedObjectToDot(nestedTouched);

	//Only log the touched errors
	const errors = {};
	_.each(nestedObjectToDot(nestedErrors), (err, key) => {
		if (touched[key]) {
			errors[key] = err;
		}
	});

	return errors;
}
