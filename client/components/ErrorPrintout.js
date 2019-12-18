//Modules
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

class ErrorPrintout extends Component {
	constructor(props) {
		super(props);

		this.state = { errorTapCount: 0 };
	}

	renderMessage() {
		const { componentStack, environment } = this.props;
		const { errorTapCount } = this.state;
		if (environment === "development" || errorTapCount >= 5) {
			return <pre>{componentStack}</pre>;
		}
	}

	render() {
		const { error } = this.props;
		const { errorTapCount } = this.state;

		return (
			<div className="error-boundary">
				<h2 onClick={() => this.setState({ errorTapCount: errorTapCount + 1 })}>Error</h2>
				<div className="message">
					{error.message} ({error.fileName}:{error.lineNumber})
				</div>
				{this.renderMessage()}
			</div>
		);
	}
}

ErrorPrintout.propTypes = {
	error: PropTypes.object.isRequired,
	componentStack: PropTypes.string.isRequired
};

function mapStateToProps({ config }) {
	const { environment } = config;
	return { environment };
}

export default connect(mapStateToProps)(ErrorPrintout);
