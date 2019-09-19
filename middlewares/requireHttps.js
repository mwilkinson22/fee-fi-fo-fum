module.exports = (req, res, next) => {
	if (process.env.NODE_ENV !== "development") {
		// The 'x-forwarded-proto' check is for Heroku
		if (!req.secure && req.get("x-forwarded-proto") !== "https") {
			return res.redirect("https://" + req.get("host") + req.url);
		}
	}
	next();
};
