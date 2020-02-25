module.exports = {
	authGuid: process.env.AUTH_GUID,
	cookieKey: process.env.COOKIE_KEY,
	defaultSocialProfile: process.env.DEFAULT_SOCIAL_PROFILE,
	earliestGiantsData: 2017,
	localTeam: process.env.LOCAL_TEAM,
	gaTracking: process.env.GA_TRACKING,
	gc: {
		client_email: process.env.GC_EMAIL,
		private_key: process.env.GC_KEY
	},
	googleBucketName: process.env.GOOGLE_BUCKET,
	mongoURI: process.env.MONGO_URI,
	ticketLink: process.env.TICKET_LINK
};
