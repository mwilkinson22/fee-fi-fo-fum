//Modules
import _ from "lodash";
import React from "react";
import { Field, FastField, ErrorMessage } from "formik";
import Select, { Async } from "react-select";

//Input Components
import BooleanField from "~/client/components/admin/fields/Boolean";
import Radio from "~/client/components/admin/fields/Radio";
import ImageField from "~/client/components/admin/fields/ImageField";
import TweetComposer from "~/client/components/TweetComposer";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";
import selectStyling from "~/constants/selectStyling";

export function renderFieldGroup(fields, validationSchema, fastFieldByDefault = true) {
	return fields.map(field => renderField(field, validationSchema, fastFieldByDefault));
}
export function renderField(field, validationSchema, fastFieldByDefault = true) {
	if (!validationSchema || !validationSchema.describe()) {
		throw new Error("Yup Validation Schema required");
	}

	const validationSchemaFields = validationSchema.describe().fields;

	//Pull meta data from yup
	const yupField = field.name
		.split(".")
		.join(".fields.")
		.replace(/\.fields\.\d+\./, ".innerType.")
		.split(".")
		.reduce(function(prev, curr) {
			return prev ? prev[curr] : null;
		}, validationSchemaFields || self);

	//Get Label
	field.label = field.label || yupField.label || field.name;

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

	//Render Field Input
	const input = renderInput(field);

	return [
		<label key={`${field.name}-label`} className={field.required ? "required" : ""}>
			{field.label}
		</label>,
		input,
		<span key={`${field.name}-error`} className="error">
			<ErrorMessage name={field.name} />
		</span>
	];
}

export function renderInput(field) {
	const { label, type, name, fastField, ...props } = field;

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
			case fieldTypes.asyncSelect:
			case fieldTypes.image:
			case fieldTypes.tweet:
				formikProps.field.onChange = option => {
					formikProps.form.setFieldTouched(field.name, true);
					formikProps.form.setFieldValue(field.name, option || "");
				};
				break;
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
				return <BooleanField {...mainProps} />;
			case fieldTypes.radio:
				return <Radio {...mainProps} />;
			case fieldTypes.select:
				return <Select className="react-select" styles={selectStyling} {...mainProps} />;
			case fieldTypes.asyncSelect:
				return (
					<Async
						className="react-select"
						cacheOptions
						styles={selectStyling}
						{...mainProps}
					/>
				);
			case fieldTypes.image:
				return <ImageField {...mainProps} />;
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
