//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import Select from "react-select";

//Components
import BooleanSlider from "../../fields/BooleanSlider";
import LoadingPage from "../../LoadingPage";
import NotFoundPage from "~/client/pages/NotFoundPage";

//Actions
import { fetchCompetitionSegments, crawlNewFixtures } from "~/client/actions/competitionActions";
import { addCrawledGames } from "~/client/actions/gamesActions";

//Constants
import selectStyling from "~/constants/selectStyling";

//Helpers
import { canCrawlFixtures } from "~/helpers/competitionHelper";

class AdminCompetitionSegmentCrawler extends Component {
	constructor(props) {
		super(props);

		const { competitionSegmentList, fetchCompetitionSegments } = props;
		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}

		this.state = {
			autoPickGround: true
		};
	}

	static getDerivedStateFromProps(nextProps) {
		const { competitionSegmentList, match, teamList } = nextProps;
		const newState = { isLoading: false };

		if (!competitionSegmentList || !teamList) {
			newState.isLoading = true;
			return newState;
		}

		//Get Team Options
		newState.teamOptions = _.chain(teamList)
			.map(t => ({ value: t._id, label: t.name.long }))
			.sortBy("label")
			.value();

		//Get the current segment
		newState.segment = competitionSegmentList[match.params._id] || false;

		return newState;
	}

	resetState(isCrawling) {
		this.setState({
			isCrawling,
			teamMap: null,
			teamMapConfirmed: false,
			filteredGames: null,
			gamesRequiringInstances: null
		});
	}

	renderCrawlAction() {
		const { gamesRequiringInstances, isCrawling } = this.state;

		let loadingDialog;
		if (isCrawling) {
			loadingDialog = (
				<div className="form-card">
					<LoadingPage />
				</div>
			);
		}

		let instanceError;
		if (gamesRequiringInstances) {
			instanceError = (
				<span>
					{gamesRequiringInstances}
					{gamesRequiringInstances === 1 ? " game requires" : " games require"} a corresponding competition
					instance
				</span>
			);
		}

		return (
			<div>
				<div className="form-card">
					<button type="button" onClick={() => this.handleCrawlAction()} disabled={isCrawling}>
						Crawl Fixtures
					</button>
					{instanceError}
				</div>
				{loadingDialog}
			</div>
		);
	}

	async handleCrawlAction() {
		const { crawlNewFixtures } = this.props;
		const { teamOptions, segment } = this.state;

		//Set crawling status and clear out any existing data
		this.resetState(true);

		//Crawl
		const games = await crawlNewFixtures(segment._id);

		if (!games) {
			this.resetState(false);
			return;
		}

		//Ensure we have a valid instance for each game
		const crawledGames = games.filter(g =>
			segment.instances.find(({ year }) => new Date(g.date).getFullYear() == year)
		);

		//Let the user know if instances are required
		const gamesRequiringInstances = games.length - crawledGames.length;

		//Create Empty Team Map
		const teamMap = _.chain(crawledGames)
			.map(({ home, away }) => [home, away])
			.flatten()
			.uniq()
			.sort()
			.map(team => {
				//Get all matching teams
				const matchingTeams = teamOptions.filter(({ label }) =>
					label.toLowerCase().includes(team.toLowerCase())
				);

				//If we have exactly one match, assign it here
				let value;
				if (matchingTeams.length === 1) {
					value = matchingTeams[0].value;
				} else {
					value = "";
				}

				//Return as array
				return [team, value];
			})
			.fromPairs()
			.value();

		//Set complete
		this.setState({ isCrawling: false, crawledGames, teamMap, gamesRequiringInstances });
	}

	renderTeamMapper() {
		const { crawledGames, teamOptions, teamMap, teamMapConfirmed } = this.state;

		const teamOptionsWithSkip = [{ label: "Skip games for this team", value: "skip" }, ...teamOptions];

		if (teamMap && !teamMapConfirmed) {
			if (crawledGames.length) {
				//Get labels and dropdowns
				const inputs = _.map(teamMap, (currentValue, label) => [
					<label key={`${label}-label`} className={teamMap[label] ? "" : "invalid"}>
						{label}
					</label>,
					<Select
						key={`${label}-dropdown`}
						onChange={({ value }) => this.setState({ teamMap: { ...teamMap, [label]: value } })}
						options={teamOptionsWithSkip}
						styles={selectStyling}
						value={teamOptionsWithSkip.find(({ value }) => value == currentValue)}
					/>
				]);

				//Ensure all fields are filled in
				const complete = _.reject(teamMap, _.identity).length === 0;

				return (
					<div className="form-card grid">
						<h6>Map Teams</h6>
						{inputs}
						<div className="buttons">
							<button type="button" disabled={!complete} onClick={() => this.handleTeamMap()}>
								Confirm Teams
							</button>
						</div>
					</div>
				);
			} else {
				return <div className="form-card">No games found</div>;
			}
		}
	}

	handleTeamMap() {
		const { localTeam } = this.props;
		const { crawledGames, segment, teamMap } = this.state;

		//Update games, removing those with skipped teams,
		//or where the home and away teams are the same.
		//We then map the values and add in the competition segment,
		//teamType and externalSync bool
		const filteredGames = crawledGames
			.filter(
				({ home, away }) =>
					teamMap[home] !== "skip" && teamMap[away] !== "skip" && teamMap[home] !== teamMap[away]
			)
			.map(g => ({
				...g,
				externalSync: Boolean(g.externalId),
				_competition: segment._id,
				_teamType: segment._teamType,
				include: true
			}));

		//Quick function to work out whether the game is neutral
		const gameIsNeutral = ({ home, away }) => teamMap[home] != localTeam && teamMap[away] != localTeam;

		//Quick function to pull common values for both local and neutral
		const getCommonValues = g =>
			_.pick(g, ["date", "externalId", "externalSync", "_competition", "_teamType", "include"]);

		//Split into local and neutral games
		const local = filteredGames
			.filter(g => !gameIsNeutral(g))
			.map(g => {
				//Create Game Object
				const game = getCommonValues(g);

				//Add Round
				game.round = g.round || "";

				//Get home/away status
				game.isAway = teamMap[g.away] == localTeam;

				//Get Opposition
				game._opposition = teamMap[game.isAway ? g.home : g.away];

				return game;
			});

		const neutral = filteredGames.filter(gameIsNeutral).map(g => {
			//Create Game Object
			const game = getCommonValues(g);

			//Add Teams
			game._homeTeam = teamMap[g.home];
			game._awayTeam = teamMap[g.away];

			return game;
		});

		this.setState({ teamMapConfirmed: true, filteredGames: { local, neutral } });
	}

	renderGameList() {
		const { teamList } = this.props;
		const { autoPickGround, filteredGames, isSubmitting } = this.state;

		if (filteredGames) {
			if (isSubmitting) {
				return (
					<div className="form-card">
						<LoadingPage />
					</div>
				);
			}

			//Check we have at least one game
			if (!filteredGames.local.length && !filteredGames.neutral.length) {
				return <div className="form-card">No Games To Add</div>;
			}

			//Create object to store rendered output
			const output = _.mapValues(filteredGames, (games, type) => {
				if (games.length) {
					const list = games.map((game, i) => {
						//Create Label
						const labelArray = [];
						if (type == "local") {
							//Add opposition
							labelArray.push(teamList[game._opposition].name.short);

							//Add away status
							labelArray.push(`(${game.isAway ? "A" : "H"})`);
						} else {
							//Add teams
							labelArray.push(
								teamList[game._homeTeam].name.short,
								"vs",
								teamList[game._awayTeam].name.short
							);
						}

						//Add Date
						labelArray.push(new Date(game.date).toString("dS MMMM"));

						//Create Label
						const label = <label key={`${i}-label`}>{labelArray.join(" ")}</label>;

						//Create Bool Switch
						const bool = (
							<BooleanSlider
								key={`${i}-switch`}
								name={`bool-${type}-${i}`}
								value={game.include}
								onChange={() => this.toggleInclusionProperty(type, i)}
							/>
						);

						return [bool, label, <hr key={`${i}-hr`} />];
					});

					const bulkButtons = (
						<div className="full-span">
							<button type="button" onClick={() => this.bulkIncludeGames(type, "includeAll")}>
								Include All
							</button>
							<button type="button" onClick={() => this.bulkIncludeGames(type, "excludeAll")}>
								Exclude All
							</button>
							<button type="button" onClick={() => this.bulkIncludeGames(type, "invert")}>
								Invert Selection
							</button>
						</div>
					);

					return (
						<div className="form-card grid">
							<h6>{type} Games</h6>
							{bulkButtons}
							{list}
						</div>
					);
				}
			});

			if (output.local || output.neutral) {
				//Create Submit Button
				const allowSubmit = _.chain(filteredGames).values().flatten().filter("include").value().length;

				const buttons = (
					<div className="form-card grid">
						<label>Automatically assign ground?</label>
						<BooleanSlider
							name={`bool-auto-pick`}
							value={autoPickGround}
							onChange={() => this.setState({ autoPickGround: !autoPickGround })}
						/>
						<div className="buttons">
							<button
								type="button"
								disabled={!allowSubmit}
								className="confirm"
								onClick={() => this.handleSubmit()}
							>
								Save Games
							</button>
						</div>
					</div>
				);

				return (
					<div>
						{output.local}
						{output.neutral}
						{buttons}
					</div>
				);
			}
		}
	}

	toggleInclusionProperty(type, index) {
		const { filteredGames } = this.state;
		this.setState({
			filteredGames: {
				...filteredGames,
				[type]: filteredGames[type].map((g, i) => ({
					...g,
					include: i === index ? !g.include : g.include
				}))
			}
		});
	}

	bulkIncludeGames(type, action) {
		const { filteredGames } = this.state;
		this.setState({
			filteredGames: {
				...filteredGames,
				[type]: filteredGames[type].map(g => {
					let include;
					switch (action) {
						case "includeAll":
							include = true;
							break;
						case "excludeAll":
							include = false;
							break;
						case "invert":
							include = !g.include;
							break;
					}

					return {
						...g,
						include
					};
				})
			}
		});
	}

	async handleSubmit() {
		const { addCrawledGames } = this.props;
		const { autoPickGround, filteredGames } = this.state;

		//Set submitting state
		this.setState({ isSubmitting: true });

		//Only send the "included" games
		const games = _.mapValues(filteredGames, games => games.filter(g => g.include));

		//Conditionally auto-pick grounds
		if (autoPickGround && filteredGames.local) {
			games.local = games.local.map(g => ({ ...g, _ground: "auto" }));
		}

		//Submit to server
		await addCrawledGames(games);

		//Reset State
		this.resetState(false);
	}

	render() {
		const { isLoading, segment } = this.state;

		if (!canCrawlFixtures(segment)) {
			return <NotFoundPage />;
		}

		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<section>
				<div className="container">
					{this.renderCrawlAction()}
					{this.renderTeamMapper()}
					{this.renderGameList()}
				</div>
			</section>
		);
	}
}

function mapStateToProps({ competitions, config, teams }) {
	const { localTeam } = config;
	const { competitionSegmentList } = competitions;
	const { teamList } = teams;
	return { competitionSegmentList, localTeam, teamList };
}

export default connect(mapStateToProps, {
	fetchCompetitionSegments,
	crawlNewFixtures,
	addCrawledGames
})(AdminCompetitionSegmentCrawler);
