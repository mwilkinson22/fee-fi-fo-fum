import { GET_CORE_CONFIG } from "./types";
import { localTeam, gaTracking } from "../../config/keys";

export const getCoreConfig = req => async dispatch => {
	const { headers, useragent, protocol, originalUrl } = req;

	const { browser } = useragent;
	const config = {
		//Set Browser
		browser,

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
		environment: process.env.NODE_ENV
	};

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
