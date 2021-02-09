import { GET_CORE_CONFIG, GET_SETTINGS } from "./types";
import {
	facebookApp,
	localTeam,
	mainCompetitionSegment,
	gaTracking,
	mongoURI,
	googleBucketName,
	fansCanAttend,
	ticketLink,
	airbrakeId,
	airbrakeKey,
	googleMapsKey,
	sites,
	mainColour,
	trimColour,
	newsPostsPerPage,
	fetchPeopleLimit,
	fetchGameLimit
} from "../../config/keys";
import { toast } from "react-toastify";

export const getCoreConfig = req => async dispatch => {
	const { headers, ipAddress, useragent, originalUrl } = req;
	let { protocol } = req;

	//Check Heroku proxy for https
	if (req.get("x-forwarded-proto") === "https") {
		protocol = "https";
	}

	const { browser } = useragent;
	const config = {
		//Set Browser
		browser,

		//Set IP Address
		ipAddress,

		//Set webp compatibility
		webp: headers.accept && headers.accept.indexOf("image/webp") > -1,

		//Set rgba compatibility
		rgba: ["Edge", "IE"].indexOf(browser) === -1,

		//Local Team
		localTeam,

		//Base URL
		baseUrl: protocol + "://" + req.get("host"),

		//Initial Path
		initialPath: originalUrl,

		//Set Analytics Key
		gaTracking,

		//Google Maps API Key
		googleMapsKey,

		//Prod or Dev
		environment: process.env.NODE_ENV,

		//Live or test database
		database: mongoURI.includes("test") ? "test" : "live",

		//Ticket Link
		ticketLink,

		//Facebook App ID
		facebookApp,

		//Set Airbrake Info
		airbrakeId,
		airbrakeKey,

		//Fans Can Attend Games?
		fansCanAttend,

		//Sites
		sites,

		//Colours
		mainColour,
		trimColour,

		//Main Competition
		mainCompetitionSegment,

		//News posts per page
		newsPostsPerPage,

		//Bulk Fetch Limit
		fetchPeopleLimit,
		fetchGameLimit
	};

	//Add Bucket Paths
	config.bucketPaths = { root: `https://storage.googleapis.com/${googleBucketName}/` };

	//Get Local URL
	if (typeof window !== "undefined") {
		config.bucketPaths.localUrl = window.location.protocol + "//" + window.location.host;
	} else {
		config.bucketPaths.localUrl = "";
	}

	//Get Image Path
	config.bucketPaths.imageRoot = `${config.bucketPaths.root}images/`;

	//Get Image Subconfig.bucketPaths
	const imageSubPaths = {
		competitions: "competitions",
		games: "games",
		grounds: "grounds",
		layout: "layout",
		newsHeader: "news/headers",
		people: "people",
		sponsors: "sponsors",
		teams: "teams",
		users: "users"
	};
	config.bucketPaths.images = {};

	for (const pathName in imageSubPaths) {
		config.bucketPaths.images[
			pathName
		] = `${config.bucketPaths.imageRoot}${imageSubPaths[pathName]}/`;
	}

	//Check for device
	if (useragent.isiPad || useragent.isiPhone) {
		config.deviceType = "ios";
	} else if (useragent.isAndroid) {
		config.deviceType = "android";
	} else {
		config.deviceType = "desktop";
	}

	//Get Site Branding
	await dispatch(
		getSettings([
			"site_name",
			"site_social",
			"site_logo",
			"site_header_logo",
			"site_default_description"
		])
	);

	dispatch({ type: GET_CORE_CONFIG, payload: config });
};

export const getSettings = names => async (dispatch, getState, api) => {
	const res = await api.get(`/settings/${names.join(",")}`);
	dispatch({ type: GET_SETTINGS, payload: res.data });
};

export const setSettings = data => async (dispatch, getState, api) => {
	await api.post("/settings/", data);
	dispatch({ type: GET_SETTINGS, payload: data });
	toast.success("Settings Updated");
};
