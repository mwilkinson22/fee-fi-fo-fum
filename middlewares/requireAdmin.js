import { authGuid } from "~/config/keys";
module.exports = (req, res, next) => {
	if (req.query.authGuid !== authGuid && (!req.user || !req.user.isAdmin)) {
		return res.status(401).send({
			error: "You must be logged in as an admin to perform this action"
		});
	}

	next();
};
