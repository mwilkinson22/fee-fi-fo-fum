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

//Stylesheets
import "./scss/styles.scss";

polyfill(); //IE Support

const axiosInstance = axios.create({
	baseURL: "/api"
});
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
