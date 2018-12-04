const ObjectId = require("mongoose").Types.ObjectId;
module.exports = async id => {
	let newId;
	try {
		newId = new ObjectId(id);
	} catch (error) {}
	return id == newId;
};
