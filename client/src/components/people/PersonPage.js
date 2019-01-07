import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "../LoadingPage";
import Parser from "html-react-parser";
// import { Link } from "react-router-dom";
import { personImagePath, layoutImagePath } from "../../extPaths";
import { fetchPersonBySlug } from "../../actions/peopleActions";
import { Helmet } from "react-helmet";
import { localUrl } from "../../extPaths";
import "datejs";
import _ from "lodash";

class PersonCard extends Component {
	constructor(props) {
		super(props);
		const { person } = this.props;
		if (!person) {
			this.props.fetchPersonBySlug(this.props.match.params.slug);
		}
	}

	getSocial() {
		const social = [];
		const { twitter, instagram } = this.props.person;
		if (twitter) {
			social.push(
				<a
					href={`https://www.twitter.com/${twitter}`}
					className="twitter"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img src={`${layoutImagePath}twitter.svg`} alt="Twitter Logo" />@{twitter}
				</a>
			);
		}
		if (instagram) {
			social.push(
				<a
					href={`https://www.instagram.com/${instagram}`}
					className="instagram"
					target="_blank"
					rel="noopener noreferrer"
				>
					<img src={`${layoutImagePath}instagram.svg`} alt="Instagram Logo" />@{instagram}
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
		const { person } = this.props;
		if (person.isPlayer) {
			const { mainPosition, otherPositions } = person.playerDetails;
			const results = [];
			if (mainPosition) {
				results.push(
					<div key="main" className="position main-position">
						{mainPosition}
					</div>
				);
			}
			if (otherPositions) {
				results.push(
					<div key="other" className="position other-position">
						{otherPositions.join(", ")}
					</div>
				);
			}

			console.log(results);
			return results;
		} else {
			return null;
		}
	}

	getInfoTable() {
		const { person } = this.props;
		const { playerDetails } = person;
		const data = {};
		if (person.dateOfBirth) {
			const dob = new Date(person.dateOfBirth);
			const today = new Date();
			const age = Math.abs(today.getTime() - dob.getTime());

			data["Date of Birth"] = dob.toString("dS MMMM yyyy");
			data["Age"] = Math.floor(age / (1000 * 3600 * 24 * 365));
		}

		if (person.nickname) {
			data["AKA"] = person.nickname;
		}

		if (person._hometown) {
			const town = person._hometown;
			data["From"] = `${town.name}, ${town._country.name}`;
		}

		if (person._represents) {
			data["Represents"] = person._represents.name;
		}

		if (playerDetails.contractEnds && playerDetails.contractEnds >= new Date().getFullYear()) {
			data["Contracted Until"] = playerDetails.contractEnds;
		}

		const rows = _.map(data, (value, field) => {
			return (
				<tr key={field}>
					<th>{field}</th>
					<td>{value}</td>
				</tr>
			);
		});
		return (
			<div className="info-table">
				<table>
					<tbody>{rows}</tbody>
				</table>
			</div>
		);
	}

	getDescription() {
		const { person } = this.props;
		if (person.description) {
			return <div className="description">{Parser(person.description)}</div>;
		} else {
			return null;
		}
	}

	render() {
		const { person } = this.props;
		if (person) {
			return (
				<div className={`person-page`}>
					<Helmet>
						<title>
							{person.name.first} {person.name.last} - Fee Fi Fo Fum
						</title>
						<link
							rel="canonical"
							href={`${localUrl}/${person.isCoach ? "coaches" : "players"}/${
								person.slug
							}`}
						/>
					</Helmet>
					<section className="header">
						<div className="background" />
						<div className="container">
							<img
								className="image"
								src={`${personImagePath}${person.image}`}
								alt={`${person.name.first} ${person.name.last}`}
							/>
							<div className="overlay">
								<h1>
									{person.name.first}
									<span>{person.name.last}</span>
								</h1>
								{this.getSocial()}
								{this.getPositions()}
							</div>
						</div>
					</section>
					<section className="person-data">
						<div className="container">
							{this.getInfoTable()}
							{this.getDescription()}
						</div>
					</section>
				</div>
			);
		} else {
			return <LoadingPage />;
		}
	}
}

function mapStateToProps({ people }, ownProps) {
	const { slug } = ownProps.match.params;
	return { person: people[slug], ...ownProps };
}

export default connect(
	mapStateToProps,
	{ fetchPersonBySlug }
)(PersonCard);
