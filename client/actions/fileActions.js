export const uploadFile = data => async (dispatch, getState, api) => {
	const res = await api.post("/file", data);
	return res.data;
};
