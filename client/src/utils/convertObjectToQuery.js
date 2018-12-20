import _ from "lodash";

export default (obj, stripNull = true) => {
	const arr = _.map(obj, (value, key) => {
		return `${key}=${value}`;
	});
	return "?" + arr.join("&");
};
