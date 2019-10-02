const { gc, googleBucketName } = require("~/config/keys");
const { Storage } = require("@google-cloud/storage");
const storage = new Storage({
	credentials: gc
}).bucket(googleBucketName);
module.exports = storage;
