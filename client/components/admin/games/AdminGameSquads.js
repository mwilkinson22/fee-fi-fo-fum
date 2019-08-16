//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";

//Components
import SquadSelector from "./SquadSelector";
import LoadingPage from "../../LoadingPage";

//Actions
import { setPregameSquads, markSquadAsAnnounced } from "../../../actions/gamesActions";
import TeamImage from "~/client/components/teams/TeamImage";

class AdminGameSquads extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { game, localTeam } = nextProps;
		const newState = {};

		const teams = [localTeam, game._opposition._id];

		//Get Squads
		if (!prevState.squads) {
			newState.squads = _.chain(teams)
				.map(id => {
					const fullSquad = game.eligiblePlayers[id];
					let availablePlayers;
					if (game._competition.instance.usesPregameSquads) {
						availablePlayers = _.find(game.pregameSquads, s => s._team === id).squad;
					} else {
						availablePlayers = _.map(fullSquad, ({ _player }) => _player._id);
					}

					const filteredSquad = _.map(fullSquad, squadMember => {
						let name = "";
						if (squadMember.number) {
							name += `${squadMember.number}. `;
						}
						name += `${squadMember._player.name.first} ${
							squadMember._player.name.last
						}`;

						const currentSquadMember = _.find(
							game.playerStats,
							s => s._team === id && s._player === squadMember._player._id
						);
						const position = currentSquadMember ? currentSquadMember.position : null;

						return {
							_id: squadMember._player._id,
							number: squadMember.number,
							name,
							mainPosition: squadMember._player.playerDetails.mainPosition,
							otherPositions: squadMember._player.playerDetails.otherPositions,
							inPregame: Boolean(
								_.find(availablePlayers, p => p == squadMember._player._id)
							),
							position
						};
					});

					return [id, filteredSquad];
				})
				.fromPairs()
				.value();
		}

		return newState;
	}

	render() {
		const { squads } = this.state;
		const { game, localTeam, teamList } = this.props;
		if (!squads) {
			return <LoadingPage />;
		}

		let teams = [localTeam, game._opposition._id];
		if (game.isAway) {
			teams = teams.reverse();
		}

		const content = teams.map(id => {
			const { colours } = teamList[id];
			return (
				<div className="form-card squad-selector-wrapper" key={id}>
					<TeamImage team={teamList[id]} variant="dark" />
					<SquadSelector
						squad={squads[id]}
						teamColours={colours}
						team={id}
						game={game._id}
					/>
				</div>
			);
		});
		return (
			<div className="admin-squad-picker-page">
				<div className="container">
					<div className="form-card grid">
						<div className="buttons">
							<button
								type="button"
								className={game.squadsAnnounced ? "delete" : "confirm"}
								onClick={() =>
									this.props.markSquadAsAnnounced(game._id, !game.squadsAnnounced)
								}
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

function mapStateToProps({ config, teams }) {
	const { teamList } = teams;
	const { localTeam } = config;
	return { teamList, localTeam };
}

export default connect(
	mapStateToProps,
	{ setPregameSquads, markSquadAsAnnounced }
)(AdminGameSquads);
