import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import AdminStandardForm from "../standardForm/AdminStandardForm";
import { fetchAllTeams, fetchAllTeamTypes } from "../../../actions/teamsActions";
import { fetchAllCompetitionSegments } from "../../../actions/competitionActions";
import * as Yup from "yup";
import { localTeam } from "../../../../config/keys";
import fieldGroups from "./overviewFields";
import "datejs";
import LoadingPage from "../../LoadingPage";

class Form extends Component {
	constructor(props) {
		super(props);
		const {
			teamTypes,
			teamList,
			competitionSegmentList,
			fetchAllTeamTypes,
			fetchAllTeams,
			fetchAllCompetitionSegments
		} = props;
		if (!teamTypes) {
			fetchAllTeamTypes();
		}
		if (!teamList) {
			fetchAllTeams();
		}
		if (!competitionSegmentList) {
			fetchAllCompetitionSegments();
		}
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { game, teamTypes, teamList, fieldGroups, competitionSegmentList } = nextProps;
		return {
			game,
			teamTypes,
			teamList,
			fieldGroups: _.cloneDeep(fieldGroups),
			competitionSegmentList
		};
	}

	addReduxOptions() {
		const { teamTypes, teamList, competitionSegmentList, fieldGroups } = this.state;
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
					field.options = _.chain(competitionSegmentList)
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

	addValues() {
		const { game, fieldGroups } = this.state;
		_.each(fieldGroups, fields => {
			_.each(fields, field => {
				switch (field.name) {
					case "venue":
						field.defaultValue = game.isAway ? "away" : "home";
						break;
					case "date":
						field.defaultValue = new Date(game.date).toString("yyyy-MM-dd");
						break;
					case "time":
						field.defaultValue = new Date(game.date).toString("HH:mm:ss");
						break;
					case "opposition":
						field.defaultValue = _.filter(
							field.options,
							option => option.value === game._opposition._id
						);
						break;
					case "team_type":
						field.defaultValue = _.filter(
							field.options,
							option => option.value === game._teamType
						);
						break;
					default:
						field.defaultValue = game[field.name];
				}
			});
		});
	}

	render() {
		const { game, teamTypes, teamList, fieldGroups, competitionSegmentList } = this.state;
		if (!teamTypes || !teamList || !competitionSegmentList) {
			return <LoadingPage />;
		}

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

		this.addValues();

		return (
			<div className="container">
				<AdminStandardForm fieldGroups={fieldGroups} onSubmit={v => console.log(v)} />
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ games, teams, competitions }, ownProps) {
	const { slug } = ownProps.match.params;
	const game = games.fullGames[slug];
	const { teamTypes, teamList } = teams;
	const { competitionSegmentList } = competitions;
	return { fieldGroups, game, teamTypes, teamList, competitionSegmentList, ...ownProps };
}
// export default form;
export default connect(
	mapStateToProps,
	{ fetchAllTeamTypes, fetchAllTeams, fetchAllCompetitionSegments }
)(Form);
