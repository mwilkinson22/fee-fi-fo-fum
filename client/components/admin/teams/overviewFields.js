//Fields
import * as Yup from "yup";
import "datejs";

export default {
	Team: [
		{
			name: "name_long",
			type: "string",
			label: "Long Name",
			validation: Yup.string().required()
		},
		{
			name: "name_short",
			type: "string",
			label: "Short Name",
			validation: Yup.string().required()
		},
		{
			name: "nickname",
			type: "string",
			label: "Nickname",
			validation: Yup.string().required()
		},
		{
			name: "hashtagPrefix",
			type: "string",
			label: "Hashtag Prefix",
			validation: Yup.string()
				.required()
				.length(3)
		},
		{
			name: "_ground",
			type: "select",
			label: "Homeground",
			validation: Yup.string().required()
		}
	],
	Colours: [
		{
			name: "colours_main",
			type: "color",
			label: "Main",
			validation: Yup.string().required(),
			defaultValue: "#990000"
		},
		{
			name: "colours_text",
			type: "color",
			label: "Text",
			validation: Yup.string().required(),
			defaultValue: "#FFFFFF"
		},
		{
			name: "colours_trim1",
			type: "color",
			label: "Trim 1",
			validation: Yup.string().required(),
			defaultValue: "#FFFFFF"
		},
		{
			name: "colours_trim2",
			type: "color",
			label: "Trim 2",
			validation: Yup.string().required(),
			defaultValue: "#DDDDDD"
		},
		{
			name: "colours_pitchColour",
			type: "color",
			label: "Pitch Colour",
			validation: Yup.string().required(),
			defaultValue: "#DDDDDD"
		},
		{
			name: "colours_statBarColour",
			type: "color",
			label: "Stat Bar Colour",
			validation: Yup.string().required(),
			defaultValue: "#DDDDDD"
		}
	]
};
