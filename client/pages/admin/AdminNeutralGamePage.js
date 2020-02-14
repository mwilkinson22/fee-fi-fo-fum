//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link, withRouter } from "react-router-dom";
import * as Yup from "yup";

//Components
import BasicForm from "../../components/admin/BasicForm";
import LoadingPage from "../../components/LoadingPage";
import HelmetBuilder from "../../components/HelmetBuilder";
import NotFoundPage from "~/client/pages/NotFoundPage";

//Actions
import {
	fetchNeutralGamesFromId,
	updateNeutralGames,
	createNeutralGames,
	deleteNeutralGame
} from "../../actions/neutralGamesActions";
import { fetchCompetitionSegments } from "~/client/actions/competitionActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { getNeutralGame, getDynamicOptions } from "~/helpers/gameHelper";

class AdminNeutralGamePage extends Component {
	constructor(props) {
		super(props);
		const {
			competitionSegmentList,
			fetchCompetitionSegments,
			neutralGames,
			fetchNeutralGamesFromId,
			match
		} = props;

		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}

		//If we click through to this page from NeutralGameList
		//then we know it is already loaded into redux. If we access
		//the url directly, it won't be. In that case, provided
		//we're editing a game (instead of creating one), we run
		//fetchNeutralGamesFromId, which takes the given ID and returns
		//all games from that year. It's a rare case but makes things easier
		//with the nG reducer
		if (match.params._id && !neutralGames) {
			fetchNeutralGamesFromId(match.params._id);
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { competitionSegmentList, neutralGames, match, teamTypes } = nextProps;
		const newState = { isLoading: false };

		//Check for New Game
		newState.isNew = !match.params._id;

		//Check everything is loaded
		if (!competitionSegmentList || (!newState.isNew && !neutralGames)) {
			newState.isLoading = true;
			return newState;
		}

		if (!newState.isNew) {
			newState.game = getNeutralGame(match.params._id, neutralGames);

			if (newState.game === false) {
				return newState;
			}
		}

		//Determine validation for date
		let dateValidation;
		if (newState.isNew) {
			dateValidation = Yup.date()
				.required()
				.label("Date");
		} else {
			const year = new Date(newState.game.date).getFullYear();
			dateValidation = Yup.date()
				.required()
				.label("Date")
				.min(`${year}-01-01`)
				.max(`${year}-12-31`);
		}

		//Set validation schema
		newState.validationSchema = Yup.object().shape({
			externalSync: Yup.boolean().label("External Sync"),
			externalId: Yup.number()
				.test("externalSync", "An ID is required for External Sync", function(externalId) {
					const { externalSync } = this.parent;
					return !externalSync || externalId;
				})
				.label("External Id"),
			time: Yup.string()
				.required()
				.label("Time"),
			_teamType: Yup.string()
				.required()
				.label("Team Type"),
			_competition: Yup.string()
				.required()
				.label("Competition"),
			_homeTeam: Yup.mixed()
				.required()
				.label("Home Team"),
			_awayTeam: Yup.mixed()
				.test("isUnique", "Home Team and Away Team cannot match", function(_awayTeam) {
					const { _homeTeam } = this.parent;
					return _homeTeam != _awayTeam;
				})
				.required()
				.label("Away Team"),
			homePoints: Yup.number()
				.min(0)
				.label("Home Points"),
			awayPoints: Yup.number()
				.min(0)
				.label("Away Points"),
			date: dateValidation
		});

		//Get Team Type Drop Down
		newState.teamTypes = _.chain(teamTypes)
			.sortBy("sortOrder")
			.map(t => ({ label: t.name, value: t._id }))
			.value();

		return newState;
	}

	getInitialValues() {
		const { game, isNew } = this.state;
		const defaultValues = {
			externalSync: false,
			externalId: "",
			date: "",
			time: "",
			_teamType: "",
			_competition: "",
			_homeTeam: "",
			_awayTeam: "",
			homePoints: "",
			awayPoints: ""
		};

		if (isNew) {
			return defaultValues;
		} else {
			return _.mapValues(defaultValues, (defaultValue, key) => {
				let value;
				switch (key) {
					case "date":
						value = game.date.toString("yyyy-MM-dd");
						break;
					case "time":
						value = game.date.toString("HH:mm");
						break;
					default:
						value = game[key];
						break;
				}

				return value != null ? value : defaultValue;
			});
		}
	}

