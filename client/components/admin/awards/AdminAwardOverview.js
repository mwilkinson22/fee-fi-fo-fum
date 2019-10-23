//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { Formik, Form, FieldArray } from "formik";
import * as Yup from "yup";

//Actions
import { createAward, updateAward, deleteAward } from "~/client/actions/awardActions";

//Components
import BasicForm from "../BasicForm";
import LoadingPage from "../../LoadingPage";
import DeleteButtons from "../fields/DeleteButtons";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

class AdminAwardOverview extends BasicForm {
	constructor(props) {
		super(props);

		this.state = {};
	}

	static getDerivedStateFromProps(nextProps) {
		const { awardsList, match } = nextProps;

		const award = awardsList[match.params._id];
		const newState = { award };

		newState.validationSchema = Yup.object().shape({
			year: Yup.number()
				.min(1895)
				.max(Number(new Date().getFullYear()))
				.test(
					"is-taken",
					"Awards for this year are already in place",
					year => award || !_.find(awardsList, a => a.year == year)
				)
				.required()
				.label("Year"),
			name: Yup.string().label("Name"),
			votingBeginsDate: Yup.date()
				.required()
				.label("Voting Begins (Date)"),
			votingBeginsTime: Yup.date()
				.required()
				.label("Voting Begins (Time)"),
			votingEndsDate: Yup.date()
				.required()
				.label("Voting Ends (Date)"),
			votingEndsTime: Yup.date()
				.required()
				.label("Voting Ends (Time)"),
			categories: Yup.array().of(Yup.string().required())
		});

		return newState;
	}

	getDefaults() {
		const { award } = this.state;

		//Set basics for new teams:
		let defaults = {
			year: "",
			name: "",
			votingBeginsDate: "",
			votingBeginsTime: "",
			votingEndsDate: "",
			votingEndsTime: ""
		};

		if (award) {
			defaults = _.mapValues(defaults, (val, key) => {
				switch (key) {
					case "votingBeginsDate":
					case "votingEndsDate":
						return award[key.replace("Date", "")].toString("yyyy-MM-dd");
					case "votingBeginsTime":
					case "votingEndsTime":
						return award[key.replace("Time", "")].toString("HH:mm");
					default:
						return award[key] || "";
				}
			});

			if (award.categories && award.categories.length) {
				defaults.categories = award.categories.map(({ _id }) => _id);
			}
		}

		return defaults;
	}

	renderCategorySorter(values) {
		const { award } = this.state;
		if (values.categories) {
			return (
				<div className="form-card">
					<h6>Categories</h6>
					<ul className="plain-list">
						<FieldArray
							name="categories"
							render={({ move }) => {
								return values.categories.map((id, i) => (
									<li key={id} className="award-category-sorter-row">
										<button
											type="button"
											className="down"
											disabled={i == values.categories.length - 1}
											onClick={() => move(i, i + 1)}
										>
											&#9660;
										</button>
										<button
											type="button"
											className="up"
											disabled={i == 0}
											onClick={() => move(i, i - 1)}
										>
											&#9650;
										</button>
										<div className="name">
											{award.categories.find(c => c._id == id).name}
										</div>
									</li>
								));
							}}
						/>
					</ul>
				</div>
			);
		}
	}

	async onSubmit(fValues) {
		const { award } = this.state;
		const { updateAward, createAward } = this.props;

		const values = _.cloneDeep(fValues);
		values.votingBegins = `${values.votingBeginsDate} ${values.votingBeginsTime}`;
		values.votingEnds = `${values.votingEndsDate} ${values.votingEndsTime}`;
		delete values.votingBeginsDate;
		delete values.votingBeginsTime;
		delete values.votingEndsDate;
		delete values.votingEndsTime;

		if (award) {
			updateAward(award._id, values);
		} else {
			const newId = await createAward(values);
			await this.setState({ redirect: `/admin/awards/${newId}` });
		}
	}

	async onDelete() {
		const { deleteAward } = this.props;
		const { award } = this.state;
		await deleteAward(award._id, () => this.setState({ redirect: "/admin/awards" }));
	}

	render() {
		const { redirect, isLoading, award } = this.state;

		if (redirect) {
			return <Redirect to={redirect} />;
		}

		if (isLoading) {
			return <LoadingPage />;
		}

		return (
			<div className="container">
				<Formik
					validationSchema={this.state.validationSchema}
					onSubmit={values => this.onSubmit(values)}
					initialValues={this.getDefaults()}
					render={({ values }) => {
						const fields = [
							{ name: "year", type: fieldTypes.number },
							{ name: "name", type: fieldTypes.text },
							{ name: "votingBeginsDate", type: fieldTypes.date },
							{ name: "votingBeginsTime", type: fieldTypes.time },
							{ name: "votingEndsDate", type: fieldTypes.date },
							{ name: "votingEndsTime", type: fieldTypes.time }
						];

						let deleteButtons;
						if (award) {
							deleteButtons = (
								<div className="form-card grid">
									<DeleteButtons onDelete={() => this.onDelete()} />
								</div>
							);
						}

						return (
							<Form>
								<div className="form-card grid">
									{this.renderFieldGroup(fields)}
								</div>
								{this.renderCategorySorter(values)}
								<div className="form-card grid">
									<div className="buttons">
										<button type="clear">Clear</button>
										<button type="submit" className="confirm">
											{award ? "Update" : "Add"} Awards
										</button>
									</div>
								</div>
								{deleteButtons}
							</Form>
						);
					}}
				/>
			</div>
		);
	}
}

//Add Redux Support
function mapStateToProps({ awards }) {
	const { awardsList } = awards;
	return { awardsList };
}
// export default form;
export default connect(
	mapStateToProps,
	{ createAward, updateAward, deleteAward }
)(AdminAwardOverview);
