import _ from "lodash";
import { EditorState, convertFromRaw } from "draft-js";

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

export function convertToEditorState(text) {
	const convertedState = convertFromRaw(JSON.parse(text));
	return EditorState.createWithContent(convertedState);
}