	getFieldGroups(values) {
		const { isNew, teamTypes } = this.state;

		const options = getDynamicOptions(values, true, this.props);

		return [
			{
				fields: [
					{ name: "externalSync", type: fieldTypes.boolean },
					{ name: "externalId", type: fieldTypes.number },
					{ name: "date", type: fieldTypes.date },
					{ name: "time", type: fieldTypes.time },
					{
						name: "_teamType",
						type: fieldTypes.select,
						isDisabled: !isNew,
						options: teamTypes
					},
					{
						name: "_competition",
						type: fieldTypes.select,
						isDisabled: !isNew || !values.date || !values._teamType,
						options: options._competition,
						placeholder: options.placeholders._competition
					},
					{
						name: "_homeTeam",
						type: fieldTypes.select,
						options: options.teams,
						placeholder: options.placeholders._team,
						isDisabled: !values._competition
					},
					{
						name: "_awayTeam",
						type: fieldTypes.select,
						options: options.teams,
						placeholder: options.placeholders._team,
						isDisabled: !values._competition
					},
					{ name: "homePoints", type: fieldTypes.number },
					{ name: "awayPoints", type: fieldTypes.number }
				]
			}
		];
	}

	alterValuesBeforeSubmit(values) {
		values.date = `${values.date} ${values.time}`;
		delete values.time;
	}

	getPageTitle() {
		const { game } = this.state;
		const { teamList } = this.props;
		if (game) {
			//Get Teams
			const home = teamList[game._homeTeam];
			const away = teamList[game._awayTeam];

			//Get Date
			const date = game.date.toString("dddd dS MMM yyyy");

			return `${home.name.short} vs ${away.name.short} - ${date}`;
		} else {
			return "New Neutral Game";
		}
	}

	renderHeader() {
		const { game } = this.state;
		const { teamTypes } = this.props;

		//Get the title
		const title = this.getPageTitle();

		//Set the core url for the "return" link
		let url = `/admin/neutralGames`;

		//For existing games, we also add the year and team type
		if (game) {
			const { date, _teamType } = game;
			const urlYear = date.getFullYear();
			const urlSlug = teamTypes[_teamType].slug;
			url += `/${urlYear}/${urlSlug}`;
		}

		return (
			<section className="page-header">
				<HelmetBuilder title={title} />
				<div className="container">
					<Link className="nav-card card" to={url}>
						↩ Return to game list
					</Link>
					<h1>{title}</h1>
				</div>
			</section>
		);
	}

	render() {
		const { createNeutralGames, updateNeutralGames, deleteNeutralGame } = this.props;
		const { game, isLoading, isNew, validationSchema } = this.state;

		//Wait for competitions and the game itself to load
		if (isLoading) {
			return <LoadingPage />;
		}

		//404
		if (!isNew && game === false) {
			return <NotFoundPage error={"Game not found"} />;
		}

		//Handle props specifically for create/update
		let formProps;
		if (isNew) {
			formProps = {
				onSubmit: values => createNeutralGames([values]),
				redirectOnSubmit: games => `/admin/neutralGame/${_.values(games)[0]._id}`
			};
		} else {
			formProps = {
				onDelete: () => deleteNeutralGame(game._id),
				onSubmit: values => updateNeutralGames({ [game._id]: values }),
				redirectOnDelete: "/admin/neutralGames/"
			};
		}

		return (
			<div className="admin-neutral-game-page">
				{this.renderHeader()}
				<section className="form">
					<div className="container">
						<BasicForm
							alterValuesBeforeSubmit={this.alterValuesBeforeSubmit}
							enableRedirectBoolean={isNew}
							fastFieldByDefault={false}
							fieldGroups={values => this.getFieldGroups(values)}
							initialValues={this.getInitialValues()}
							isNew={isNew}
							itemType="Game"
							validationSchema={validationSchema}
							{...formProps}
						/>
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ config, games, teams, competitions }) {
	const { localTeam } = config;
	const { neutralGames } = games;
	const { teamList, teamTypes } = teams;
	const { competitionSegmentList } = competitions;
	return {
		localTeam,
		neutralGames,
		teamList,
		competitionSegmentList,
		teamTypes
	};
}

export default withRouter(
	connect(mapStateToProps, {
		fetchCompetitionSegments,
		fetchNeutralGamesFromId,
		createNeutralGames,
		updateNeutralGames,
		deleteNeutralGame
	})(AdminNeutralGamePage)
);
