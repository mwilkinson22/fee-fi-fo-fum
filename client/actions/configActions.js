import { GET_CORE_CONFIG, SET_SOCIAL_MEDIA_IMAGE } from "./types";
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
		gaTracking
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

export const setSocialMediaCard = img => async dispatch => {
	dispatch({ type: SET_SOCIAL_MEDIA_IMAGE, payload: img });
};
