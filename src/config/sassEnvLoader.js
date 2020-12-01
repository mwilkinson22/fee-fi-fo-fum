const { googleBucketName, mainColour, trimColour } = require("./keys");

module.exports = source => {
	return source
		.replace(/GOOGLE-BUCKET-NAME/g, googleBucketName)
		.replace(/\$mainColour: transparent;/g, `$mainColour: ${mainColour || "#111111"};`)
		.replace(/\$trimColour: transparent;/g, `$trimColour: ${trimColour || "#000000"};`);
};
