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

export function getHeaderImage(post, bucketPaths, useWebp, size = null) {
	let src = post.image;

	const isRaster =
		["png", "jpg", "jpeg"].indexOf(
			src
				.split(".")
				.pop()
				.toLowerCase()
		) > -1;

	if (isRaster) {
		//If a size is defined, look in the corresponding folder
		if (size) {
			const splitSrc = src.split("/");
			const filename = splitSrc.pop();
			src = `${splitSrc.join("/")}${size}/${filename}`;
		}

		//If webp is supported, change the extension
		if (useWebp) {
			src = src.replace(/\.[a-z]+$/, ".webp");
		}
	}

	return bucketPaths.images.newsHeader + src;
}
