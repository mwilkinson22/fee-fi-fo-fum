//Modules
import _ from "lodash";
import React from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { arrayToList } from "~/helpers/genericHelper";

function CalendarSimpleOrAdvancedSelector({ localTeam, fullTeams, onNext, teamTypes }) {
	console.log(teamTypes);
	return (
		<div>
			<p>
				<p className="full-span">
					Use the form below to generate a custom link you can add to your personal calendar, keeping you
					permanently up to date with all upcoming {fullTeams[localTeam].nickname} fixtures.
				</p>
			</p>
			<div className="basic-or-custom-wrapper">
				<div onClick={() => onNext(false, false)}>
					<h6>Simple (All Teams)</h6>
					<p>
						Use recommended settings for all Giants fixtures (
						{arrayToList(_.sortBy(teamTypes, "sortOrder").map(t => t.name))}).
					</p>
				</div>
				<div onClick={() => onNext(false, true)}>
					<h6>Simple (First Team Only)</h6>
					<p>Use recommended settings for First Team fixtures only.</p>
				</div>
				<div onClick={() => onNext(true, false)}>
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
	const { fullTeams, teamTypes } = teams;
	return { localTeam, fullTeams, teamTypes };
}

export default connect(mapStateToProps)(CalendarSimpleOrAdvancedSelector);
