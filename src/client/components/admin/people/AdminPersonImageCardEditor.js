//Modules
import _ from "lodash";
import React, { Component } from "react";
import { connect } from "react-redux";
import PropTypes from "prop-types";
import * as Yup from "yup";

//Components
import BasicForm from "~/client/components/admin/BasicForm";
import AdminPersonImageCardRowEditor from "./AdminPersonImageCardRowEditor";
import LoadingPage from "~/client/components/LoadingPage";

//Constants
import * as fieldTypes from "~/constants/formFieldTypes";

//Helpers
import { stringToProper } from "~/helpers/genericHelper";

class AdminPersonImageCardEditor extends Component {
	constructor(props) {
		super(props);

		const { person, initialValues } = props;

		//Create Options
		const options = {
			imageType: []
		};
		for (const type in person.images) {
			if (person.images[type]) {
				options.imageType.push({ label: stringToProper(type), value: type });
			}
		}
		options.alignment = ["left", "center", "right"].map(value => ({
			value,
			label: stringToProper(value)
		}));

		//Create values
		const values = {
			alignment: options.alignment[1].value,
			imageType: options.imageType[0].value,
			lineHeight: 1.2,
			globalSize: null,
			includeName: true,
			textRows: [],
			...initialValues
		};

		//Get Templates
		const templates = this.getTemplates();

		//Create initial state
		this.state = {
			copyRow: null,
			editing: null,
			previewImage: null,
			options,
			values,
			templates
		};
	}

	componentDidMount() {
		this.updatePreview();
	}

	async updatePreview() {
		const { getPreview } = this.props;
		const { values } = this.state;

		//Set to loading spinner
		this.setState({ previewImage: "loading" });

		//Await preview
		const previewImage = await getPreview(values);

		//Assign to state
		this.setState({ previewImage });
	}

	reorderRows(oldIndex, newIndex) {
		const values = { ...this.state.values };

		//Remove the element and save it to row variable
		const [row] = values.textRows.splice(oldIndex, 1);

		//Reinsert it at the new index,
		//clear the currentlyBeingReordered array
		values.textRows.splice(newIndex, 0, row);

		//Update state
		this.setState({ values }, () => this.updatePreview());
	}

	deleteRow(index) {
		//Clone values
		const values = { ...this.state.values };

		//Remove row
		values.textRows.splice(index, 1);

		//Update state
		this.setState({ values }, () => this.updatePreview());
	}

	getTemplates() {
		const { localTeam, fullTeams, person, trimColour } = this.props;
		const localTeamObject = fullTeams[localTeam];

		const templates = {};

		//[Person] is a [nickname]
		if (localTeamObject.playerNickname) {
			templates["isA"] = {
				label: `${person.name.first} is a ${localTeamObject.playerNickname}`,
				textRows: [
					[
						{
							colour: trimColour,
							font: "Monstro",
							size: 20,
							text: person.name.first
						}
					],
					[
						{
							colour: "#FFFFFF",
							font: "Monstro",
							size: 10,
							text: "is a"
						}
					],
					[
						{
							colour: trimColour,
							font: "Monstro",
							size: 20,
							text: localTeamObject.playerNickname
						}
					],
					[
						{
							colour: "#FFFFFF",
							font: "Montserrat Bold",
							size: 8,
							text: " "
						}
					],
					[
						{
							colour: trimColour,
							font: "Montserrat Bold",
							size: 8,
							text: "#"
						},
						{
							colour: "#FFFFFF",
							font: "Montserrat Bold",
							size: 8,
							text: `${person.name.last}`
						},
						{
							colour: trimColour,
							font: "Montserrat Bold",
							size: 8,
							text: person.contractedUntil || `Year`
						}
					]
				]
			};
		}

		return templates;
	}

