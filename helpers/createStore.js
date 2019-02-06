import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import axios from "axios";
import reducers from "../client/reducers/combinedReducer";

export default req => {
	const axiosInstance = axios.create({
		baseURL: "http://localhost:3000/api",
		headers: { cookie: req.get("cookie") || "" }
	});
	const store = createStore(
		reducers,
		{},
		applyMiddleware(thunk.withExtraArgument(axiosInstance))
	);
	return store;
};
