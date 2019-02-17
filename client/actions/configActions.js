import { GET_CORE_CONFIG } from "./types";

export const getCoreConfig = req => async dispatch => {
	const config = {};

	//Check for device
	if (req.useragent.isiPad || req.useragent.isiPhone) {
		config.deviceType = "ios";
	} else if (req.useragent.isAndroid) {
		config.deviceType = "android";
	} else {
		config.deviceType = "desktop";
	}

	dispatch({ type: GET_CORE_CONFIG, payload: config });
};
