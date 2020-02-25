import { GET_CORE_CONFIG, GET_SETTINGS } from "./types";
import { localTeam, gaTracking, mongoURI, googleBucketName, ticketLink } from "../../config/keys";
import { toast } from "react-toastify";

export const getCoreConfig = req => async dispatch => {
	const { headers, ipAddress, useragent, protocol, originalUrl } = req;

	const { browser } = useragent;
	const config = {
		//Set Browser
		browser,

		//Set IP Address
		ipAddress,

		//Set webp compatibility
		webp: headers.accept && headers.accept.indexOf("image/webp") > -1,

		//Set rgba compatiblility
		rgba: ["Edge", "IE"].indexOf(browser) === -1,

		//Local Team
		localTeam,

		//Base URL
		baseUrl: protocol + "://" + req.get("host"),

		//Initial Path
		initialPath: originalUrl,

		//Set Analytics Key
		gaTracking,

		//Prod or Dev
		environment: process.env.NODE_ENV,

		//Live or test database
		database: mongoURI.includes("test") ? "test" : "live",

		//Ticket Link
		ticketLink
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
