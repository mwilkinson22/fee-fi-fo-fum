import _ from "lodash";
import React, { Component } from "react";
import { Link } from "react-router-dom";
import PersonImage from "./PersonImage";
import playerPositions from "~/constants/playerPositions";
import coachTypes from "~/constants/coachTypes";

export default class PersonCard extends Component {
	constructor(props) {
		super(props);
		const { person, coachingRole } = props;
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
		this.personType = personType;

		if (props.additionalData) {
			this.additionalData = props.additionalData;
		} else {
			switch (personType) {
				case "coach":
					if (coachingRole) {
						this.additionalData = (
							<div className="additional-data coaching-role">
								{coachTypes.find(({ key }) => key == coachingRole).name} Coach
							</div>
						);
					}
					break;
				case "player":
					if (person.playingPositions && person.playingPositions.length) {
						const positions = person.playingPositions.map(pos => (
							<span key={pos}>{playerPositions[pos].name}</span>
						));
						this.additionalData = (
							<div className="additional-data positions">{positions}</div>
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
				<div className={`person-card ${this.personType}`}>
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
