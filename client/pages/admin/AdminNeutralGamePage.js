//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Link, Redirect } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Components
import BasicForm from "../../components/admin/BasicForm";
import LoadingPage from "../../components/LoadingPage";
import HelmetBuilder from "../../components/HelmetBuilder";
import NotFoundPage from "~/client/pages/NotFoundPage";
import DeleteButtons from "~/client/components/admin/fields/DeleteButtons";

//Actions
import {
	fetchNeutralGames,
	updateNeutralGames,
	createNeutralGames,
	deleteNeutralGame
} from "../../actions/neutralGamesActions";
import { fetchCompetitionSegments } from "~/client/actions/competitionActions";

class AdminNeutralGamePage extends BasicForm {
	constructor(props) {
		super(props);
		const {
			competitionSegmentList,
			fetchCompetitionSegments,
			neutralGames,
			fetchNeutralGames
		} = props;

		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}

		if (!neutralGames) {
			fetchNeutralGames();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { competitionSegmentList, neutralGames, teamList, match } = nextProps;
		if (!competitionSegmentList || !neutralGames) {
			return {};
		}

		const newState = {};

		//Check for New Game
		newState.isNew = match.params.id === "new";

		//Set Basic validation schema
		const validationSchema = {
			externalSync: Yup.boolean().label("External Sync"),
			externalId: Yup.number()
				.when("externalSync", (externalSync, schema) => {
					return externalSync
						? schema.required("An ID is required for External Sync")
						: null;
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
				.test("isUnique", "Home Team and Away Team cannot match", function(_homeTeam) {
					const { _awayTeam } = this.parent;
					return !_homeTeam || !_awayTeam || _homeTeam.value !== _awayTeam.value;
				})
				.label("Home Team"),
			_awayTeam: Yup.mixed()
				.required()
				.test("isUnique", "Home Team and Away Team cannot match", function(_awayTeam) {
					const { _homeTeam } = this.parent;
					return !_homeTeam || !_awayTeam || _homeTeam.value !== _awayTeam.value;
				})
				.label("Away Team"),
			homePoints: Yup.number()
				.min(0)
				.label("Home Points"),
			awayPoints: Yup.number()
				.min(0)
				.label("Away Points"),
			date: Yup.date()
				.required()
				.label("Date")
		};

		if (!newState.isNew) {
			const game = _.find(neutralGames, g => g._id === match.params.id) || false;
			if (game) {
				newState.game = _.cloneDeep(game);
				newState.game._homeTeam = teamList[game._homeTeam];
				newState.game._awayTeam = teamList[game._awayTeam];
				const year = new Date(game.date).getFullYear();
				validationSchema.date = Yup.date()
					.required()
					.label("Date")
					.min(`${year}-01-01`)
					.max(`${year}-12-31`);
			}
		}

		newState.validationSchema = Yup.object().shape(validationSchema);

		return newState;
	}

	handleSubmit(values) {
		const { game } = this.state;
		const { createNeutralGames, updateNeutralGames } = this.props;

		//Fix Date
		values.date = `${values.date} ${values.time}`;
		delete values.time;

		values = _.mapValues(values, v => {
			if (typeof v === "object") {
				v = v.value;
			}
			if (v === "") {
				return null;
			} else {
				return v;
			}
		});

		if (game) {
			updateNeutralGames({ [game._id]: values });
		} else {
			createNeutralGames([values]);
		}
		this.setState({
			redirect: `${new Date(values.date).getFullYear()}/${values._teamType}`
		});
	}

	handleDelete() {
		const { game } = this.state;
		const { deleteNeutralGame } = this.props;
		deleteNeutralGame(game._id);
		this.setState({ redirect: `${game.date.getFullYear()}/${game._teamType}` });
	}

	generatePageTitle() {
		const { game } = this.state;
		if (game) {
			const { _homeTeam, _awayTeam, date } = this.state.game;
			return `${_homeTeam.name.short} vs ${_awayTeam.name.short} - ${date.toString(
				"ddd dS MMM yyyy"
			)}`;
		} else {
			return "New Neutral Game";
		}
	}

	generatePageHeader() {
		const { game } = this.state;
		let url = `/admin/neutralGames`;
		if (game) {
			const { date, _teamType } = game;
			const { teamTypes } = this.props;
			const urlYear = date.getFullYear();
			const urlSlug = teamTypes[_teamType].slug;
			url += `/${urlYear}/${urlSlug}`;
		}
		return (
			<section className="page-header">
				<div className="container">
					<Link className="nav-card card" to={url}>
						↩ Return to game list
					</Link>
					<h1>{this.generatePageTitle()}</h1>
				</div>
			</section>
		);
	}

	getDefaults() {
		const { game } = this.state;
		const { teamTypes, competitionSegmentList } = this.props;
		if (game) {
			return {
				externalSync: game.externalSync,
				externalId: game.externalId || "",
				date: game.date.toString("yyyy-MM-dd"),
				time: game.date.toString("HH:mm:ss"),
				_teamType: {
					value: game._teamType,
					label: teamTypes[game._teamType].name
				},
				_competition: {
					value: game._competition,
					label: competitionSegmentList[game._competition].name
				},
				_homeTeam: {
					value: game._homeTeam._id,
					label: game._homeTeam.name.long
				},
				_awayTeam: {
					value: game._awayTeam._id,
					label: game._awayTeam.name.long
				},
				homePoints: game.homePoints === null ? "" : game.homePoints,
				awayPoints: game.awayPoints === null ? "" : game.awayPoints
			};
		} else {
			return {
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
		}
	}

	getOptions(values) {
		const { competitionSegmentList, teamTypes, teamList, localTeam } = this.props;
		const options = {};
		options.teamTypes = _.map(teamTypes, t => ({ label: t.name, value: t._id }));
		if (values.date && values._teamType) {
			const year = new Date(values.date).getFullYear();
			options.competitions = _.chain(competitionSegmentList)
				.filter(c => c._teamType == values._teamType.value)
				.filter(c => _.find(c.instances, i => i.year == year || i.year == null))
				.map(c => ({ label: c.name, value: c._id }))
				.value();

			if (values._competition) {
				const competition = competitionSegmentList[values._competition.value];
				const instance = _.find(
					competition.instances,
					i => i.year == year || i.year == null
				);
				options.teams = _.chain(teamList)
					.filter(team => !instance.teams || instance.teams.indexOf(team._id) > -1)
					.map(team => {
						return { label: team.name.long, value: team._id };
					})
					.sortBy("label")
					.value();
			} else {
				options.teams = [];
			}
		} else {
			options.competitions = [];
			options.teams = [];
		}

		//Remove Local Team
		options.teams = _.reject(options.teams, t => t.value === localTeam);

		return options;
	}

	renderDeleteButtons() {
		if (this.state.game) {
			return (
				<div className="form-card">
					<DeleteButtons onDelete={() => this.handleDelete()} />
				</div>
			);
		}
	}

	render() {
		const { game, isNew, redirect, validationSchema } = this.state;

		if (redirect) {
			return <Redirect to={`/admin/neutralGames/${redirect}`} />;
		}

		if (game === undefined && !isNew) {
			return <LoadingPage />;
		}

		if (!game && !isNew) {
			return <NotFoundPage error={"Game not found"} />;
		}

		return (
			<div>
				<HelmetBuilder title={this.generatePageTitle()} />
				{this.generatePageHeader()}
				<section>
					<div className="container">
						<Formik
							initialValues={this.getDefaults()}
							validationSchema={validationSchema}
							onSubmit={values => this.handleSubmit(values)}
							render={formikProps => {
								const options = this.getOptions(formikProps.values);
								const fields = [
									{ name: "externalSync", type: "Boolean" },
									{ name: "externalId", type: "number" },
									{ name: "date", type: "date" },
									{ name: "time", type: "time" },
									{
										name: "_teamType",
										type: "Select",
										disabled: Boolean(game),
										options: options.teamTypes,
										clearOnChange: ["_competition"]
									},
									{
										name: "_competition",
										type: "Select",
										disabled: Boolean(game),
										options: options.competitions
									},
									{ name: "_homeTeam", type: "Select", options: options.teams },
									{ name: "_awayTeam", type: "Select", options: options.teams },
									{ name: "homePoints", type: "number" },
									{ name: "awayPoints", type: "number" }
								];

								return (
									<Form>
										{this.renderDeleteButtons()}
										<div className="form-card grid">
											{this.renderFieldGroup(fields, true)}
											<div className="buttons">
												<button type="reset">Reset</button>
												<button type="submit">Save</button>
											</div>
										</div>
									</Form>
								);
							}}
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

export default connect(
	mapStateToProps,
	{
		fetchCompetitionSegments,
		fetchNeutralGames,
		createNeutralGames,
		updateNeutralGames,
		deleteNeutralGame
	}
)(AdminNeutralGamePage);
