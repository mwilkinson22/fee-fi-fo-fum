import _ from "lodash";
import React from "react";
import { Field, FastField } from "formik";
import FormField from "../client/components/admin/fields/FormField";

export function processFormFields(fields, validationSchema, fastFields = false) {
	function resolve(path, obj) {
		return path
			.split(".")
			.join(".fields.")
			.split(".")
			.reduce(function(prev, curr) {
				return prev ? prev[curr] : null;
			}, obj || self);
	}
	return _.map(fields, field => {
		const validationRule = resolve(field.name, validationSchema.describe().fields);
		if (validationRule) {
			field.label = validationRule.label;
			field.required =
				typeof _.find(validationRule.tests, test => test.name === "required") === "object";

			//Min Max
			const min = _.filter(validationRule.tests, test => test.name === "min");
			const max = _.filter(validationRule.tests, test => test.name === "max");
			if (min.length) {
				field.min = min[0].params.min;
			}
			if (max.length) {
				field.max = max[0].params.max;
			}
		}
		const fieldProps = { key: field.name, component: FormField, ...field, withLabel: true };
		if (fastFields) {
			return <FastField {...fieldProps} />;
		} else {
			return <Field {...fieldProps} />;
		}
	});
}
