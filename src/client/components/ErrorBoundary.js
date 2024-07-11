//Modules
import _ from "lodash";
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import { Notifier } from "@airbrake/browser";

//Components
import ErrorPrintout from "./ErrorPrintout";

//Actions
import { sendError } from "~/client/actions/errorActions";

//Initial State, when all is ok
const initialState = { message: null, componentStack: null, page: null };

class ErrorBoundary extends Component {
	constructor(props) {
		super(props);

		this.state = initialState;

		const { airbrakeId, airbrakeKey } = props;

		if (airbrakeId && airbrakeKey) {
			this.airbrake = new Notifier({
				projectId: airbrakeId,
				projectKey: airbrakeKey
			});
		}
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
		const { authUser, browser, deviceType, sendError, sentErrors, parentProps, parentState, additionalData } = this.props;

		//Get the uri where the error occurred
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
		// if (!sentErrors.find(path => path == page)) {
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
		// }

		//Send error to airbrake
		if (this.airbrake) {
			this.airbrake.notify({
				error,
				params: { info, parentProps, parentState, additionalData }
			});
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
	const { authUser, airbrakeId, airbrakeKey, browser, deviceType } = config;
	const { sentErrors } = errors;

	return { authUser, airbrakeId, airbrakeKey, browser, deviceType, sentErrors };
}

ErrorBoundary.propTypes = {
	additionalData: PropTypes.object,
	parentProps: PropTypes.object,
	parentState: PropTypes.object
};

export default withRouter(connect(mapStateToProps, { sendError })(ErrorBoundary));
