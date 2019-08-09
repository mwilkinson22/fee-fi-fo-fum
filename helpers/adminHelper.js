import * as Yup from "yup";

export function validateSlug(label = "Slug") {
	return Yup.string()
		.required()
		.matches(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and hyphens")
		.matches(/^[a-z0-9]/, "Slug must not begin with a hyphen")
		.matches(/[a-z0-9]$/, "Slug must not end with a hyphen")
		.label(label);
}
