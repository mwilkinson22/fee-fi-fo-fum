//Polyfills
import "@babel/polyfill";
import { polyfill } from "es6-promise"; //IE Support

//React
import React from "react";
import { hydrate } from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { renderRoutes } from "react-router-config";

//Redux
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import thunk from "redux-thunk";
import reducers from "./reducers/combinedReducer";

//Modules
import axios from "axios";
import { toast } from "react-toastify";

//Constants
import Routes from "./Routes";

//Stylesheets
import "./scss/styles.scss";

//IE Support
polyfill();

//Create an axios API reference
const axiosInstance = axios.create({
	baseURL: "/api"
});
//Assign it custom error handling
axiosInstance.interceptors.response.use(
	function (response) {
		return response;
	},
	function (error) {
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
				console.info(error.response.data.toLog);
				toast.error("See console log for more details");
			}
		} else {
			toast.error("503 - Service Unavailable");
		}
		return error;
	}
);

//Create a redux store
const store = createStore(reducers, window.INITIAL_STATE, applyMiddleware(thunk.withExtraArgument(axiosInstance)));

//Enable isomorphic JS
hydrate(
	<Provider store={store}>
		<BrowserRouter>
			<div>{renderRoutes(Routes)}</div>
		</BrowserRouter>
	</Provider>,
	document.querySelector("#root")
);
