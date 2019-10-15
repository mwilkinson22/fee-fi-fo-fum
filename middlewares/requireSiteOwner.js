export default (req, res, next) => {
	if (!req.user || !req.user.isSiteOwner) {
		return res.status(401).send({
			error: "You must be logged in the site owner to perform this action"
		});
	}

	next();
};
