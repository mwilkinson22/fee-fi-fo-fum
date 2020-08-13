module.exports = {
	airbrakeId: process.env.AIRBRAKE_PROJECT_ID,
	airbrakeKey: process.env.AIRBRAKE_API_KEY,
	apiUrl: process.env.API_URL,
	authGuid: process.env.AUTH_GUID,
	cookieKey: process.env.COOKIE_KEY,
	defaultSocialProfile: process.env.DEFAULT_SOCIAL_PROFILE,
	earliestLocalGames: process.env.EARLIEST_LOCAL,
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
	mainColour: process.env.MAIN_COLOUR,
	mongoURI: process.env.MONGO_URI,
	ticketLink: process.env.TICKET_LINK,
	trimColour: process.env.TRIM_COLOUR
};
