const { gc, googleBucketName, googleProjectId } = require("~/config/keys");
const { Storage } = require("@google-cloud/storage");
const storage = new Storage({
	credentials: gc,
	projectId: googleProjectId
}).bucket(googleBucketName);
module.exports = storage;
