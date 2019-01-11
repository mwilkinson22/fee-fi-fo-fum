import { polyfill } from "es6-promise"; //IE Support
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import reduxThunk from "redux-thunk";

import App from "./components/App";
import reducers from "./reducers/combinedReducer";

import axios from "axios";
polyfill(); //IE Support
window.axios = axios;

export const reduxStore = createStore(reducers, {}, applyMiddleware(reduxThunk));

ReactDOM.render(
	<Provider store={reduxStore}>
		<App />
	</Provider>,
	document.querySelector("#root")
);
