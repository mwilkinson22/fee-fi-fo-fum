import { gc, googleBucketName } from "~/config/keys";
const { Storage } = require("@google-cloud/storage");
const storage = new Storage({
	credentials: gc
}).bucket(googleBucketName);
module.exports = storage;
