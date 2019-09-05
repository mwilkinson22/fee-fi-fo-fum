//Modules
import _ from "lodash";
import React, { Component } from "react";
import { Field, FastField, ErrorMessage } from "formik";
import Select from "react-select";
import selectStyling from "~/constants/selectStyling";

//Components
import BooleanField from "./fields/Boolean";
import Radio from "./fields/Radio";
import ImageField from "./fields/ImageField";
import TweetComposer from "../TweetComposer";

export default class BasicForm extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	extractValidationRule(name, description) {
		return name
			.split(".")
			.join(".fields.")
			.split(".")
			.reduce(function(prev, curr) {
				return prev ? prev[curr] : null;
			}, description || self);
	}

	processFieldProperties(fields) {
		const { validationSchema } = this.state;
		if (!validationSchema) {
			throw new Error(
				"Validation Schema must be stored within state to use processFieldProperties"
			);
		}
		const validationSchemaFields = validationSchema.describe().fields;
		return fields.map(field => {
			const extractedField = this.extractValidationRule(field.name, validationSchemaFields);
			if (extractedField) {
				const { label, tests } = extractedField;

				//Get Label
				if (!field.label) {
					field.label = label || field.name;
				}

				//Determine Required Status
				field.required = Boolean(tests.find(test => test.name === "required"));

				//Get Min & Max
				const min = tests.find(test => test.name === "min");
				const max = tests.find(test => test.name === "max");
				if (min) {
					field.min = min.params.min;
				}
				if (max) {
					field.max = max.params.max;
				}
			} else {
				field.label = field.name;
			}
			return field;
		});
	}

	renderFieldGroup(fields, disableFastField = false) {
		return _.chain(this.processFieldProperties(fields))
			.map(field => {
				const { name, label, required } = field;

				const renderedField =
					field.renderedComponent || this.renderField({ disableFastField, ...field });

				return [
					<label key={`${name}-label`} className={required ? "required" : ""}>
						{label}
					</label>,
					renderedField,
					<span key={`${name}-error`} className="error">
						<ErrorMessage name={name} />
					</span>
				];
			})
			.flatten()
			.value();
	}

	renderField(field) {
		const { label, type, name, disableFastField, ...props } = field;

		//Get Render Method
		const render = formikProps => {
			//Update default onChange method for custom Select component
			if (["Select", "Tweet", "Image"].indexOf(type) > -1) {
				formikProps.field.onChange = option => {
					formikProps.form.setFieldTouched(field.name, true);
					formikProps.form.setFieldValue(field.name, option || "");
				};
			}

			//We load in formikProps.field first, so we can overwrite
			//the default methods in the initial field object
			const mainProps = {
				...formikProps.field,
				...props
			};
			//Get the final component
			switch (type) {
				case "Boolean":
					return <BooleanField {...mainProps} />;
				case "Radio":
					return <Radio {...mainProps} />;
				case "Select":
					return (
						<Select className="react-select" styles={selectStyling} {...mainProps} />
					);
				case "Image":
					return <ImageField {...mainProps} />;
				case "Tweet":
					return (
						<TweetComposer
							initialContent={mainProps.value}
							textContent={mainProps.value}
							includeButton={false}
							{...mainProps}
						/>
					);
				case "textarea":
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

		if (disableFastField) {
			return <Field {...fieldProps} />;
		} else {
			return <FastField {...fieldProps} />;
		}
	}

	render() {
		return null;
	}
}
