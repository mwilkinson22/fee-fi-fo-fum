import "babel-polyfill";
import { polyfill } from "es6-promise"; //IE Support
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { Provider } from "react-redux";
import Routes from "./Routes";
import { renderRoutes } from "react-router-config";
import reducers from "./reducers/combinedReducer";
import axios from "axios";
import { toast } from "react-toastify";

//Stylesheets
import "./scss/styles.scss";

polyfill(); //IE Support

const axiosInstance = axios.create({
	baseURL: "/api"
});
//Set Axios Error Handling
axiosInstance.interceptors.response.use(
	function(response) {
		return response;
	},
	function(error) {
		if (error.response) {
			const { status, statusText } = error.response;
			let errorMessage;
			if (typeof error.response.data === "string") {
				errorMessage = error.response.data;
			} else if (error.response.data.error) {
				errorMessage = error.response.data.error;
			}
			toast.error(`${status} ${statusText}${errorMessage ? ": " + errorMessage : ""}`);
			if (error.response.data.toLog) {
				console.log(error.response.data.toLog);
				toast.error("See console log for more details");
			}
		} else {
			toast.error("503 - Service Unavailable");
		}
		return error;
	}
);
const store = createStore(
	reducers,
	window.INITIAL_STATE,
	applyMiddleware(thunk.withExtraArgument(axiosInstance))
);

ReactDOM.hydrate(
	<Provider store={store}>
		<BrowserRouter>
			<div>{renderRoutes(Routes)}</div>
		</BrowserRouter>
	</Provider>,
	document.querySelector("#root")
);
