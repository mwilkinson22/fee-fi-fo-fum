//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../../components/LoadingPage";

//Actions
import { fetchTeam } from "~/client/actions/teamsActions";

class AdminDashboard extends Component {
	constructor(props) {
		super(props);

		const { fullTeams, localTeam, fetchTeam } = props;

		//Ensure we have the full team
		if (!fullTeams[localTeam].fullData) {
			fetchTeam(localTeam, "full");
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullTeams, localTeam, teamTypes } = nextProps;

		const newState = { isLoading: false };

		//Await dependencies
		if (!fullTeams[localTeam].fullData) {
			newState.isLoading = true;
			return newState;
		}

		//Define local team
		newState.team = fullTeams[localTeam];

		//Define "First Team" team type
		newState.firstTeam = _.sortBy(teamTypes, "sortOrder")[0];

		return newState;
	}

	//Ensure we're not missing key data for the current local squad
	checkLocalSquad() {
		const { team, firstTeam } = this.state;

		//Get all "required" values
		const requiredPlayerValues = {
			images: "Main Image",
			dateOfBirth: "Date of Birth",
			contractedUntil: "Contracted Until",
			playingPositions: "Playing Positions",
			_hometown: "Hometown"
		};

		//Get most recent squad
		const thisYear = Number(new Date().getFullYear());
		const currentFirstTeamSquads = team.squads.filter(
			({ _teamType, year }) => _teamType == firstTeam._id && year >= thisYear
		);

		if (currentFirstTeamSquads.length) {
			//Get all players
			const playersWithIssues = _.chain(currentFirstTeamSquads)
				//Get Player Objects
				.map(s => s.players.map(({ _player }) => _player))
				.flatten()
				.uniqBy("_id")
				//Order
				.sortBy(({ name }) => name.full)
				//Check required values
				.map(player => {
					const issues = _.map(requiredPlayerValues, (label, key) => {
						let isValid;
						switch (key) {
							case "images": {
								isValid = player.images.main;
								break;
							}
							case "playingPositions": {
								isValid = player.playingPositions.length;
								break;
							}
							default: {
								isValid = player[key];
								break;
							}
						}

						//If an issue is found, we return the label to an array
						if (!isValid) {
							return label;
						}
					}).filter(_.identity);

					//If a player has outstanding issues, return an object
					if (issues.length) {
						return { player, issues };
					}
				})
				.filter(_.identity)
				.value();

			if (playersWithIssues.length) {
				const list = playersWithIssues.map(({ player, issues }) => (
					<li key={player._id}>
						<Link to={`/admin/people/${player._id}`}>{player.name.full}</Link>
						<p>{issues.join(", ")}</p>
					</li>
				));
				return {
					actionRequired: true,
					component: (
						<div className="form-card">
							<h6>Current {team.name.short} Squad</h6>
							<p>The following players are missing important information:</p>
							<ul>{list}</ul>
						</div>
					)
				};
			}
		}

		return {
			actionRequired: false,
			component: (
				<div className="form-card">
					<h6>Current Squad</h6>
					<p>All current squad members are up to date</p>
				</div>
			)
		};
	}

	render() {
		const { isLoading } = this.state;

		//Await dependencies
		if (isLoading) {
			return <LoadingPage />;
		}

		//Get list of cards
		const cards = [this.checkLocalSquad()];

		//Create actionRequired group
		let actionRequiredContent = cards
			.filter(c => c.actionRequired)
			.map((c, key) => ({ ...c.component, key }));
		if (!actionRequiredContent.length) {
			actionRequiredContent = (
				<div className="form-card">No actions are currently required</div>
			);
		}

		//Create noActionRequired group
		let noActionRequiredSection;
		const noActionRequiredContent = cards
			.filter(c => !c.actionRequired)
			.map((c, key) => ({ ...c.component, key }));
		if (noActionRequiredContent.length) {
			noActionRequiredSection = (
				<div className="card-wrapper">
					<h2>No Action Required</h2>
					{noActionRequiredContent}
				</div>
			);
		}

		return (
			<section className="admin-dashboard-page">
				<div className="container">
					<div className="card-wrapper">
						<h2>Action Required</h2>
						{actionRequiredContent}
					</div>
					{noActionRequiredSection}
				</div>
			</section>
		);
	}
}

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { fullTeams, teamTypes } = teams;
	return { fullTeams, localTeam, teamTypes };
}

export default connect(mapStateToProps, { fetchTeam })(AdminDashboard);
