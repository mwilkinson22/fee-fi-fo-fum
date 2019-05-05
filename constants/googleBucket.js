const { Storage } = require("@google-cloud/storage");
const storage = new Storage().bucket("feefifofum");
module.exports = storage;
