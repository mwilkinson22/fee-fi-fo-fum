export const fetchAdminDashboardData = () => async (dispatch, getState, api) => {
	const res = await api.get("/admin/dashboard");
	return res.data;
};
