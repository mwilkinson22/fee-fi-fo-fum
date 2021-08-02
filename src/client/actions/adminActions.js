export const fetchAdminDashboardData = entireYear => async (dispatch, getState, api) => {
	const res = await api.get(`/admin/dashboard${entireYear ? "?entireYear=true" : ""}`);
	return res.data;
};
