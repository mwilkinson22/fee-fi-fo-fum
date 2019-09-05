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
								type: "Select",
								isClearable: true,
								options: positions
							},
							{
								name: "position2",
								type: "Select",
								isClearable: true,
								options: positions
							},
							{
								name: "position3",
								type: "Select",
								isClearable: true,
								options: positions
							},
							{ name: "contractedUntil", type: "number" },
							{ name: "displayNicknameInCanvases", type: "Boolean" },
							{ name: "squadNameWhenDuplicate", type: "text" },
							{ name: "externalName", type: "text" }
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
