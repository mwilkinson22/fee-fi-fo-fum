export const uploadFile = data => async (dispatch, getState, api) => {
	const res = await api.post("/file", data);
	return res.data;
};

export const getFiles = (path, includeSubfolders, exclude) => async (dispatch, getState, api) => {
	let url = `/files/${encodeURIComponent(path)}`;
	const query = [];

	if (includeSubfolders) {
		query.push("subfolders=1");
	}

	if (exclude) {
		query.push(`exclude=${exclude.join(",")}`);
	}

	if (exclude.length) {
		url += `?${exclude.join("&")}`;
	}

	const res = await api.get(url);
	return res.data;
};
