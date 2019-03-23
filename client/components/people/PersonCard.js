import _ from "lodash";
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

		//Shrink Long Names
		let longName = false;
		_.each(name, n => {
			let width = 0;
			for (let i = 0; i < n.length; i++) {
				switch (n[i].toLowerCase()) {
					case "i":
					case "-":
					case " ":
						width += 1;
						break;
					default:
						width += 2;
						break;
				}
			}
			if (width > 20) {
				longName = true;
			}
		});
		return (
			<Link className="person-card-wrapper" to={`/players/${slug}`}>
				<div className="person-card">
					<div className="trim">{number}</div>
					<div className="main">
						<h4 className={`name ${longName ? "long" : ""}`}>
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
