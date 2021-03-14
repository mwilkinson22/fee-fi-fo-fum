//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

//Components
import LoadingPage from "../components/LoadingPage";
import PlayerStatSection from "../components/people/PlayerStatSection";
import PersonImage from "../components/people/PersonImage";
import HelmetBuilder from "../components/HelmetBuilder";
import NotFoundPage from "./NotFoundPage";
import ErrorBoundary from "../components/ErrorBoundary";

//Actions
import { fetchPersonFromSlug } from "../actions/peopleActions";

//Constants
import playerPositions from "~/constants/playerPositions";

//Helpers
import { hasConnectionToTeam } from "~/helpers/peopleHelper";

class PersonPage extends Component {
	constructor(props) {
		super(props);
		const { slugMap, fetchPersonFromSlug, match } = props;

		//Get Person
		const { slug } = match.params;
		if (slugMap[slug] === undefined) {
			fetchPersonFromSlug(slug);
		}

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { slugMap, fullPeople, match, localTeam, authUser } = nextProps;
		const { slug } = match.params;
		const newState = {};

		//Ensure Slug map is loaded
		if (slugMap[slug] !== undefined) {
			//We've had a result from fetchPersonFromSlug
			if (slugMap[slug] === false) {
				//404
				newState.person = false;
			} else {
				const _id = slugMap[slug];
				const person = fullPeople[_id];

				//Always display for admins
				if (authUser && authUser.isAdmin) {
					newState.person = person;
				} else {
					//Otherwise Ensure they have a connection to the local team
					if (hasConnectionToTeam(person, localTeam)) {
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
		const { bucketPaths } = this.props;
		const { twitter, instagram } = this.state.person;
		const social = [];

		if (twitter) {
			social.push(
				<a
					key="twitter"
					href={`https://www.twitter.com/${twitter}`}
					className="twitter"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img src={`${bucketPaths.images.layout}icons/twitter.svg`} alt="Twitter Logo" />@{twitter}
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
					<img src={`${bucketPaths.images.layout}icons/instagram.svg`} alt="Instagram Logo" />@{instagram}
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
					<Link to={`/admin/people/${person._id}`} className="nav-card">
						Edit {person.name.first}
					</Link>
				</div>
			);
		}
	}

	getPersonDataSection() {
		const sections = [this.getInfoTable()];
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
		const { bucketPaths, localTeam } = this.props;
		const { person } = this.state;
		const { contractedUntil, dateOfBirth, nickname, _hometown, _represents, _sponsor, squadEntries } = person;
		const data = {};

		if (squadEntries) {
			const year = new Date().getFullYear();
			const lastSquadEntry = squadEntries.find(s => s.team._id == localTeam && s.year >= year && s.number);
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
						<img src={`${bucketPaths.images.layout}icons/twitter.svg`} alt="Twitter Logo" />
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

		if (typeof window === "undefined") {
			//Prevent server-side loading of games
			return null;
		}

		if (!person.playedGames) {
			return null;
		}

		const playedGames = person.playedGames
			.filter(g => !g.pregameOnly && g.forLocalTeam && g.squadsAnnounced && new Date(g.date) < new Date())
			.map(g => g._id);

		if (playedGames.length) {
			return (
				<ErrorBoundary
					parentState={this.state}
					parentProps={this.props}
					additionalData={{ person, playedGames }}
				>
					<PlayerStatSection person={person} playedGames={playedGames} />
				</ErrorBoundary>
			);
		}
	}

	render() {
		const { bucketPaths, match, useWebp } = this.props;
		const { person } = this.state;
		const role = match.url.split("/")[1]; //players or coaches

		let imageVariant = "main";
		if (role === "players") {
			imageVariant = "player";
		}
		if (role === "coaches") {
			imageVariant = "coach";
		}

		if (person === undefined) {
			return <LoadingPage />;
		} else if (!person) {
			return <NotFoundPage message="Person not found" />;
		} else {
			//Determine Meta Info
			let cardImage;
			let cardType = "summary";
			if (person.images.midpage) {
				cardImage = bucketPaths.images.people + "midpage/" + person.images.midpage;
				cardType = "summary_large_image";
			} else if (person.images[imageVariant] || person.images.main) {
				cardImage = bucketPaths.images.people + "full/" + (person.images[imageVariant] || person.images.main);
			}

			return (
				<div className={`person-page`}>
					<HelmetBuilder
						title={`${person.name.first} ${person.name.last}`}
						canonical={`/${person.isCoach ? "coaches" : "players"}/${person.slug}`}
						cardImage={cardImage}
						cardType={cardType}
					/>
					<section className="header">
						<div
							className="background"
							style={{
								backgroundImage: `url('${bucketPaths.images.layout}john-smiths${
									useWebp ? ".webp" : "jpg"
								}')`
							}}
						/>
						<div className="container">
							<PersonImage person={person} variant={imageVariant} />
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

function mapStateToProps({ config, people }) {
	const { authUser, bucketPaths, localTeam, webp } = config;
	const { fullPeople, slugMap } = people;
	return {
		authUser,
		bucketPaths,
		localTeam,
		fullPeople,
		slugMap,
		useWebp: webp
	};
}

async function loadData(store, path) {
	const slug = path.split("/")[2];

	return store.dispatch(fetchPersonFromSlug(slug));
}

export default {
	component: connect(mapStateToProps, {
		fetchPersonFromSlug
	})(PersonPage),
	loadData
};
