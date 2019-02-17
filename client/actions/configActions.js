import { GET_CORE_CONFIG } from "./types";

export const getCoreConfig = ({ headers, useragent }) => async dispatch => {
	const config = {};

	config.webp = headers.accept.indexOf("image/webp") > -1;

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
