//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

class CalendarOutcome extends Component {
	constructor(props) {
		super(props);

		//Create input reference
		this.inputElement = React.createRef();

		this.state = { enableCopyButton: true };
	}

	renderCopyDialog() {
		const { baseUrl, options, selectedTeamTypes, showAllTeamTypes, teamTypes } = this.props;
		const { enableCopyButton } = this.state;

		//Create basic queryOptions object
		const queryOptions = { ...options };

		//Conditionally add team types
		if (!showAllTeamTypes) {
			queryOptions.teamTypes = selectedTeamTypes.map(id => teamTypes[id].slug).join(",");
		}

		//Create query string
		const query = _.map(queryOptions, (val, key) => `${key}=${val.toString()}`).join("&");

		//Convert this to a full url
		const url = `${baseUrl}/calendar?${query}`;

		//Get Copy Button data
		let buttonProps = {};
		if (enableCopyButton) {
			buttonProps.children = "Copy";
			buttonProps.onClick = e => {
				//Select text
				const input = this.inputElement.current;
				input.select();
				input.setSelectionRange(0, 99999);

				//Copy
				document.execCommand("copy");

				//Focus on button so we don't pop up the keyboard on mobile
				e.target.focus();

				//Disable copy button for 1s
				this.setState({ enableCopyButton: false });
				setTimeout(() => this.setState({ enableCopyButton: true }), 1000);
			};
		} else {
			buttonProps.children = "Copied!";
			buttonProps.disabled = true;
		}

		return (
			<div className="copy-dialog">
				<p>
					<strong>Step 1: Copy your custom link</strong>
				</p>
				<input type="text" value={url} ref={this.inputElement} />
				<button type="button" className="confirm" {...buttonProps} />
			</div>
		);
	}

	renderExternalInstructions() {
		return (
			<div className="external-instructions">
				<p>
					<strong>Step 2: Add it to your calendar service</strong>
				</p>
				<p>
					Once you have copied your link, all you need to do is subscribe to it through
					your calendar service.
				</p>
				<p>
					For instructions on how to do this, check the relevant support pages for{" "}
					{this.renderExternalLink(
						"https://support.google.com/calendar/answer/37100",
						"Google"
					)}
					,{" "}
					{this.renderExternalLink(
						"https://support.office.com/en-gb/article/503ffaf6-7b86-44fe-8dd6-8099d95f38df?ui=en-US&rs=en-GB&ad=GB",
						"Microsoft Outlook"
					)}{" "}
					and{" "}
					{this.renderExternalLink(
						"https://www.macrumors.com/how-to/subscribe-to-calendars-on-iphone-ipad/",
						"Apple"
					)}
				</p>
			</div>
		);
	}

	renderExternalLink(href, text) {
		return (
			<a href={href} target="_blank" rel="noopener noreferrer">
				{text}
			</a>
		);
	}

	renderBackButton() {
		return (
			<div className="buttons">
				<button type="button" onClick={() => this.props.onBack()}>
					Back
				</button>
			</div>
		);
	}

	render() {
		return (
			<div>
				{this.renderCopyDialog()}
				<hr />
				{this.renderExternalInstructions()}
				<hr />
				{this.renderBackButton()}
			</div>
		);
	}
}

CalendarOutcome.propTypes = {
	options: PropTypes.object,
	selectedTeamTypes: PropTypes.arrayOf(PropTypes.string),
	showAllTeamTypes: PropTypes.bool,
	onBack: PropTypes.func.isRequired
};

function mapStateToProps({ config, games, teams }) {
	const { baseUrl, localTeam } = config;
	const { fullGames } = games;
	const { teamList, teamTypes } = teams;
	return { baseUrl, localTeam, fullGames, teamList, teamTypes };
}

export default connect(mapStateToProps)(CalendarOutcome);
