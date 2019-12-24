//Modules
import _ from "lodash";
import React, { Component } from "react";
import Select, { Async } from "react-select";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";

//Components
import LoadingPage from "../../LoadingPage";

//Actions
import { fetchPeopleList } from "~/client/actions/peopleActions";
import { fetchTeam } from "~/client/actions/teamsActions";
import { updateTeamSelector } from "~/client/actions/teamSelectorActions";

//Constants
import selectStyling from "~/constants/selectStyling";

//Helpers
import { getSquadsAsDropdown } from "~/helpers/teamHelper";

class AdminTeamSelectorPlayers extends Component {
	constructor(props) {
		super(props);

		const { fetchPeopleList, peopleList } = props;

		if (!peopleList) {
			fetchPeopleList();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const {
			fetchTeam,
			fullTeams,
			localTeam,
			match,
			peopleList,
			selectors,
			teamList,
			teamTypes
		} = nextProps;
		const newState = { isLoading: false };

		//Wait for people to load
		if (!peopleList) {
			newState.isLoading = true;
			return newState;
		}

		//Get Current Selector
		newState.selector = selectors[match.params._id];

		//Reset data on page change
		//Store in the async format, for ease of formatting
		let { players, squad, team } = prevState;
		if (!prevState.selector || prevState.selector._id != newState.selector._id) {
			//Update the team
			team = localTeam;
			newState.team = team;

			//Update the squad
			squad = null;
			newState.squad = squad;

			//Update the selected players
			players = newState.selector.players.map(({ name, _id }) => ({
				label: name.full,
				value: _id
			}));
			newState.players = players;
		}

		//Check for changes
		const originalValues = newState.selector.players.map(p => p._id);
		const currentValues = players.map(p => p.value);
		const added = _.difference(currentValues, originalValues);
		const removed = _.difference(originalValues, currentValues);
		newState.valuesHaveChanged = added.length + removed.length > 0;

		//Get Team
		if (!fullTeams[team] && !prevState.isLoadingTeam) {
			fetchTeam(team);
			newState.isLoadingTeam = true;
		}

		//Get Dropdown Options
		newState.options = {};

		//Players
		newState.options.players = _.chain(peopleList)
			.filter("isPlayer")
			.reject(({ _id }) => players.find(({ value }) => value == _id))
			.map(({ name, _id }) => ({ label: `${name.first} ${name.last}`, value: _id }))
			.sortBy("label")
			.value();

		//Teams
		newState.options.teams = _.chain(teamList)
			.map(({ _id, name }) => ({ label: name.long, value: _id }))
			.sortBy("label")
			.value();

		//Squads
		if (fullTeams[team]) {
			newState.options.squads = getSquadsAsDropdown(fullTeams[team].squads, teamTypes);
			newState.isLoadingTeam = false;
		} else {
			newState.options.squads = [];
		}

		return newState;
	}

	getInitialValues() {
		const { players } = this.state.selector;
		return { players };
	}

	handleSubmit() {
		const { updateTeamSelector } = this.props;
		const { players, selector } = this.state;

		updateTeamSelector(selector._id, { players: players.map(p => p.value) });
	}

	renderIndividualAdder() {
		const { options, players } = this.state;

		return (
			<div className="form-card">
				<h6>Add Individual Players</h6>
				<Async
					onChange={player => this.setState({ players: [...players, player] })}
					styles={selectStyling}
					value={{ label: "Add a player", value: false }}
					loadOptions={input => {
						if (input.length > 3) {
							return new Promise(resolve => {
								resolve(
									options.players.filter(({ label }) =>
										label.toLowerCase().includes(input.toLowerCase())
									)
								);
							});
						}
					}}
				/>
			</div>
		);
	}

	renderSquadAdder() {
		return (
			<div className="form-card grid">
				<h6>Add by squad</h6>
				<label>Team</label>
				{this.renderTeamSelector()}
				<label>Squad</label>
				{this.renderSquadSelector()}
				<label>Players</label>
				{this.renderSquadPlayerList()}
			</div>
		);
	}

	renderTeamSelector() {
		const { isLoadingTeam, options, team } = this.state;
		return (
			<Select
				isDisabled={isLoadingTeam}
				onChange={({ value }) => this.setState({ team: value, squad: null })}
				options={options.teams}
				styles={selectStyling}
				value={options.teams.find(({ value }) => value == team)}
			/>
		);
	}

	renderSquadSelector() {
		const { isLoadingTeam, options, squad } = this.state;

		let value = { label: "Select a squad" };

		if (squad) {
			value = _.chain(options.squads)
				.map(g =>
					g.options.map(({ label, value }) => ({ value, label: `${label} ${g.label}` }))
				)
				.flatten()
				.find(opt => opt.value == squad)
				.value();
		}

		return (
			<Select
				isDisabled={isLoadingTeam}
				onChange={({ value }) => this.setState({ squad: value })}
				options={options.squads}
				styles={selectStyling}
				value={value}
			/>
		);
	}

	renderSquadPlayerList() {
		const { fullTeams } = this.props;
		const { players, squad, team } = this.state;

		//If we don't have a squad selected, show a prompt
		if (!team || !squad) {
			return "Select a squad to see available players";
		}

		//Get the squad object
		const squadObject = fullTeams[team].squads.find(({ _id }) => _id == squad);

		//Work out which players to display
		const playersForList = squadObject.players.filter(
			({ _player }) => !players.find(({ value }) => value == _player._id)
		);

		//If all players have been added, display a message
		if (!playersForList.length) {
			return "No available players to add";
		}

		//Render list
		let list = _.chain(playersForList)
			.sortBy(p => p.number || p._player.name.full)
			.map(({ _player, number }) => ({
				value: _player._id,
				label: `${number ? `${number}. ` : ""}${_player.name.full}`,
				name: _player.name.full
			}))
			.map(p => {
				return (
					<div
						className="actionable-player add"
						key={p.value}
						onClick={() =>
							this.setState({
								players: [...players, { value: p.value, label: p.name }]
							})
						}
					>
						{p.label}
					</div>
				);
			})
			.value();

		//Add "all" option when necessary
		if (playersForList.length > 1) {
			const allButton = (
				<div
					className="actionable-player add"
					key="all"
					onClick={() => {
						const playersToAdd = playersForList.map(({ _player }) => ({
							label: _player.name.full,
							value: _player._id
						}));
						this.setState({
							players: [...players, ...playersToAdd]
						});
					}}
				>
					Add All Players
				</div>
			);

			list.unshift(allButton);
		}

		return <div>{list}</div>;
	}

	renderCurrentPlayers() {
		const { players } = this.state;

		if (players && players.length) {
			const list = _.chain(players)
				.sortBy("label")
				.map(p => (
					<div
						className="actionable-player remove"
						key={p.value}
						onClick={() =>
							this.setState({
								players: players.filter(({ value }) => value !== p.value)
							})
						}
					>
						{p.label}
					</div>
				))
				.value();
			return (
				<div className="form-card">
					<h6>Current Players</h6>
					{list}
				</div>
			);
		}
	}

	renderButtons() {
		const { valuesHaveChanged } = this.state;

		return (
			<div className="form-card">
				<div className="buttons">
					<button
						disabled={!valuesHaveChanged}
						onClick={() => {
							//Clearing the selector will trigger a full re-render
							this.setState({ selector: undefined });
						}}
						type="reset"
					>
						Reset
					</button>
					<button
						className="confirm"
						disabled={!valuesHaveChanged}
						onClick={() => this.handleSubmit()}
						type="button"
					>
						Update
					</button>
				</div>
			</div>
		);
	}

	render() {
		const { isLoading } = this.state;

		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<div className="admin-team-selector-players-page">
				{this.renderIndividualAdder()}
				{this.renderSquadAdder()}
				{this.renderCurrentPlayers()}
				{this.renderButtons()}
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ config, people, teamSelectors, teams }) {
	const { localTeam } = config;
	const { peopleList } = people;
	const { teamList, fullTeams, teamTypes } = teams;
	const { selectors } = teamSelectors;
	return { fullTeams, localTeam, peopleList, selectors, teamList, teamTypes };
}
// export default form;
export default withRouter(
	connect(mapStateToProps, { fetchPeopleList, fetchTeam, updateTeamSelector })(
		AdminTeamSelectorPlayers
	)
);
