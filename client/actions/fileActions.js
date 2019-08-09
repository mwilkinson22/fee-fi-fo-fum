export const uploadFile = data => async (dispatch, getState, api) => {
	const res = await api.post("/file", data);
	return res.data;
};

export const getFiles = path => async (dispatch, getState, api) => {
	console.log(path);
	const res = await api.get(`/files/${encodeURIComponent(path)}`);
	return res.data;
};
