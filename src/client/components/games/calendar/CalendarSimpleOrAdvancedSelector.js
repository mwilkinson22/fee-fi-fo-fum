//Modules
import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";

function CalendarSimpleOrAdvancedSelector({ localTeam, fullTeams, onNext }) {
	return (
		<div>
			<p>
				<p className="full-span">
					Use the form below to generate a custom link you can add to your personal calendar, keeping you
					permanently up to date with all upcoming {fullTeams[localTeam].nickname} fixtures.
				</p>
			</p>
			<div className="basic-or-custom-wrapper">
				<div onClick={() => onNext(false)}>
					<h6>Simple</h6>
					<p>Use recommended settings</p>
				</div>
				<div onClick={() => onNext(true)}>
					<h6>Advanced</h6>
					<p>Customise team types and formatting options</p>
				</div>
			</div>
		</div>
	);
}

CalendarSimpleOrAdvancedSelector.propTypes = {
	onNext: PropTypes.func.isRequired
};

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { fullTeams } = teams;
	return { localTeam, fullTeams };
}

export default connect(mapStateToProps)(CalendarSimpleOrAdvancedSelector);
