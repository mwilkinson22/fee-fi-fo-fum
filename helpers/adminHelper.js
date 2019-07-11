import * as Yup from "yup";

export function validateSlug(label = "Slug") {
	return Yup.string()
		.required()
		.matches(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and hyphens")
		.matches(/^[a-z0-9]/, "Slug must not begin with a hyphen")
		.matches(/[a-z0-9]$/, "Slug must not end with a hyphen")
		.label(label);
}

export function fixFiles(files) {
	return files
		.map(file => {
			if (file) {
				file.created = new Date(file.created);
				file.updated = new Date(file.updated);
				file.size = Number(file.size);
			}
			return file;
		})
		.sort((a, b) => (a.updated < b.updated ? 1 : -1));
}
