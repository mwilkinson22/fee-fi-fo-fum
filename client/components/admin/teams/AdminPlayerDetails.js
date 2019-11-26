//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Actions
import { updatePerson } from "~/client/actions/peopleActions";

//Components
import BasicForm from "../BasicForm";

//Constants
import playerPositions from "~/constants/playerPositions";
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminPlayerDetails extends Component {
	constructor(props) {
		super(props);
		const validationSchema = Yup.object().shape({
			contractedUntil: Yup.number()
				.min(1895)
				.max(Number(new Date().getFullYear()) + 20)
				.label("Contracted Until"),
			position1: Yup.mixed().label("Main Position"),
			position2: Yup.mixed().label("Secondary Position"),
			otherPositions: Yup.mixed().label("Other Positions"),
			displayNicknameInCanvases: Yup.boolean().label("Display Nickname In Canvases"),
			squadNameWhenDuplicate: Yup.string().label("Squad Name (when duplicate is found)"),
			externalName: Yup.string().label("External Name")
		});

		const positions = _.chain(playerPositions)
			.map(({ name }, key) => {
				if (key === "I") {
					return null;
				} else {
					return { label: name, value: key };
				}
			})
			.filter(_.identity)
			.value();

		this.state = { validationSchema, positions };
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullPeople, match } = nextProps;

		const newState = {};

		newState.person = fullPeople[match.params._id];

		return newState;
	}

	getInitialValues() {
		const { person, positions } = this.state;

		const defaultValues = {
			contractedUntil: "",
			position1: "",
			position2: "",
			otherPositions: [],
			displayNicknameInCanvases: false,
			squadNameWhenDuplicate: "",
			externalName: ""
		};

		return _.mapValues(defaultValues, (defaultValue, key) => {
			let i;
			switch (key) {
				case "position1":
				case "position2":
					i = Number(key.replace(/\D/gi, "")) - 1;
					if (person.playingPositions) {
						return (
							_.find(positions, ({ value }) => value == person.playingPositions[i]) ||
							defaultValue
						);
					} else {
						return defaultValue;
					}
				case "otherPositions":
					if (person.playingPositions) {
						const [first, second, ...otherPositions] = person.playingPositions;

						return otherPositions.map(pos =>
							_.find(positions, ({ value }) => value == pos)
						);
					} else {
						return defaultValue;
					}

				default:
					return person[key] || defaultValue;
			}
		});
	}

	getFieldGroups() {
		const { positions } = this.state;
		return [
			{
				fields: [
					{
						name: "position1",
						type: fieldTypes.select,
						isClearable: true,
						options: positions
					},
					{
						name: "position2",
						type: fieldTypes.select,
						isClearable: true,
						options: positions
					},
					{
						name: "otherPositions",
						type: fieldTypes.select,
						isMulti: true,
						isClearable: true,
						options: positions
					},
					{ name: "contractedUntil", type: fieldTypes.number },
					{ name: "displayNicknameInCanvases", type: fieldTypes.boolean },
					{ name: "squadNameWhenDuplicate", type: fieldTypes.text },
					{ name: "externalName", type: fieldTypes.text }
				]
			}
		];
	}

	renderPlayerHistory() {
		const { person } = this.state;
		const content = [<h6 key="header">Player History</h6>];

		//Get games
		if (person.playedGames) {
			const pregameOnly = _.chain(person.playedGames)
				.groupBy("pregameOnly")
				.value();
			const gamesPlayedString = [];
			if (pregameOnly.false) {
				gamesPlayedString.push(
					`Played in ${pregameOnly.false.length} ${
						pregameOnly.false.length == 1 ? "game" : "games"
					}`
				);
			}
			if (pregameOnly.true) {
				gamesPlayedString.push(
					`Named in ${pregameOnly.true.length} pregame ${
						pregameOnly.true.length == 1 ? "squad" : "squads"
					}`
				);
			}

			content.push(
				<strong className="full-span" key="game-count">
					{gamesPlayedString.map((a, i) => (i == 0 ? a : a.toLowerCase())).join(" and ")}
				</strong>
			);
		}

		if (person.squadEntries) {
			_.chain(person.squadEntries)
				.groupBy("year")
				.orderBy([s => s[0].year], ["desc"])
				.each(squads => {
					const year = squads[0].year;
					content.push(<label key={`${year}-squads`}>{year}</label>);
					const list = squads.map((s, i) => (
						<li key={i}>
							{s.number ? `#${s.number} - ` : ""}
							{s.team.name} {s._teamType.name}
						</li>
					));

					content.push(<ul key={`${year}-squads-list`}>{list}</ul>);
				})
				.value();
		}

		if (content.length > 1) {
			return <div className="form-card grid">{content}</div>;
		}
	}

	alterValuesBeforeSubmit(values) {
		values.playingPositions = [];
		for (let i = 1; i <= 2; i++) {
			values.playingPositions.push(values[`position${i}`]);
			delete values[`position${i}`];
		}
		values.playingPositions.push(...values.otherPositions);
		delete values.otherPositions;
	}

	render() {
		const { updatePerson } = this.props;
		const { person, validationSchema } = this.state;

		return (
			<div>
				<BasicForm
					alterValuesBeforeSubmit={this.alterValuesBeforeSubmit}
					fieldGroups={this.getFieldGroups()}
					initialValues={this.getInitialValues()}
					isNew={false}
					itemType="Player Details"
					onSubmit={values => updatePerson(person._id, values)}
					validationSchema={validationSchema}
				/>
				{this.renderPlayerHistory()}
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ people }) {
	const { fullPeople } = people;
	return { fullPeople };
}
// export default form;
export default connect(mapStateToProps, { updatePerson })(AdminPlayerDetails);
