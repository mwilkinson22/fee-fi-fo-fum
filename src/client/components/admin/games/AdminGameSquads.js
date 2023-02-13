//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import SquadSelector from "../../teamselectors/SquadSelector";

//Actions
import { markSquadAsAnnounced, setSquad } from "../../../actions/gamesActions";
import TeamImage from "~/client/components/teams/TeamImage";

class AdminGameSquads extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullGames, match } = nextProps;

		const newState = {};

		newState.game = fullGames[match.params._id];

		return newState;
	}

	async handleSubmit(team, squad) {
		const { setSquad } = this.props;
		const { game } = this.state;

		await setSquad(game._id, { team, squad });
	}

	getAllPlayers(team) {
		const { game } = this.state;

		//Get pregame squad
		const pregameSquad = game.pregameSquads.find(({ _team }) => _team == team);

		//Get the full list of eligible players
		return game.eligiblePlayers[team].map(_player => {
			let showInDropdown;

			//We only use a dropdown when pregame squads are used
			if (game._competition.instance.usesPregameSquads) {
				//Returns true if a player appears in neither the pregame or match squad
				showInDropdown =
					!pregameSquad.squad.find(id => id == _player._id) &&
					!game.playerStats.find(stats => stats._player == _player._id);
			} else {
				showInDropdown = false;
			}

			return {
				_player,
				number: _player.number,
				showInDropdown
			};
		});
	}

	getCurrentSquad(team) {
		const { game } = this.state;
		return _.chain(game.playerStats)
			.filter(({ _team }) => _team == team)
			.map(({ position, _player }) => [position, _player])
			.fromPairs()
			.value();
	}

	render() {
		const { game } = this.state;
		const { localTeam, teamList } = this.props;

		//Get Both Teams
		const teams = [localTeam, game._opposition._id];
		if (game.isAway) {
			teams.reverse();
		}

		const content = teams.map(team => (
			<div className="form-card" key={team}>
				<Link to={`/admin/teams/${team}/squads`}>
					<TeamImage team={teamList[team]} variant="dark" size="medium" />
				</Link>
				<SquadSelector
					currentSquad={this.getCurrentSquad(team)}
					maxInterchanges={game._competition._parentCompetition.interchangeLimit}
					usesExtraInterchange={game._competition.instance.usesExtraInterchange}
					onSubmit={values => this.handleSubmit(team, values)}
					players={this.getAllPlayers(team)}
					requireFullTeam={false}
					team={teamList[team]}
				/>
			</div>
		));

		return (
			<div className="admin-squad-picker-page">
				<div className="container">
					<div className="form-card grid">
						<div className="buttons">
							<button
								type="button"
								className={game.squadsAnnounced ? "delete" : "confirm"}
								onClick={() => this.props.markSquadAsAnnounced(game._id, !game.squadsAnnounced)}
							>
								Mark squads as {game.squadsAnnounced ? "unannounced" : "announced"}
							</button>
						</div>
					</div>
					{content}
				</div>
			</div>
		);
	}
}

function mapStateToProps({ config, games, teams }) {
	const { fullGames } = games;
	const { teamList } = teams;
	const { localTeam } = config;
	return { fullGames, teamList, localTeam };
}

export default connect(mapStateToProps, { markSquadAsAnnounced, setSquad })(AdminGameSquads);
