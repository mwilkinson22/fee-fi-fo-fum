export default (req, res, next) => {
	if (process.env.REDIRECT_URL) {
		//Check for www
		let host = req.get("host"); // localhost:3000, feefifofum.co.uk, www.feefifofum.co.uk;
		const www = host.match(/^www\..*/i);
		if (!www) {
			host = "www." + host;
		}

		// The 'x-forwarded-proto' check is for Heroku
		if ((!req.secure && req.get("x-forwarded-proto") !== "https") || !www) {
			return res.redirect("https://" + host + req.url);
		}
	}
	next();
};
