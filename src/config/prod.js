module.exports = {
	airbrakeId: process.env.AIRBRAKE_PROJECT_ID,
	airbrakeKey: process.env.AIRBRAKE_API_KEY,
	apiUrl: process.env.API_URL,
	authGuid: process.env.AUTH_GUID,
	cookieKey: process.env.COOKIE_KEY,
	defaultSocialProfile: process.env.DEFAULT_SOCIAL_PROFILE,
	facebookApp: process.env.FACEBOOK_APP,
	fansCanAttend: process.env.FANS_CAN_ATTEND !== "0",
	localTeam: process.env.LOCAL_TEAM,
	gaTracking: process.env.GA_TRACKING,
	gc: {
		client_email: process.env.GC_EMAIL,
		private_key: process.env.GC_KEY
	},
	googleBucketName: process.env.GOOGLE_BUCKET,
	googleMapsKey: process.env.GOOGLE_MAPS,
	logMongooseTimings: process.env.LOG_MONGOOSE == "1",
	mainColour: process.env.MAIN_COLOUR,
	mainCompetitionSegment: process.env.MAIN_COMPETITION,
	mongoURI: process.env.MONGO_URI,
	newsPostsPerPage: parseInt(process.env.NEWS_POSTS_PER_PAGE),
	sites: {
		dev: process.env.SITES_DEV,
		test: process.env.SITES_TEST,
		live: process.env.SITES_LIVE
	},
	ticketLink: process.env.TICKET_LINK,
	trimColour: process.env.TRIM_COLOUR
};
