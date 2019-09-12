//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link, Redirect } from "react-router-dom";

//Components
import LoadingPage from "../components/LoadingPage";
import PlayerStatSection from "../components/people/PlayerStatSection";
import PersonImage from "../components/people/PersonImage";
import HelmetBuilder from "../components/HelmetBuilder";
import NotFoundPage from "./NotFoundPage";

//Actions
import { fetchPerson, fetchPeopleList } from "../actions/peopleActions";
import { fetchGameList, fetchGames } from "../actions/gamesActions";

//Constants
import { layoutImagePath } from "../extPaths";
import playerPositions from "~/constants/playerPositions";
const { earliestGiantsData } = require("~/config/keys");

//Helpers
import { matchSlugToItem } from "~/helpers/routeHelper";

class PersonPage extends Component {
	constructor(props) {
		super(props);
		const { peopleList, fetchPeopleList, gameList, fetchGameList } = props;

		if (!peopleList) {
			fetchPeopleList();
		}

		if (!gameList) {
			fetchGameList();
		}

		this.state = { activeFilters: {} };
	}

	static getDerivedStateFromProps(nextProps) {
		const { peopleList, redirects, fullPeople, fetchPerson, match, localTeam } = nextProps;
		const { slug } = match.params;
		const newState = { redirect: null };

		//Ensure Slugmap is loaded
		if (peopleList) {
			const { item, redirect } = matchSlugToItem(slug, peopleList, redirects);

			if (redirect) {
				const role = item.isCoach ? "coaches" : "players";
				newState.redirect = `/${role}/${item.slug}`;
			} else if (!item) {
				newState.person = false;
			} else {
				const { _id } = item;

				if (!fullPeople[_id]) {
					fetchPerson(_id);
				} else {
					const person = fullPeople[_id];

					//Ensure they have a connection to the Giants
					const localTeamSquads =
						person.squadEntries &&
						person.squadEntries.find(s => s.team._id == localTeam);
					if (localTeamSquads) {
						newState.person = person;
					} else {
						newState.person = false;
					}
				}
			}
		}

		return newState;
	}

	getSocial() {
		const social = [];
		const { twitter, instagram } = this.state.person;
		if (twitter) {
			social.push(
				<a
					key="twitter"
					href={`https://www.twitter.com/${twitter}`}
					className="twitter"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img src={`${layoutImagePath}icons/twitter.svg`} alt="Twitter Logo" />@{twitter}
				</a>
			);
		}
		if (instagram) {
			social.push(
				<a
					key="insta"
					href={`https://www.instagram.com/${instagram}`}
					className="instagram"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img src={`${layoutImagePath}icons/instagram.svg`} alt="Instagram Logo" />@
					{instagram}
				</a>
			);
		}
		if (social.length) {
			return <div className="social">{social}</div>;
		} else {
			return null;
		}
	}

	getPositions() {
		const { person } = this.state;
		const rolesAndPositions = [];
		if (person.isCoach) {
			rolesAndPositions.push("Coach");
		}

		if (person.isReferee) {
			rolesAndPositions.push("Referee");
		}

		if (person.isPlayer && person.playingPositions && person.playingPositions.length) {
			person.playingPositions.forEach(position => {
				rolesAndPositions.push(playerPositions[position].name);
			});
		}

		if (rolesAndPositions.length) {
			const allPositions = rolesAndPositions.map(position => {
				return (
					<div key={position} className="position">
						{position}
					</div>
				);
			});

			return <div className="positions">{allPositions}</div>;
		} else {
			return null;
		}
	}

	getEditLink() {
		const { person } = this.state;
		const { authUser } = this.props;

		if (authUser) {
			return (
				<div className="container">
					<Link to={`/admin/people/${person.slug}`} className="nav-card">
						Edit {person.name.first}
					</Link>
				</div>
			);
		}
	}

	getPersonDataSection() {
		const sections = [this.getInfoTable() /* , this.getDescription() */];
		const sectionCount = _.filter(sections, _.identity).length;
		if (sectionCount) {
			return (
				<section className="person-data">
					<div className="container">{sections}</div>
				</section>
			);
		} else {
			return null;
		}
	}

