import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import AdminStandardForm from "../standardForm/AdminStandardForm";
import { fetchAllTeamTypes, fetchAllTeams } from "../../../actions/teamsActions";
import { fetchAllCompetitions } from "../../../actions/competitionActions";
import * as Yup from "yup";
import { localTeam } from "../../../../config/keys";

//Fields
export const fieldGroups = {
	Basics: [
		{ name: "date", type: "date", label: "Date", validation: Yup.date().required() },
		{ name: "time", type: "time", label: "Time", validation: Yup.string().required() },
		{
			name: "team_type",
			type: "select",
			label: "Team Type",
			validation: Yup.string().required()
		},
		{
			name: "competition",
			type: "select",
			label: "Competition",
			validation: Yup.string().required()
		},
		{
			name: "opposition",
			type: "select",
			label: "Opposition",
			validation: Yup.string().required()
		},
		{ name: "round", type: "number", label: "Round", validation: Yup.number().min(1) }
	],
	Venue: [
		{
			name: "venue",
			type: "radio",
			label: "Venue",
			options: [
				{ value: "home", label: "Home" },
				{ value: "away", label: "Away" },
				{ value: "neutral", label: "Neutral" }
			],
			validation: Yup.string().required()
		}
	]
};

class Form extends Component {
	constructor(props) {
		super(props);
		const {
			teamTypes,
			teamList,
			competitionList,
			fetchAllTeamTypes,
			fetchAllTeams,
			fetchAllCompetitions
		} = props;
		if (!teamTypes) {
			fetchAllTeamTypes();
		}
		if (!teamList) {
			fetchAllTeams();
		}
		if (!competitionList) {
			fetchAllCompetitions();
		}
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { game, teamTypes, teamList, fieldGroups, competitionList } = nextProps;
		return {
			game,
			teamTypes,
			teamList,
			fieldGroups: _.cloneDeep(fieldGroups),
			competitionList
		};
	}

	addReduxOptions() {
		const { teamTypes, teamList, competitionList, fieldGroups } = this.state;
		_.each(fieldGroups, fields => {
			_.each(fields, field => {
				if (field.name === "team_type") {
					field.options = _.map(teamTypes, teamType => ({
						label: teamType.name,
						value: teamType._id
					}));
				}
				if (field.name === "opposition") {
					field.options = _.chain(teamList)
						.filter(team => team._id !== localTeam)
						.map(team => ({
							label: team.name.long,
							value: team._id
						}))
						.orderBy("label")
						.value();
				}
				if (field.name === "competition") {
					field.options = _.chain(competitionList)
						.map(competition => ({
							label: competition.name,
							value: competition._id
						}))
						.orderBy("label")
						.value();
				}
			});
		});
	}

	render() {
		const { game, fieldGroups } = this.state;
		if (game.status > 0) {
			_.each(fieldGroups.Basics, field => {
				//Disable core attributes for games with team data
				if (["team_type", "competition", "opposition"].indexOf(field.name) > -1) {
					field.disabled = true;
				}

				//Prevent year change
				if (field.name === "date") {
					const year = new Date(game.date).getFullYear();
					const message = `Cannot change year from ${year}`;
					field.validation = Yup.date()
						.min(`${year}-01-01`, message)
						.max(`${year}-12-31`, message)
						.required();
				}
			});
		}

		this.addReduxOptions();

		return <AdminStandardForm fieldGroups={fieldGroups} onSubmit={v => console.log(v)} />;
	}
}

//Add Redux Support
function mapStateToProps({ games, teams, competitions }, ownProps) {
	const { slug } = ownProps.match.params;
	const game = games.fullGames[slug];
	const { teamTypes, teamList } = teams;
	const { competitionList } = competitions;
	return { fieldGroups, game, teamTypes, teamList, competitionList, ...ownProps };
}
// export default form;
export default connect(
	mapStateToProps,
	{ fetchAllTeamTypes, fetchAllTeams, fetchAllCompetitions }
)(Form);
