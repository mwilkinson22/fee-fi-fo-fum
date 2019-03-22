import React, { Component } from "react";
import { Link } from "react-router-dom";
import PersonImage from "./PersonImage";
import playerPositions from "~/constants/playerPositions";

export default class PersonCard extends Component {
	constructor(props) {
		super(props);
		const { person } = props;
		const roles = ["referee", "coach", "player"];
		let { personType } = props;
		if (!personType || roles.indexOf(personType) < 0) {
			if (person.isReferee) {
				personType = "referee";
			} else if (person.isCoach) {
				personType = "coach";
			} else {
				personType = "player";
			}
		}

		if (props.additionalData) {
			this.additionalData = props.additionalData;
		} else {
			switch (personType) {
				case "player":
					if (person.playerDetails.mainPosition) {
						this.additionalData = (
							<div className="additional-data positions">
								{playerPositions[person.playerDetails.mainPosition].name}
							</div>
						);
					}
					break;
				default:
					this.additionalData = null;
					break;
			}
		}
	}

	render() {
		const { person, number } = this.props;
		const { slug, name } = person;
		return (
			<Link className="person-card-wrapper" to={`/players/${slug}`}>
				<div className="person-card">
					<div className="trim">{number}</div>
					<div className="main">
						<h4 className="name">
							{name.first}
							<span>{name.last}</span>
						</h4>
						{this.additionalData}
					</div>
					<div className="person-image-wrapper">
						<PersonImage person={person} />
					</div>
				</div>
			</Link>
		);
	}
}