	getInfoTable() {
		const { localTeam } = this.props;
		const { person } = this.state;
		const {
			contractedUntil,
			dateOfBirth,
			nickname,
			_hometown,
			_represents,
			_sponsor,
			squadEntries
		} = person;
		const data = {};

		if (squadEntries) {
			const year = new Date().getFullYear();
			const lastSquadEntry = squadEntries.find(
				s => s.team._id == localTeam && s.year >= year && s.number
			);
			if (lastSquadEntry) {
				data["Squad Number"] = lastSquadEntry.number;
			}
		}

		if (dateOfBirth) {
			const today = new Date();
			const age = Math.abs(today.getTime() - dateOfBirth.getTime());

			data["Date of Birth"] = dateOfBirth.toString("dS MMMM yyyy");
			data["Age"] = Math.floor(age / (1000 * 3600 * 24 * 365));
		}

		if (nickname) {
			data["AKA"] = nickname;
		}

		if (_hometown) {
			data["From"] = `${_hometown.name}, ${_hometown._country.name}`;
		}

		if (_represents) {
			data["Represents"] = _represents.name;
		}

		if (contractedUntil && contractedUntil >= new Date().getFullYear()) {
			data["Contracted Until"] = contractedUntil;
		}

		if (_sponsor) {
			//Format name as text or link
			let name;
			if (_sponsor.url) {
				name = (
					<a href={`${_sponsor.url}`} target="_blank" rel="noopener noreferrer">
						{_sponsor.name}
					</a>
				);
			} else {
				name = _sponsor.name;
			}

			let twitter;
			if (_sponsor.twitter) {
				twitter = (
					<a
						key="twitter"
						href={`https://www.twitter.com/${_sponsor.twitter}`}
						className="twitter"
						target="_blank"
						rel="noopener noreferrer"
					>
						<img src={`${layoutImagePath}icons/twitter.svg`} alt="Twitter Logo" />
					</a>
				);
			}
			data["Sponsor"] = (
				<div>
					{twitter}
					{name}
				</div>
			);
		}

		const rows = _.map(data, (value, field) => {
			return (
				<tr key={field}>
					<th>{field}</th>
					<td>{value}</td>
				</tr>
			);
		});
		if (rows.length) {
			return (
				<div className="info-table" key="info-table">
					<table>
						<tbody>{rows}</tbody>
					</table>
				</div>
			);
		} else {
			return null;
		}
	}

	getPlayerStatsSection() {
		const { person } = this.state;
		const { gameList } = this.props;

		if (!person.playedGames) {
			return null;
		}

		if (!gameList) {
			return <LoadingPage />;
		}

		const playedGames = person.playedGames
			.filter(g => !g.pregameOnly && g.forLocalTeam)
			.map(g => gameList[g._id])
			.filter(g => Number(g.date.getFullYear()) >= earliestGiantsData);

		if (playedGames.length) {
			return <PlayerStatSection person={person} playedGames={playedGames} />;
		}
	}

	getDescription() {
		const { person } = this.state;
		if (person.description) {
			return (
				<div className="description" key="description">
					{person.description.map((para, i) => (
						<p key={i}>{para}</p>
					))}
				</div>
			);
		} else {
			return null;
		}
	}

	render() {
		const { match } = this.props;
		const { person, redirect } = this.state;
		const role = match.url.split("/")[1]; //players or coaches

		if (redirect) {
			return <Redirect to={redirect} />;
		} else if (person === undefined) {
			return <LoadingPage />;
		} else if (!person) {
			return <NotFoundPage message="Person not found" />;
		} else {
			return (
				<div className={`person-page`}>
					<HelmetBuilder
						title={`${person.name.first} ${person.name.last}`}
						canonical={`/${person.isCoach ? "coaches" : "players"}/${person.slug}`}
					/>
					<section className="header">
						<div className="background" />
						<div className="container">
							<PersonImage person={person} />
							<div className="overlay">
								<h1>
									{person.name.first}
									&nbsp;
									<span>{person.name.last}</span>
								</h1>
								{this.getPositions()}
								{this.getSocial()}
							</div>
						</div>
					</section>
					{this.getEditLink()}
					{this.getPersonDataSection()}
					{this.getPlayerStatsSection()}
				</div>
			);
		}
	}
}

function mapStateToProps({ config, games, people }) {
	const { authUser, localTeam } = config;
	const { gameList } = games;
	const { fullPeople, redirects, peopleList } = people;
	return { authUser, localTeam, gameList, fullPeople, redirects, peopleList };
}

async function loadData(store, path) {
	const slug = path.split("/")[2];

	await store.dispatch(fetchPeopleList());

	const { peopleList, redirects } = store.getState().people;

	const { item } = matchSlugToItem(slug, peopleList, redirects);

	if (item) {
		return store.dispatch(fetchPerson(item._id));
	}
}

export default {
	component: connect(
		mapStateToProps,
		{ fetchPerson, fetchPeopleList, fetchGameList, fetchGames }
	)(PersonPage),
	loadData
};
