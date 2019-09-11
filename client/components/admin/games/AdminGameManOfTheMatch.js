//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Form, Formik } from "formik";
import * as Yup from "yup";

//Components
import BasicForm from "../BasicForm";

//Actions
import { setMotm } from "~/client/actions/gamesActions";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { convertTeamToSelect } from "~/helpers/gameHelper";

class AdminGameManOfTheMatch extends BasicForm {
	constructor(props) {
		super(props);

		const { game, teamList, localTeam } = props;

		const motmOptions = convertTeamToSelect(game, teamList, false, true);
		const fanMotmOptions = convertTeamToSelect(game, teamList, localTeam, true);

		const validationSchema = Yup.object().shape({
			_motm: Yup.object().label("Man of the Match"),
			_fan_motm: Yup.object().label("Fans' Man of the Match"),
			fan_motm_link: Yup.string().label("Poll Link")
		});

		this.state = { motmOptions, fanMotmOptions, validationSchema };
	}

	getDefaults() {
		const { game } = this.props;
		const { motmOptions, fanMotmOptions } = this.state;
		return {
			_motm:
				_.find(motmOptions[1].options, p => p.value == game._motm) ||
				_.find(motmOptions[2].options, p => p.value == game._motm) ||
				motmOptions[0],
			_fan_motm: _.find(fanMotmOptions, p => p.value == game._fan_motm) || fanMotmOptions[0],
			fan_motm_link: game.fan_motm_link || ""
		};
	}

	async onSubmit(values) {
		const { _motm, _fan_motm, fan_motm_link } = values;
		const { game, setMotm } = this.props;
		const newValues = {
			_motm: _motm.value || null,
			_fan_motm: _fan_motm.value || null,
			fan_motm_link: fan_motm_link ? fan_motm_link.split("/").pop() : null
		};
		await setMotm(game._id, newValues);
	}

	render() {
		const { motmOptions, fanMotmOptions } = this.state;
		return (
			<div className="container">
				<Formik
					initialValues={this.getDefaults()}
					onSubmit={values => this.onSubmit(values)}
					validationSchema={this.state.validationSchema}
					render={() => {
						const fields = [
							{ name: "_motm", type: fieldTypes.select, options: motmOptions },
							{ name: "_fan_motm", type: fieldTypes.select, options: fanMotmOptions },
							{ name: "fan_motm_link", type: fieldTypes.text }
						];

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
	{ setMotm }
)(AdminGameManOfTheMatch);
