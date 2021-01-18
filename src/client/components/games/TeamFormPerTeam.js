//Modules
import React, { Component } from "react";
import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../LoadingPage";
import TeamImage from "../teams/TeamImage";

class TeamFormPerTeam extends Component {
	constructor(props) {
		super(props);

		const { allCompetitions, game } = props;
		const formObject = game.teamForm[allCompetitions ? "allCompetitions" : "singleCompetition"];
		this.state = { formObject };
	}

	renderTable(renderLocalTeam) {
		const { formObject } = this.state;
		const { localTeam, game, teamList } = this.props;

		//Choose relevant games
		const games = formObject[renderLocalTeam ? "local" : "opposition"];

		//Ensure we have at least one game
		if (!games || !games.length) {
			return null;
		}

		//Get the team info
		const team = renderLocalTeam ? teamList[localTeam] : game._opposition;

		//Render games
		const renderedGames = games.map(g => {
			const { _homeTeam, _awayTeam, homePoints, awayPoints, slug, date } = g;

			//Get key data
			const isAway = _awayTeam == team._id;
			const oppositionId = isAway ? _homeTeam : _awayTeam;

			//Get Score & Result
			const [localScore, oppositionScore] = isAway
				? [awayPoints, homePoints]
				: [homePoints, awayPoints];
			let result;
			if (localScore > oppositionScore) {
				result = "W";
			} else if (localScore < oppositionScore) {
				result = "L";
			} else {
				result = "D";
			}

			//We will either return a link or a div depending on if the game is neutral,
			//so we create the props separately
			const renderedGameProps = {
				key: g._id,
				className: "game"
			};

			renderedGameProps.children = [
				<div className="badge" key="badge">
					<TeamImage team={teamList[oppositionId]} variant="dark" size="medium" />
				</div>,
				<div className="date" key="date">
					{new Date(date).toString("dd/MM/yyyy")}
				</div>,
				<div className={`score ${result}`} key="score">
					{homePoints}-{awayPoints}
				</div>
			];

			//Finally, return this box either as a link or a div
			if (slug) {
				return <Link to={`/games/${slug}`} {...renderedGameProps} />;
			} else {
				return <div {...renderedGameProps} />;
			}
		});

		return (
			<div className="team" key={team._id}>
				<div
					style={{ background: team.colours.main, color: team.colours.text }}
					className="header"
				>
					<div>
						<TeamImage team={team} size="medium" />
					</div>
					Last {games.length == 1 ? "game" : `${games.length} games`}
				</div>
				<div className="games">{renderedGames}</div>
			</div>
		);
	}

	render() {
		const { includeHeader, game } = this.props;
		const { formObject } = this.state;

		//Wait on dependencies
		if (!formObject) {
			return <LoadingPage />;
		}

		//Ensure we have at least one game to show
		if (formObject.local.length + formObject.opposition.length === 0) {
			return null;
		}

		//Conditionally add header
		let header;
		if (includeHeader) {
			header = <h2>Form</h2>;
		}

		//Work out if game is away
		const { isAway } = game;

		return (
			<div className="per-team-form">
				{header}
				{this.renderTable(!isAway)}
				{this.renderTable(isAway)}
			</div>
		);
	}
}

TeamFormPerTeam.propTypes = {
	allCompetitions: PropTypes.bool,
	game: PropTypes.object.isRequired,
	includeHeader: PropTypes.bool
};

TeamFormPerTeam.defaultProps = {
	allCompetitions: true,
	includeHeader: true
};

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { teamList } = teams;
	return { localTeam, teamList };
}

export default connect(mapStateToProps)(TeamFormPerTeam);
