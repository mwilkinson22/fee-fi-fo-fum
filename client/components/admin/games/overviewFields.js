//Fields
import * as Yup from "yup";

export default {
	Basics: [
		{
			name: "date",
			type: "date",
			label: "Date",
			validation: Yup.date().required(),
			defaultValue: new Date().toString("yyyy-MM-dd")
		},
		{
			name: "time",
			type: "time",
			label: "Time",
			validation: Yup.string().required(),
			defaultValue: "19:45:00"
		},
		{
			name: "team_type",
			type: "select",
			label: "Team Type",
			validation: Yup.string().required()
		},
		{
			name: "competition",
			type: "select",
			label: "Competition",
			validation: Yup.string().required()
		},
		{
			name: "opposition",
			type: "select",
			label: "Opposition",
			validation: Yup.string().required()
		},
		{ name: "round", type: "number", label: "Round", validation: Yup.number().min(1) }
	],
	Venue: [
		{
			name: "venue",
			type: "radio",
			label: "Venue",
			options: [
				{ value: "home", label: "Home" },
				{ value: "away", label: "Away" },
				{ value: "neutral", label: "Neutral" }
			],
			validation: Yup.string().required()
		}
	]
};
