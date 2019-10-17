import _ from "lodash";

export function fixDates(posts) {
	return _.mapValues(posts, post => {
		if (post) {
			if (post.dateCreated) {
				post.dateCreated = new Date(post.dateCreated);
			}
			if (post.dateModified) {
				post.dateModified = new Date(post.dateModified);
			}
		}
		return post;
	});
}
