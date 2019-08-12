//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import { Formik, Form } from "formik";
import * as Yup from "yup";

//Components
import BasicForm from "../components/admin/BasicForm";
import NotFoundPage from "./NotFoundPage";
import LoadingPage from "../components/LoadingPage";
import DeleteButtons from "../components/admin/fields/DeleteButtons";
import HelmetBuilder from "~/client/components/HelmetBuilder";

//Actions
import {
	fetchCompetitions,
	createCompetition,
	updateCompetition,
	deleteCompetition
} from "~/client/actions/competitionActions";

//Constants
const competitionTypes = require("~/constants/competitionTypes");

class AdminCompetitionPage extends BasicForm {
	constructor(props) {
		super(props);

		const { competitionList, fetchCompetitions } = props;

		if (!competitionList) {
			fetchCompetitions();
		}

		const options = {
			type: competitionTypes.sort().map(a => ({ value: a, label: a })),
			webcrawlFormat: [{ value: "RFL", label: "RFL" }, { value: "SL", label: "Super League" }]
		};

		this.state = { options };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { competitionList, match } = nextProps;
		const newState = { isLoading: false };

		//Create Or Edit
		newState.isNew = !match.params._id;

		//Remove redirect after creation/deletion
		if (prevState.redirect == match.url) {
			newState.redirect = false;
		}

		//Check Everything is loaded
		if (!newState.isNew && !competitionList) {
			newState.isLoading = true;
			return newState;
		}

		//Create Validation Schema
		newState.validationSchema = Yup.object().shape({
			name: Yup.string()
				.required()
				.label("Name"),
			type: Yup.mixed()
				.required()
				.label("Type"),
			playerLimit: Yup.number().label("Max Players Per Game"),
			useAllSquads: Yup.boolean().label("Use All Squads"),
			webcrawlFormat: Yup.mixed().label("Web Crawl Format"),
			webcrawlUrl: Yup.string().label("Web Crawl Root URL")
		});

		//Get Current Competition
		if (!newState.isNew) {
			newState.competition = competitionList[match.params._id] || false;
		}

		return newState;
	}

	getDefaults() {
		const { competition, isNew, options } = this.state;

		if (isNew) {
			return {
				name: "",
				type: "",
				playerLimit: 17,
				useAllSquads: false,
				webcrawlFormat: "",
				webcrawlUrl: ""
			};
		} else {
			return _.mapValues(_.clone(competition), (v, key) => {
				switch (key) {
					case "type":
					case "webcrawlFormat":
						return options[key].find(({ value }) => value == v) || "";
					default:
						return v != undefined ? v : "";
				}
			});
		}
	}

	async handleSubmit(fValues) {
		const { createCompetition, updateCompetition } = this.props;
		const { competition, isNew } = this.state;
		const values = _.chain(fValues)
			.cloneDeep()
			.mapValues(v => (v.value === undefined ? v : v.value))
			.mapValues(v => (v !== "" ? v : null))
			.value();

		if (isNew) {
			const newId = await createCompetition(values);
			await this.setState({ redirect: `/admin/competitions/${newId}` });
		} else {
			await updateCompetition(competition._id, values);
		}
	}

	async handleDelete() {
		const { deleteCompetition } = this.props;
		const { competition } = this.state;
		const success = await deleteCompetition(competition._id);
		if (success) {
			this.setState({ isDeleted: true, redirect: "/admin/competitions" });
		}
	}

	renderDeleteButtons() {
		if (!this.state.isNew) {
			return (
				<div className="form-card">
					<DeleteButtons onDelete={() => this.handleDelete()} />
				</div>
			);
		}
	}

	render() {
		const { redirect, competition, isNew, isLoading, validationSchema, options } = this.state;

		if (redirect) {
			return <Redirect to={redirect} />;
		}

		if (isLoading) {
			return <LoadingPage />;
		}
		if (!isNew && competition === false) {
			return <NotFoundPage message="Competition not found" />;
		}

		const title = isNew ? "Add New Competition" : competition.name;
		return (
			<div className="admin-competition-page">
				<HelmetBuilder title={title} />
				<section className="page-header">
					<div className="container">
						<h1>{title}</h1>
					</div>
				</section>
				<section className="form">
					<div className="container">
						<Formik
							onSubmit={values => this.handleSubmit(values)}
							initialValues={this.getDefaults()}
							validationSchema={validationSchema}
							render={() => {
								const fields = [
									{ name: "name", type: "text" },
									{ name: "type", type: "Select", options: options.type },
									{ name: "playerLimit", type: "number" },
									{ name: "useAllSquads", type: "Boolean" },
									{
										name: "webcrawlFormat",
										type: "Select",
										options: options.webcrawlFormat,
										isClearable: true,
										placeholder: "None"
									},
									{
										name: "webcrawlUrl",
										type: "text"
									}
								];

								return (
									<Form>
										<div className="card form-card grid">
											{this.renderFieldGroup(fields)}
											<div className="buttons">
												<button type="reset">Reset</button>
												<button type="submit">
													{isNew ? "Add" : "Update"} Competition
												</button>
											</div>
										</div>
										{this.renderDeleteButtons()}
									</Form>
								);
							}}
						/>
					</div>
				</section>
			</div>
		);
	}
}

function mapStateToProps({ competitions }) {
	const { competitionList } = competitions;
	return { competitionList };
}

export default connect(
	mapStateToProps,
	{
		fetchCompetitions,
		createCompetition,
		updateCompetition,
		deleteCompetition
	}
)(AdminCompetitionPage);
