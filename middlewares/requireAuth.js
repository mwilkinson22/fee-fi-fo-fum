import { authGuid } from "~/config/keys";
module.exports = (req, res, next) => {
	if (req.query.authGuid !== authGuid && !req.user) {
		return res.status(401).send({ error: "You must be logged in to perform this action" });
	}

	next();
};
