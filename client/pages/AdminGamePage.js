import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { fetchGame } from "../actions/gamesActions";
import LoadingPage from "../components/LoadingPage";
import HelmetBuilder from "../components/HelmetBuilder";
import NotFoundPage from "../pages/NotFoundPage";
import { localTeam } from "../../config/keys";
import { NavLink, Link } from "react-router-dom";

class AdminGamePage extends Component {
	constructor(props) {
		super(props);
		const { game, match, fetchGame } = props;
		if (!game) {
			fetchGame(match.params.slug);
		}
		this.state = { game };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		return { game: nextProps.game };
	}

	getPageTitle() {
		const { game } = this.state;
		const { isAway, scores, _opposition, date } = game;
		let strings;
		if (scores) {
			strings = [
				"Giants",
				" ",
				scores[localTeam],
				"-",
				scores[_opposition._id],
				" ",
				_opposition.name.short
			];
		} else {
			strings = ["Giants", " vs ", _opposition.name.short];
		}
		if (isAway) {
			strings = strings.reverse();
		}

		return strings.join("") + " - " + new Date(date).toString("dd/MM/yyyy");
	}

	getSubmenu() {
		const { status, slug } = this.state.game;
		const submenuItems = {
			0: {
				Overview: "",
				"Pregame Squads": "pregame",
				Images: "images"
			},
			1: {
				"Match Squads": "squads"
			},
			2: {
				"In-Game Events": "events",
				"Set Stats": "stats"
			}
		};
		const submenu = _.map(submenuItems, (items, reqStatus) => {
			if (status >= reqStatus) {
				return _.map(items, (url, title) => {
					return (
						<NavLink
							key={url}
							exact
							to={`/admin/game/${slug}/${url}`}
							activeClassName="active"
						>
							{title}
						</NavLink>
					);
				});
			} else return null;
		});
		return (
			<div className="sub-menu" key="menu">
				{submenu}
			</div>
		);
	}

	render() {
		const { game } = this.state;
		let content, header;
		if (game === undefined) {
			content = <LoadingPage />;
		} else if (!game) {
			content = <NotFoundPage message="Game not found" />;
		} else {
			header = [<h1 key="header">{this.getPageTitle()}</h1>, this.getSubmenu()];
			content = (
				<div>
					<HelmetBuilder title={this.getPageTitle()} />
				</div>
			);
		}

		return (
			<div className="admin-game-page">
				<section className="page-header">
					<div className="container">
						<Link className="nav-card card" to="/admin/games">
							↩ Return to game list
						</Link>
						{header}
					</div>
				</section>
				{content}
			</div>
		);
	}
}

function mapStateToProps({ games }, ownProps) {
	const { slug } = ownProps.match.params;
	const { fullGames } = games;
	return { game: fullGames[slug] };
}
export default connect(
	mapStateToProps,
	{ fetchGame }
)(AdminGamePage);