	setTemplate(key) {
		const { editing, templates, values } = this.state;
		if (editing) {
			return;
		}

		if (!values.textRows.length || confirm("Overwrite existing data?")) {
			const newValues = { ...values };
			newValues.textRows = templates[key].textRows;
			this.setState({ values: newValues }, () => this.updatePreview());
		}
	}

	renderTemplates() {
		const { editing, templates } = this.state;

		if (Object.keys(templates).length) {
			const list = _.map(templates, ({ label }, key) => (
				<button type="button" onClick={() => this.setTemplate(key)} key={key} disabled={Boolean(editing)}>
					{label}
				</button>
			));
			return (
				<div className="form-card">
					<h6>Use Template</h6>
					{list}
				</div>
			);
		}
	}

	renderSummary() {
		const { editing, options, values } = this.state;

		//Create List Array
		const list = [];

		//Add main value row
		let mainValueStr = [
			`${options.imageType.find(({ value }) => value === values.imageType).label} Image`,
			`${options.alignment.find(({ value }) => value === values.alignment).label} Alignment`,
			`Line Height ${values.lineHeight}`,
			`${values.includeName ? "" : "Don't "} Include Name`,
			values.globalSize ? `Global Size: ${values.globalSize}` : "No Global Size"
		].join(", ");
		list.push(
			<li key="main" onClick={() => this.setState({ editing: "main" })}>
				<div className="content">
					<strong>Image Settings</strong>
					{mainValueStr}
				</div>
			</li>
		);

		//Add Text Rows
		values.textRows.forEach((row, i) => {
			//Create string content
			let textContent = row.map(s => s.text).join("");

			if (!textContent.trim().length) {
				textContent = <em>[{_.maxBy(row, "size").size}pt whitespace]</em>;
			}

			//Create buttons
			const buttons = [];
			buttons.push(
				<button key="move-up" onClick={() => this.reorderRows(i, i - 1)} disabled={i === 0} type="button">
					&#9650;
				</button>,
				<button
					key="move-down"
					onClick={() => this.reorderRows(i, i + 1)}
					disabled={i === values.textRows.length - 1}
					type="button"
				>
					&#9660;
				</button>,
				<button key="copy" type="button" onClick={() => this.setState({ editing: "new", copyRow: i })}>
					Copy
				</button>,
				<button key="delete" className="delete" type="button" onClick={() => this.deleteRow(i)}>
					Delete
				</button>
			);

			list.push(
				<li
					key={i}
					onClick={ev => {
						if (ev.target.type !== "button") {
							this.setState({ editing: i });
						}
					}}
				>
					<div className="content">
						<strong>Row {i + 1}</strong>
						{textContent}
					</div>
					<div className="row-buttons">{buttons}</div>
				</li>
			);
		});

		//Add new row button
		if (!editing) {
			list.push(
				<li key="new" onClick={() => this.setState({ editing: "new", copyRow: null })}>
					<div className="content">
						<strong>Add New Row</strong>
					</div>
				</li>
			);
		}

		return (
			<div className="form-card no-padding">
				<ul className={`summary${editing ? " disabled" : ""}`}>{list}</ul>
			</div>
		);
	}

	renderMainImageOptions() {
		const { options } = this.state;
		const fieldGroups = [
			{
				label: "Edit Image Settings",
				fields: [
					{ name: "imageType", type: fieldTypes.radio, options: options.imageType },
					{ name: "alignment", type: fieldTypes.radio, options: options.alignment },
					{ name: "lineHeight", type: fieldTypes.number },
					{ name: "includeName", type: fieldTypes.boolean },
					{ name: "globalSize", type: fieldTypes.number }
				]
			}
		];

		const initialValues = _.pick(this.state.values, [
			"imageType",
			"alignment",
			"lineHeight",
			"globalSize",
			"includeName"
		]);
		if (!initialValues.globalSize) {
			initialValues.globalSize = "";
		}

		const validationSchema = Yup.object().shape({
			alignment: Yup.string().required().label("Alignment"),
			lineHeight: Yup.number().required().label("Line Height"),
			imageType: Yup.string().required().label("Image Type"),
			includeName: Yup.bool().label("Include Name"),
			globalSize: Yup.number().label("Global Size")
		});

		return (
			<BasicForm
				fieldGroups={fieldGroups}
				initialValues={initialValues}
				isNew={false}
				isInitialValid={true}
				itemType={"Image"}
				onSubmit={newValues => {
					const values = { ...this.state.values, ...newValues };
					//Enforce global size
					if (values.globalSize) {
						values.textRows.forEach(row => row.forEach(segment => (segment.size = values.globalSize)));
					}
					this.setState({ values, editing: null }, () => this.updatePreview());
				}}
				replaceResetButton={this.renderDiscardButton()}
				submitButtonText={"Update Details"}
				validationSchema={validationSchema}
			/>
		);
	}

