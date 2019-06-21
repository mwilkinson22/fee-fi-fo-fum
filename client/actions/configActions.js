import { GET_CORE_CONFIG } from "./types";
import { localTeam } from "../../config/keys";
import { detect } from "detect-browser";
const browser = detect();

export const getCoreConfig = req => async dispatch => {
	const { headers, useragent, protocol, originalUrl } = req;

	const config = {
		//Set Browser
		browser,

		//Set webp compatibility
		webp: headers.accept && headers.accept.indexOf("image/webp") > -1,

		//Set rgba compatiblility
		rgba: browser && ["edge", "ie"].indexOf(browser.name) === -1,

		//Local Team
		localTeam,

		//Base URL
		baseUrl: protocol + "://" + req.get("host"),

		//Initial Path
		initialPath: originalUrl
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
