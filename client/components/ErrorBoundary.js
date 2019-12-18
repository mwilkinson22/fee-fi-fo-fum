//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";

//Components
import ErrorPrintout from "./ErrorPrintout";

//Actions
import { sendError } from "~/client/actions/errorActions";

//Inital State, when all is ok
const initialState = { message: null, componentStack: null, page: null };

class ErrorBoundary extends Component {
	constructor(props) {
		super(props);

		this.state = initialState;
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { page } = prevState;

		//Clear the error if we've navigated
		if (page && page != nextProps.location.pathname) {
			return initialState;
		}

		return {};
	}

	componentDidCatch(error, info) {
		const { authUser, browser, deviceType, sendError, sentErrors } = this.props;

		//Get the uri where the error occured
		const page = this.props.location.pathname;

		//Get the message
		const { message } = error;

		//Get the component stack
		const { componentStack } = info;

		//Get the file
		const file = `${error.fileName}:${error.lineNumber}`;

		//Update the state to render fallback component
		this.setState({ message, componentStack, page, file });

		//Save the error to the database
		if (!sentErrors.find(path => path == page)) {
			const errorObject = {
				page,
				message,
				file,
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
		if (this.state.message) {
			const errorData = _.pick(this.state, ["componentStack", "date", "message", "file"]);
			return (
				<div className="container">
					<ErrorPrintout {...errorData} />
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
