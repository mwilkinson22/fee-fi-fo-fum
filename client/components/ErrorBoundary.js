//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";

//Components
import ErrorPrintout from "./ErrorPrintout";

//Actions
import { sendError } from "~/client/actions/errorActions";

//Inital State, when all is ok
const initialState = { error: null, componentStack: null, errorPage: null };

class ErrorBoundary extends Component {
	constructor(props) {
		super(props);

		this.state = initialState;
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { errorPage } = prevState;

		//Clear the error if we've navigated
		if (errorPage && errorPage != nextProps.location.pathname) {
			return initialState;
		}

		return {};
	}

	componentDidCatch(error, info) {
		const { authUser, browser, deviceType, sendError, sentErrors } = this.props;

		//Get the uri where the error occured
		const errorPage = this.props.location.pathname;

		//Get the component stack
		const { componentStack } = info;

		//Update the state to render fallback component
		this.setState({ error, componentStack, errorPage });

		//Save the error to the database
		if (!sentErrors.find(path => path == errorPage)) {
			const errorObject = {
				page: errorPage,
				message: error.message,
				componentStack,
				browser,
				deviceType
			};

			//Log user
			if (authUser) {
				errorObject._user = authUser._id;
			}

			//Send to server
			sendError(errorObject);
		}
	}
	render() {
		const { componentStack, error } = this.state;
		if (error) {
			return (
				<div className="container">
					<ErrorPrintout componentStack={componentStack} error={error} />
				</div>
			);
		}
		return this.props.children;
	}
}

function mapStateToProps({ config, errors }) {
	const { authUser, browser, deviceType } = config;
	const { sentErrors } = errors;

	return { authUser, browser, deviceType, sentErrors };
}

export default withRouter(
	connect(
		mapStateToProps,
		{ sendError }
	)(ErrorBoundary)
);