	renderRowEditor() {
		const { copyRow, editing, values } = this.state;

		//Submit handler
		const onSubmit = segments => {
			const newValues = { ...values };
			if (editing === "new") {
				newValues.textRows.push(segments);
			} else {
				newValues.textRows[editing] = segments;
			}

			this.setState({ editing: null, values: newValues }, () => this.updatePreview());
		};

		//Initial Values
		let initialValues;
		if (editing !== "new") {
			//Editing an existing value
			initialValues = values.textRows[editing];
		} else if (copyRow !== null) {
			//Copy existing row
			initialValues = values.textRows[copyRow];
		} else {
			//Either copy the last value, or pass in a blank array
			if (values.textRows.length) {
				const lastRow = values.textRows[values.textRows.length - 1];
				const template = { ...lastRow[lastRow.length - 1] };
				template.text = "";
				initialValues = [template];
			} else {
				initialValues = [];
			}
		}

		return (
			<AdminPersonImageCardRowEditor
				discardButton={this.renderDiscardButton()}
				enforceSize={values.globalSize}
				initialValues={initialValues}
				onSubmit={segments => onSubmit(segments)}
				rowNumber={editing === "new" ? null : editing + 1}
			/>
		);
	}

	renderDiscardButton() {
		return (
			<button type="button" onClick={() => this.setState({ editing: null })}>
				Discard Changes
			</button>
		);
	}

	renderPreviewAndButtons() {
		const { onComplete, person } = this.props;
		const { editing, previewImage, values } = this.state;

		let content;
		let wrapperClass = "form-card";
		if (previewImage === "loading") {
			content = <LoadingPage />;
		} else if (previewImage) {
			wrapperClass += " no-padding";
			content = <img src={previewImage} className="preview-image" alt={`${person.name.full} Image Card`} />;
		}

		const buttonIsValid = editing === null && values.textRows.length;

		return (
			<div className={wrapperClass}>
				{content}
				<div className="buttons rtl">
					<button type="button" disabled={!buttonIsValid} onClick={() => onComplete(values)}>
						Post to Social
					</button>
				</div>
			</div>
		);
	}

	render() {
		const { editing } = this.state;

		let content;
		if (editing === null) {
			content = this.renderSummary();
		} else if (editing === "main") {
			content = this.renderMainImageOptions();
		} else {
			//Either "new" or a number
			content = this.renderRowEditor();
		}

		return (
			<div>
				{this.renderTemplates()}
				{content}
				{this.renderPreviewAndButtons()}
			</div>
		);
	}
}

function mapStateToProps({ config, teams }) {
	const { localTeam, trimColour } = config;
	const { fullTeams } = teams;
	return { localTeam, trimColour, fullTeams };
}

AdminPersonImageCardEditor.propTypes = {
	onComplete: PropTypes.func.isRequired,
	getPreview: PropTypes.func.isRequired,
	person: PropTypes.object.isRequired,
	initialValues: PropTypes.object
};
AdminPersonImageCardEditor.defaultProps = {
	initialValues: {}
};

export default connect(mapStateToProps)(AdminPersonImageCardEditor);
