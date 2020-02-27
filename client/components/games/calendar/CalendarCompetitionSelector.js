//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";

//Components
import BooleanField from "../../admin/fields/Boolean";
import LoadingPage from "../../LoadingPage";

//Actions
import { fetchCompetitionSegments } from "~/client/actions/competitionActions";

class CalendarCompetitionSelector extends Component {
	constructor(props) {
		super(props);

		const {
			activeTeamType,
			competitionSegmentList,
			fetchCompetitionSegments,
			gameList,
			initialCompetitions
		} = props;

		//Ensure we load all competitions
		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}

		//Create an object of the competitions
		const competitions = _.chain(gameList)
			.filter(g => g.date > new Date())
			.uniqBy("_competition")
			.map(g => {
				let selectedByDefault;
				if (initialCompetitions) {
					//If initialCompetitions is passed in, check to see
					//if this competition has been added in
					selectedByDefault = Boolean(
						initialCompetitions.find(id => id == g._competition)
					);
				} else {
					//Otherwise, we just select everything for the active team type
					selectedByDefault = activeTeamType == g._teamType;
				}

				return [g._competition, selectedByDefault];
			})
			.fromPairs()
			.value();

		//Set State
		this.state = { competitions };
	}

	static getDerivedStateFromProps(nextProps) {
		const { competitionSegmentList } = nextProps;
		const newState = { isLoading: false };

		if (!competitionSegmentList) {
			newState.isLoading = true;
			return newState;
		}

		return newState;
	}

	handleNext() {
		const { onNext } = this.props;
		const { competitions } = this.state;

		//Filter out selected competitions
		const selectedCompetitions = _.chain(competitions)
			.map((val, id) => (val ? id : null))
			.filter(_.identity)
			.value();

		//Return to parent component state
		onNext(selectedCompetitions);
	}

	renderList() {
		const { competitionSegmentList, teamTypes } = this.props;
		const { competitions } = this.state;
		return (
			_.chain(competitions)
				//Map to competition object
				.map((val, id) => competitionSegmentList[id])
				//Group By Team Type
				.groupBy("_teamType")
				//Convert to collection
				.map((competitionSegments, _teamType) => ({
					competitionSegments,
					teamType: teamTypes[_teamType]
				}))
				//Order groups by team type
				.sortBy(({ teamType }) => teamType.sortOrder)
				//Render to JSX
				.map(({ teamType, competitionSegments }) => {
					//Create Header
					const teamTypeHeader = <h6 key={teamType._id}>{teamType.name}</h6>;

					//List Competitions
					const list = _.chain(competitionSegments)
						//Convert to a simple key/value pair
						.map(c => ({
							_id: c._id,
							title: c.basicTitle
						}))
						//Sort by title
						.sortBy("title")
						//Convert to li elements
						.map(c => {
							const changeEvent = () =>
								this.setState({
									competitions: {
										...competitions,
										[c._id]: !competitions[c._id]
									}
								});
							return (
								<li key={c._id} onClick={changeEvent}>
									<BooleanField
										name={c._id}
										value={competitions[c._id]}
										onChange={() => {}}
									/>
									<span>{c.title}</span>
								</li>
							);
						})
						.value();

					return [
						teamTypeHeader,
						<ul key="list" className="clickable">
							{list}
						</ul>
					];
				})
				.value()
		);
	}

	renderButtons() {
		const { competitions } = this.state;
		const disableButton = _.filter(competitions, _.identity).length === 0;
		return (
			<div className="buttons">
				<button type="button" disabled={disableButton} onClick={() => this.handleNext()}>
					Next
				</button>
			</div>
		);
	}

	render() {
		const { fullTeams, localTeam } = this.props;
		const { isLoading } = this.state;

		//Wait for competitions
		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<div>
				<p className="full-span">
					Use the form below to generate an ics file and add all upcoming{" "}
					{fullTeams[localTeam].nickname} fixtures to your personal calendar.
				</p>
				<p className="full-span mobile-only">
					Just open the file directly from your phone or tablet and it should import
					automatically!
				</p>
				<p className="full-span desktop-only">
					Opening the file from your phone or tablet should import it automatically. From
					a PC, it can easily be imported into most calendar services, such as&nbsp;
					<a
						href="https://calendar.google.com/calendar/r/settings/export"
						target="_blank"
						rel="noopener noreferrer"
					>
						Google
					</a>
					,&nbsp;
					<a
						href="https://support.office.com/en-gb/article/import-or-subscribe-to-a-calendar-in-outlook-on-the-web-503ffaf6-7b86-44fe-8dd6-8099d95f38df"
						target="_blank"
						rel="noopener noreferrer"
					>
						Outlook
					</a>
					&nbsp;and&nbsp;
					<a
						href="https://support.apple.com/en-gb/guide/calendar/icl1023/mac"
						target="_blank"
						rel="noopener noreferrer"
					>
						Apple
					</a>
				</p>
				<hr />
				<p>Please select at least one competition from the list below</p>
				{this.renderList()}
				{this.renderButtons()}
			</div>
		);
	}
}

CalendarCompetitionSelector.propTypes = {
	initialCompetitions: PropTypes.array,
	onNext: PropTypes.func.isRequired
};

function mapStateToProps({ config, competitions, games, teams }) {
	const { localTeam } = config;
	const { competitionSegmentList } = competitions;
	const { gameList } = games;
	const { activeTeamType, fullTeams, teamTypes } = teams;
	return { activeTeamType, competitionSegmentList, gameList, fullTeams, localTeam, teamTypes };
}

export default connect(mapStateToProps, { fetchCompetitionSegments })(CalendarCompetitionSelector);
