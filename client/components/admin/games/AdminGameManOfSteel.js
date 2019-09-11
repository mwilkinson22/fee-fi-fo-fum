//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Form, Formik } from "formik";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";

//Actions
import { setManOfSteelPoints } from "~/client/actions/gamesActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { convertTeamToSelect } from "~/helpers/gameHelper";

class AdminGameManOfSteel extends BasicForm {
	constructor(props) {
		super(props);

		//Get Team Options
		const options = convertTeamToSelect(props.game, props.teamList);

		//Get Validation Schema
		const fieldValidation = Yup.object()
			.required()
			.test("isUnique", "Player selected twice", function({ value }) {
				return (
					_.chain(this.parent)
						.map("value")
						.filter(o => o == value)
						.value().length <= 1
				);
			});

		const validationSchema = Yup.object().shape({
			manOfSteel: Yup.object().shape({
				1: fieldValidation.label("1 Point"),
				2: fieldValidation.label("2 Points"),
				3: fieldValidation.label("3 Points")
			})
		});

		this.state = { options, validationSchema };
	}

	getDefaults() {
		const { game } = this.props;
		const options = _.chain(this.state.options)
			.map(({ options }) => [...options])
			.flatten()
			.value();

		const currentPoints = _.chain(game.manOfSteel)
			.keyBy("points")
			.mapValues("_player")
			.value();

		const defaults = {
			manOfSteel: {}
		};
		for (let i = 1; i <= 3; i++) {
			defaults.manOfSteel[i] = _.find(options, o => o.value == currentPoints[i]) || "";
		}
		return defaults;
	}

	async onSubmit({ manOfSteel }) {
		const { setManOfSteelPoints, game } = this.props;
		await setManOfSteelPoints(game._id, _.mapValues(manOfSteel, "value"));
	}

	render() {
		const { options, validationSchema } = this.state;
		return (
			<div className="container">
				<Formik
					initialValues={this.getDefaults()}
					onSubmit={values => this.onSubmit(values)}
					validationSchema={validationSchema}
					render={() => {
						const fields = [];
						for (let i = 3; i > 0; i--) {
							fields.push({
								name: `manOfSteel.${i}`,
								type: fieldTypes.select,
								options
							});
						}

						return (
							<Form>
								<div className="form-card grid">
									{this.renderFieldGroup(fields)}
									<div className="buttons">
										<button type="reset">Reset</button>
										<button type="submit">Update</button>
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

function mapStateToProps({ config, teams }) {
	const { localTeam } = config;
	const { teamList } = teams;
	return { localTeam, teamList };
}

export default connect(
	mapStateToProps,
	{ setManOfSteelPoints }
)(AdminGameManOfSteel);
