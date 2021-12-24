//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import * as Yup from "yup";

//Actions
import { updatePerson } from "~/client/actions/peopleActions";

//Components
import BasicForm from "../BasicForm";
import AdminPlayerGameList from "./AdminPlayerGameList";

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
			removeFromOocList: Yup.boolean().label("Remove from OOC list?"),
			position1: Yup.mixed().label("Main Position"),
			position2: Yup.mixed().label("Secondary Position"),
			otherPositions: Yup.mixed().label("Other Positions"),
			displayNicknameInCanvases: Yup.boolean().label("Display Nickname (or First Name) In Canvases"),
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

		this.state = { validationSchema, positions, showGameList: false };
	}

	static getDerivedStateFromProps(nextProps) {
		const { fullPeople, match } = nextProps;

		const newState = {};

		newState.person = fullPeople[match.params._id];

		return newState;
	}

	getInitialValues() {
		const { person } = this.state;

		const defaultValues = {
			contractedUntil: "",
			removeFromOocList: false,
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
						return person.playingPositions[i] || defaultValue;
					} else {
						return defaultValue;
					}
				case "otherPositions":
					if (person.playingPositions && person.playingPositions.length > 2) {
						/* prettier-ignore */
						const [/* main */, /* second */, ...otherPositions] = person.playingPositions;
						return otherPositions;
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
					{ name: "removeFromOocList", type: fieldTypes.boolean },
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
			const pregameOnly = _.chain(person.playedGames).groupBy("pregameOnly").value();
			const gamesPlayedString = [];
			if (pregameOnly.false) {
				gamesPlayedString.push(
					`Played in ${pregameOnly.false.length} ${pregameOnly.false.length == 1 ? "game" : "games"}`
				);
			}
			if (pregameOnly.true) {
				gamesPlayedString.push(
					`Named in ${pregameOnly.true.length} pregame ${pregameOnly.true.length == 1 ? "squad" : "squads"}`
				);
			}

			content.push(
				<strong
					className="full-span game-list-link"
					key="game-count"
					onClick={() => this.setState({ showGameList: true })}
				>
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
			return (
				<div className="form-card grid">
					{content}
					{this.renderGameList()}
				</div>
			);
		}
	}

	renderGameList() {
		const { person, showGameList } = this.state;
		if (showGameList) {
			return (
				<AdminPlayerGameList
					onDestroy={() => this.setState({ showGameList: false })}
					playedGames={person.playedGames}
				/>
			);
		}
	}

	alterValuesBeforeSubmit(values) {
		const positions = [values.position1, values.position2];
		if (values.otherPositions) {
			positions.push(...values.otherPositions);
		}

		values.playingPositions = _.filter(positions, _.identity);

		delete values.position1;
		delete values.position2;
		delete values.otherPositions;
	}

	render() {
		const { updatePerson } = this.props;
		const { person, validationSchema } = this.state;

		return (
			<div className="admin-player-details-page">
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
