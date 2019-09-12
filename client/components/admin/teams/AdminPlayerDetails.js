//Modules
import _ from "lodash";
import React from "react";
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

class AdminPlayerDetails extends BasicForm {
	constructor(props) {
		super(props);
		const validationSchema = Yup.object().shape({
			contractedUntil: Yup.number()
				.min(1895)
				.max(Number(new Date().getFullYear()) + 20)
				.label("Contracted Until"),
			position1: Yup.mixed().label("Main Position"),
			position2: Yup.mixed().label("Secondary Position"),
			position3: Yup.mixed().label("Third Position"),
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
		const { fullPeople, slugMap, match } = nextProps;

		const newState = {};

		const { slug } = match.params;
		const { id } = slugMap[slug];
		newState.person = fullPeople[id];

		return newState;
	}

	getDefaults() {
		const { person, positions } = this.state;

		let defaults = {
			contractedUntil: "",
			position1: "",
			position2: "",
			position3: "",
			displayNicknameInCanvases: false,
			squadNameWhenDuplicate: "",
			externalName: ""
		};

		return _.mapValues(defaults, (defaultValue, key) => {
			let i;
			switch (key) {
				case "position1":
				case "position2":
				case "position3":
					i = Number(key.replace(/\D/gi, "")) - 1;
					if (person.playingPositions) {
						return (
							_.find(positions, ({ value }) => value == person.playingPositions[i]) ||
							defaultValue
						);
					} else {
						return defaultValue;
					}

				default:
					return person[key] || defaultValue;
			}
		});
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

	async onSubmit(fValues) {
		const { person } = this.state;
		const { updatePerson } = this.props;
		const values = _.cloneDeep(fValues);

		values.playingPositions = [];
		for (let i = 1; i <= 3; i++) {
			const option = values[`position${i}`];
			if (option && option.value) {
				values.playingPositions.push(option.value);
			}

			delete values[`position${i}`];
		}

		updatePerson(person._id, values);
	}

	render() {
		const { positions } = this.state;
		return (
			<div className="container">
				<Formik
					validationSchema={this.state.validationSchema}
					onSubmit={values => this.onSubmit(values)}
					initialValues={this.getDefaults()}
					render={() => {
						const mainFields = [
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
								name: "position3",
								type: fieldTypes.select,
								isClearable: true,
								options: positions
							},
							{ name: "contractedUntil", type: fieldTypes.number },
							{ name: "displayNicknameInCanvases", type: fieldTypes.boolean },
							{ name: "squadNameWhenDuplicate", type: fieldTypes.text },
							{ name: "externalName", type: fieldTypes.text }
						];

						return (
							<Form>
								<div className="form-card grid">
									{this.renderFieldGroup(mainFields)}
									<div className="buttons">
										<button type="clear">Clear</button>
										<button type="submit" className="confirm">
											Save
										</button>
									</div>
								</div>
								{this.renderPlayerHistory()}
							</Form>
						);
					}}
				/>
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ people }) {
	const { fullPeople, slugMap } = people;
	return { fullPeople, slugMap };
}
// export default form;
export default connect(
	mapStateToProps,
	{ updatePerson }
)(AdminPlayerDetails);
