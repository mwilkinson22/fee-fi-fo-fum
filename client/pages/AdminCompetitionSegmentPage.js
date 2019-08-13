//Modules
import _ from "lodash";
import React from "react";
import { connect } from "react-redux";
import { Link, Redirect } from "react-router-dom";
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
	fetchCompetitionSegments,
	createCompetitionSegment,
	updateCompetitionSegment,
	deleteCompetitionSegment
} from "~/client/actions/competitionActions";

//Constants
const competitionTypes = require("~/constants/competitionTypes");

class AdminCompetitionPage extends BasicForm {
	constructor(props) {
		super(props);

		const {
			competitionList,
			fetchCompetitions,
			competitionSegmentList,
			fetchCompetitionSegments,
			teamTypes
		} = props;

		if (!competitionList) {
			fetchCompetitions();
		}

		if (!competitionSegmentList) {
			fetchCompetitionSegments();
		}

		const options = {
			type: competitionTypes.sort().map(a => ({ value: a, label: a })),
			_teamType: _.chain(teamTypes)
				.sortBy("sortOrder")
				.map(t => ({ value: t._id, label: t.name }))
				.value()
		};

		this.state = { options };
	}

	static getDerivedStateFromProps(nextProps, prevState) {
		const { competitionList, competitionSegmentList, match } = nextProps;
		const newState = { isLoading: false };

		//Create Or Edit
		newState.isNew = !match.params._id;

		//Remove redirect after creation/deletion
		if (prevState.redirect == match.url) {
			newState.redirect = false;
		}

		//Check Everything is loaded
		if (!newState.isNew && (!competitionList || !competitionSegmentList)) {
			newState.isLoading = true;
			return newState;
		}

		//Create Validation Schema
		const validationObject = {
			name: Yup.string()
				.required()
				.label("Name"),
			type: Yup.mixed()
				.required()
				.label("Type"),
			_teamType: Yup.mixed()
				.required()
				.label("Team Type"),
			hashtagPrefix: Yup.string()
				.required()
				.label("Hashtag Prefix"),
			appendCompetitionName: Yup.boolean().label("Append Competition Name?"),
			externalCompId: Yup.number().label("External Competition Id"),
			externalDivId: Yup.number().label("External Division Id"),
			externalReportPage: Yup.string().label("External Report Page")
		};
		if (!newState.isNew) {
			validationObject._pointsCarriedFrom = Yup.mixed().label("Points Carried From");
		}
		newState.validationSchema = Yup.object().shape(validationObject);

		//Get Current Segment
		if (!newState.isNew) {
			newState.segment = competitionSegmentList[match.params._id] || false;
		}

		//Ensure parent competition is valid
		if (newState.isNew && !prevState.parent) {
			newState.parent = competitionList[match.params.parent];
		}

		//Render pointsCarriedFrom options
		if (!newState.isNew && !prevState.options._pointsCarriedFrom) {
			newState.options = prevState.options;
			newState.options._pointsCarriedFrom = _.chain(competitionSegmentList)
				//Remove active segment
				.reject(c => !newState.isNew && c._id == match.params._id)
				//Same parent competition
				.filter(c => c._parentCompetition._id == newState.segment._parentCompetition._id)
				//Same team type
				.filter(c => c._teamType == newState.segment._teamType)
				//Leagues
				.filter(c => c.type == "League")
				//Sort
				.sortBy("name")
				//Convert to options
				.map(c => ({ value: c._id, label: c.name }))
				.value();
		}

		return newState;
	}

	getDefaults() {
		const { segment, isNew, options } = this.state;

		let defaults = {
			name: "",
			type: "",
			_teamType: "",
			hashtagPrefix: "",
			_pointsCarriedFrom: "",
			appendCompetitionName: false,
			externalCompId: "",
			externalDivId: "",
			externalReportPage: ""
		};
		if (!isNew) {
			defaults = _.mapValues(defaults, (v, key) =>
				segment[key] == null ? "" : segment[key]
			);
		}

		return _.mapValues(defaults, (v, key) => {
			if (options[key]) {
				return options[key].find(({ value }) => value == v) || "";
			} else {
				return v != undefined ? v : "";
			}
		});
	}

