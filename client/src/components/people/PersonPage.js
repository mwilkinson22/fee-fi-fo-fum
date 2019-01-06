import React, { Component } from "react";
import { connect } from "react-redux";
import LoadingPage from "../LoadingPage";
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
				<a href={`https://www.twitter.com/${twitter}`} className="twitter" target="_blank">
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

	getInfoTable() {
		const { person } = this.props;
		const { playerDetails } = person;
		const data = {};
		if (person.dateOfBirth) {
			const dob = new Date(person.dateOfBirth);
			const today = new Date();
			const age = Math.abs(today.getTime() - dob.getTime());

			data["Date of Birth"] = dob.toString("dd/MM/yyyy");
			data["Age"] = Math.floor(age / (1000 * 3600 * 24 * 365));
		}

		if (person.nickname) {
			data["Nickname"] = person.nickname;
		}

		if (person._hometown) {
			data["From"] = person._hometown;
		}

		if (person._represents) {
			data["Represents"] = person._represents;
		}

		console.log(playerDetails.contractEnds);
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
			<table className="info-table">
				<tbody>{rows}</tbody>
			</table>
		);
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
								<div className="main-position">
									{person.playerDetails.mainPosition}
								</div>
							</div>
						</div>
					</section>
					<section className="person-data">
						<div className="container">{this.getInfoTable()}</div>
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
