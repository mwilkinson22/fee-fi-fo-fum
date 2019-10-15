import * as Yup from "yup";
import passwordValidation from "~/constants/passwordValidation";

export function validateSlug(label = "Slug") {
	return Yup.string()
		.required()
		.matches(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and hyphens")
		.matches(/^[a-z0-9]/, "Slug must not begin with a hyphen")
		.matches(/[a-z0-9]$/, "Slug must not end with a hyphen")
		.label(label);
}

export function validatePasswordFields(fieldA = "password", fieldB = "password2") {
	return {
		[fieldA]: Yup.string()
			.required()
			.matches(
				passwordValidation,
				"Passwords must be at least 7 characters, and contain an uppercase letter, a lowercase letter, a number and a symbol"
			)
			.label("Password"),
		[fieldB]: Yup.string()
			.required()
			.oneOf([Yup.ref(fieldA)], "Passwords must match")
			.label("Confirm Password")
	};
}