	async handleSubmit(fValues) {
		const { createCompetitionSegment, updateCompetitionSegment, match } = this.props;
		const { segment, isNew } = this.state;
		const values = _.chain(fValues)
			.cloneDeep()
			.mapValues(v => (v.value === undefined ? v : v.value))
			.mapValues(v => (v !== "" ? v : null))
			.value();

		if (isNew) {
			values._parentCompetition = match.params.parent;
			const newId = await createCompetitionSegment(values);
			await this.setState({ redirect: `/admin/competitions/segments/${newId}` });
		} else {
			await updateCompetitionSegment(segment._id, values);
		}
	}

	async handleDelete() {
		const { deleteCompetitionSegment } = this.props;
		const { segment } = this.state;
		const success = await deleteCompetitionSegment(segment._id);
		if (success) {
			this.setState({
				isDeleted: true,
				redirect: `/admin/competitions/${segment._parentCompetition._id}`
			});
		}
	}

	renderHeader() {
		let { parent, segment, isNew } = this.state;
		if (!parent) {
			parent = segment._parentCompetition;
		}
		const title = isNew ? `Add New Competition - ${parent.name}` : segment.name;

		return (
			<section className="page-header">
				<HelmetBuilder title={title} />
				<div className="container">
					<Link className="nav-card" to={`/admin/competitions/${parent._id}`}>
						Return to {parent.name}
					</Link>
					<h1>{title}</h1>
				</div>
			</section>
		);
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

	renderInstanceMenu() {
		const { isNew, segment } = this.state;
		if (!isNew) {
			const content = _.chain(segment.instances)
				.sortBy("year")
				.reverse()
				.map(i => {
					const titleArr = [
						i.year,
						i.sponsor,
						segment._parentCompetition.name,
						segment.name
					];
					return {
						...i,
						title: _.filter(titleArr, _.identity).join(" ")
					};
				})
				.map(i => (
					<li key={i._id}>
						<Link to={`/admin/competitions/segments/${segment._id}/instances/${i._id}`}>
							{i.title}
						</Link>
					</li>
				))
				.value();

			return (
				<div className="card form-card">
					<h2>Instances</h2>
					<Link
						to={`/admin/competitions/segments/${segment._id}/instances/new/`}
						className={`card nav-card`}
					>
						Create New Instance
					</Link>
					<ul className="plain-list">{content}</ul>
				</div>
			);
		}
	}

	render() {
		const {
			redirect,
			segment,
			isNew,
			parent,
			isLoading,
			validationSchema,
			options
		} = this.state;

		if (redirect) {
			return <Redirect to={redirect} />;
		}

		if (isLoading) {
			return <LoadingPage />;
		}
		if (isNew && !parent) {
			return <NotFoundPage message="Invalid parent competition" />;
		}
		if (!isNew && segment === false) {
			return <NotFoundPage message="Competition Segment not found" />;
		}

		return (
			<div className="admin-competition-segment-page">
				{this.renderHeader()}
				<section className="form">
					<div className="container">
						<Formik
							onSubmit={values => this.handleSubmit(values)}
							initialValues={this.getDefaults()}
							validationSchema={validationSchema}
							render={() => {
								const fields = [
									{ name: "name", type: "text" },
									{
										name: "_teamType",
										type: "Select",
										options: options._teamType,
										isDisabled: !isNew
									},
									{ name: "type", type: "Select", options: options.type },
									{ name: "hashtagPrefix", type: "text" },
									{ name: "appendCompetitionName", type: "Boolean" },
									{ name: "externalCompId", type: "number" },
									{ name: "externalDivId", type: "number" },
									{ name: "externalReportPage", type: "text" }
								];

								if (!isNew) {
									fields.push({
										name: "_pointsCarriedFrom",
										type: "Select",
										options: options._pointsCarriedFrom
									});
								}

								return (
									<Form>
										<div className="card form-card grid">
											{this.renderFieldGroup(fields)}
											<div className="buttons">
												<button type="reset">Reset</button>
												<button type="submit">
													{isNew ? "Add" : "Update"} Competition Segment
												</button>
											</div>
										</div>
										{this.renderDeleteButtons()}
										{this.renderInstanceMenu()}
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

function mapStateToProps({ competitions, teams }) {
	const { competitionList, competitionSegmentList } = competitions;
	const { teamTypes } = teams;
	return { competitionList, competitionSegmentList, teamTypes };
}

export default connect(
	mapStateToProps,
	{
		fetchCompetitions,
		fetchCompetitionSegments,
		createCompetitionSegment,
		updateCompetitionSegment,
		deleteCompetitionSegment
	}
)(AdminCompetitionPage);
