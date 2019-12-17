//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";

//Actions
import { sendError } from "~/client/actions/errorActions";

//Inital State, when all is ok
const initialState = { error: null, componentStack: null, errorPage: null, errorTapCount: 0 };

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

	renderMessage() {
		const { environment } = this.props;
		const { errorTapCount, componentStack } = this.state;
		if (environment === "development" || errorTapCount >= 5) {
			return <pre>{componentStack}</pre>;
		}
	}

	render() {
		const { error, errorTapCount } = this.state;
		if (error) {
			return (
				<div className="container">
					<div className="error-boundary">
						<h2 onClick={() => this.setState({ errorTapCount: errorTapCount + 1 })}>
							Error
						</h2>
						<div className="message">
							{error.message} ({error.fileName}:{error.lineNumber})
						</div>
						{this.renderMessage()}
					</div>
				</div>
			);
		}
		return this.props.children;
	}
}

function mapStateToProps({ config, errors }) {
	const { authUser, browser, deviceType, environment } = config;
	const { sentErrors } = errors;

	return { authUser, browser, deviceType, environment, sentErrors };
}

export default withRouter(
	connect(
		mapStateToProps,
		{ sendError }
	)(ErrorBoundary)
);
