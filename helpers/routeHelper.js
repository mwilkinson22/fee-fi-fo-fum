//Modules
import _ from "lodash";

export function matchSlugToItem(slug, list, redirects) {
	//First, try a direct slug match
	let item = _.find(list, i => i.slug == slug);

	if (item) {
		return { item, redirect: false };
	} else {
		//If there's no match, look for a redirect
		const redirectId = redirects[slug];
		item = list[redirectId];

		if (item) {
			return { item, redirect: true };
		} else {
			return { item: null };
		}
	}
}
