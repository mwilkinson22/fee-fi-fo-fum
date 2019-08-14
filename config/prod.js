module.exports = {
	mongoURI: process.env.MONGO_URI,
	cookieKey: process.env.COOKIE_KEY,
	localTeam: process.env.LOCAL_TEAM,
	earliestGiantsData: 2017,
	fixtureCrawlUrl: process.env.FIXTURE_CRAWL_URL,
	gc: {
		client_email: process.env.GC_EMAIL,
		private_key: process.env.GC_KEY
	},
	googleBucketName: process.env.GOOGLE_BUCKET,
	iftttKey: process.env.IFTTT_KEY,
	twitter: {
		consumer_key: process.env.TWITTER_CONSUMER_KEY,
		consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
		access_token: process.env.TWITTER_ACCESS_KEY,
		access_token_secret: process.env.TWITTER_ACCESS_SECRET
	}
};
