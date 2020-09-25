//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

//Components
import PopUpDialog from "../../PopUpDialog";
import LoadingPage from "../../LoadingPage";

//Actions
import { fetchGameList } from "~/client/actions/gamesActions";

class AdminPlayerGameList extends Component {
	constructor(props) {
		super(props);

		const { gameList, fetchGameList } = props;
		if (!gameList) {
			fetchGameList();
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { gameList } = nextProps;
		if (gameList) {
			return { isLoading: false, gameList };
		} else {
			return { isLoading: true };
		}
	}

	renderList() {
		const { localTeam, playedGames, teamList } = this.props;
		const { gameList, isLoading } = this.state;

		if (isLoading) {
			return <LoadingPage />;
		}

		const list = _.chain(playedGames)
			.map(({ _id, forLocalTeam, pregameOnly }) => {
				const game = gameList[_id];
				const team = teamList[forLocalTeam ? localTeam : game._opposition].name.long;
				return { game, team, forLocalTeam, pregameOnly };
			})
			//Put local team at the top, sort the rest alphabetically
			.orderBy(["forLocalTeam", "team"], ["desc", "asc"])
			.groupBy("team")
			.map((games, team) => {
				//Add team header
				const list = [
					<li key={team + "header"}>
						<h6>{team}</h6>
					</li>
				];

				//Add games
				_.orderBy(games, "date", "desc").forEach(({ game, pregameOnly, forLocalTeam }) => {
					let str = "";

					//Conditionally add opposition
					if (forLocalTeam) {
						str = teamList[game._opposition].name.short + " - ";
					}

					//Add date
					str += game.date.toString("dS MMM yyyy");

					//Conditionally add pregame status
					if (pregameOnly) {
						str += " (Pregame Only)";
					}

					//Get URL
					let url = `/admin/game/${game._id}/`;
					if (pregameOnly) {
						url += "pregame";
					} else {
						url += "squads";
					}

					list.push(
						<li key={game._id}>
							<Link to={url}>{str}</Link>
						</li>
					);
				});

				return list;
			})
			.flatten()
			.value();

		return <ul className="player-game-list">{list}</ul>;
	}

	render() {
		const { onDestroy } = this.props;
		return <PopUpDialog onDestroy={onDestroy}>{this.renderList()}</PopUpDialog>;
	}
}

function mapStateToProps({ config, games, teams }) {
	const { localTeam } = config;
	const { gameList } = games;
	const { teamList } = teams;
	return { localTeam, gameList, teamList };
}

AdminPlayerGameList.propTypes = {
	playedGames: PropTypes.array.isRequired,
	onDestroy: PropTypes.func.isRequired
};

export default connect(mapStateToProps, { fetchGameList })(AdminPlayerGameList);
