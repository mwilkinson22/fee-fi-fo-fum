const { googleBucketName } = require("./keys");

module.exports = source => {
	const replaceRegex = new RegExp("GOOGLE-BUCKET-NAME", "g");
	return source.replace(replaceRegex, googleBucketName);
};
