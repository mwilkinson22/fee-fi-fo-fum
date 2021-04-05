//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components;
import LoadingPage from "../../LoadingPage";

//Actions
import { crawlGame } from "../../../actions/gamesActions";
import { setExternalNames } from "../../../actions/peopleActions";

class AdminGameCrawler extends Component {
	constructor(props) {
		super(props);

		this.state = {};
	}

	renderErrors() {
		const { crawlData } = this.state;
		const { game, teamList, teams } = this.props;
		const { scoreOnly } = game._competition.instance;

		//Check For Inconsistencies in teams
		const errors = [];
		_.each(teams, teamId => {
			const externalCount = Object.keys(crawlData.results[teamId]).length;
			const localCount = game.playerStats.filter(p => p._team == teamId).length;
			const teamName = teamList[teamId].name.short;
			if (!scoreOnly && externalCount !== localCount) {
				errors.push(
					<li key={teamId + "mismatch"}>
						Crawled {teamName} squad size does not match local. Local: {localCount} players, Crawled:{" "}
						{externalCount} players
					</li>
				);
			}
			//Players on the local site but not remote
			const unmatchedPlayers = _.chain(crawlData.playersToName)
				.reject("matched")
				.filter(p => p._team == teamId)
				.map(p => _.find(game.eligiblePlayers[teamId], e => e._id == p._id).name.full)
				.value();
			if (!scoreOnly && unmatchedPlayers.length) {
				errors.push(
					<li key={teamId + "unmatched"}>
						{teamName} players missing from remote site: {unmatchedPlayers.join(", ")}
					</li>
				);
			}
			//Players on the remote site but not local
			const extraPlayers = _.chain(crawlData.results[teamId])
				.map((obj, name) => ({ ...obj, name }))
				.reject("_player")
				.map("name")
				.value();
			if (extraPlayers.length) {
				errors.push(
					<li key={teamId + "extra"}>
						Additional {teamName} players found on remote site: {extraPlayers.join(", ")}
					</li>
				);
			}
		});

		if (errors.length) {
			return (
				<ul className="error" key="errors">
					<li>
						<strong>Errors:</strong>
					</li>
					{errors}
				</ul>
			);
		} else {
			return null;
		}
	}

	renderPlayers() {
		const { game } = this.props;
		const { crawlData, nameMatch } = this.state;

		return _.map(crawlData.results, (players, team) => {
			let options = _.chain(crawlData.playersToName)
				.reject("matched")
				.filter(p => p._team == team)
				.map(({ _id }) => ({
					value: _id,
					label: _.find(game.eligiblePlayers[team], p => p._id == _id).name.full
				}))
				.sortBy("label")
				.map(({ value, label }) => (
					<option value={value} key={value}>
						{label}
					</option>
				))
				.value();
			options = [
				<option key="none" value="null">
					Ignore this player
				</option>,
				...options
			];

			const playerRows = _.map(players, (player, name) => {
				const match = _.find(game.eligiblePlayers[team], p => p._id == player._player);

				let matchResult;
				if (match) {
					matchResult = `${player.match} match: ${match.name.full}`;
				} else {
					matchResult = (
						<select
							onChange={({ target }) =>
								this.setState({
									nameMatch: {
										...nameMatch,
										[team]: {
											...nameMatch[team],
											[name]: target.value
										}
									}
								})
							}
						>
							{options}
						</select>
					);
				}

				return [
					<div className={`match-type ${player.match}`} key="matchType" />,
					<div className="name" key="name">
						{name}
					</div>,
					<div className="match" key="match">
						{matchResult}
					</div>
				];
			});
			return (
				<div key={team} className="player-rows">
					<div />
					<div className="name header">
						<strong>Crawled Name</strong>
					</div>
					<div className="match header">
						<strong>Matched Player</strong>
					</div>
					{playerRows}
				</div>
			);
		});
	}

	async onRequest(includeScoringStats) {
		const { game, crawlGame } = this.props;

		//Enable loading spinner
		this.setState({ isLoading: true, externalError: false });

		//Get data
		const crawlData = await crawlGame(game._id, includeScoringStats);

		//Set up newState object
		const newState = { isLoading: false };

		//Allow for errors
		if (crawlData) {
			newState.crawlData = crawlData;
			newState.nameMatch = _.mapValues(crawlData.results, players => {
				return _.mapValues(players, ({ _player }) => _player);
			});
		} else {
			newState.externalError = true;
		}

		this.setState(newState);
	}

	async onSubmit() {
		const { formikProps, teams, setExternalNames } = this.props;
		const { crawlData, nameMatch } = this.state;
		const namesToUpdate = [];

		//Use a separate object to prevent multiple setFieldValue calls
		const newValues = {};

		_.each(teams, team => {
			//Update Stats
			_.each(nameMatch[team], (_id, crawledName) => {
				if (!_id || _id == "null") {
					return true;
				}

				const playerResults = crawlData.results[team][crawledName];
				if (playerResults && playerResults.stats) {
					const { stats } = playerResults;

					//Fix Goals
					if (stats.G) {
						stats.CN = stats.G;
						delete stats.G;
					}

					newValues[_id] = {
						...formikProps.values[_id],
						...stats
					};
				}
			});

			//Update partial matches
			_.chain(crawlData.results[team])
				.map((obj, name) => ({ ...obj, name }))
				.filter(p => p.match == "partial")
				.each(({ _player, name }) => namesToUpdate.push({ _player, name }))
				.value();
		});

		//Update formik
		formikProps.setValues({
			...formikProps.values,
			...newValues
		});

		//Update External Names
		if (namesToUpdate.length) {
			setExternalNames(namesToUpdate);
		}

		//Clear Data
		this.setState({ crawlData: null });
	}

	renderButtons() {
		const { scoreOnly } = this.props;
		if (scoreOnly) {
			return (
				<div className="buttons" key="buttons">
					<button type="button" onClick={async () => this.onRequest(true)}>
						Get Scores
					</button>
				</div>
			);
		} else {
			return (
				<div className="buttons" key="buttons">
					<button type="button" onClick={async () => this.onRequest(false)}>
						Get Stats
					</button>
					<button type="button" onClick={async () => this.onRequest(true)}>
						Get Scores + Stats
					</button>
				</div>
			);
		}
	}

	render() {
		const { externalError, isLoading, crawlData } = this.state;
		let content;

		if (isLoading) {
			content = <LoadingPage />;
		} else if (crawlData) {
			content = [
				<div key="url">
					<strong>
						<span>Data pulled from </span>
						<a href={crawlData.url} target="_blank" rel="noopener noreferrer">
							{crawlData.url}
						</a>
					</strong>
				</div>,
				this.renderErrors(),
				<div className="player-rows-wrapper" key="prw">
					{this.renderPlayers()}
				</div>,
				<div className="buttons" key="buttons">
					<button className="delete" type="button" onClick={() => this.setState({ crawlData: null })}>
						Clear Data
					</button>
					<button type="button" className="confirm" onClick={async () => this.onSubmit()}>
						Process
					</button>
				</div>
			];
		} else {
			let error;
			if (externalError) {
				error = (
					<span key="error" className="full-span error">
						Could not load external data
					</span>
				);
			}
			content = [error, this.renderButtons()];
		}

		return (
			<div className="form-card admin-game-stat-crawler">
				<h6>Crawl Game Externally</h6>
				{content}
			</div>
		);
	}
}

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { teamList } = teams;
	return { localTeam, teamList };
}

export default connect(mapStateToProps, { crawlGame, setExternalNames })(AdminGameCrawler);
