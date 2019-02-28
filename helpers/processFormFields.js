import _ from "lodash";
import React from "react";
import { Field } from "formik";
import FormField from "../client/components/admin/fields/FormField";

export default function(fields, validationSchema) {
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
		}
		return <Field key={field.name} component={FormField} {...field} withLabel={true} />;
	});
}
