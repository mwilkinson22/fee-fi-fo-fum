import ImageBlock from "~/client/components/news/entities/ImageBlock";
import ImageButton from "~/client/components/news/entities/ImageButton";

import VideoBlock from "~/client/components/news/entities/VideoBlock";
import VideoButton from "~/client/components/news/entities/VideoButton";

import SporcleBlock from "~/client/components/news/entities/SporcleBlock";
import SporcleButton from "~/client/components/news/entities/SporcleButton";

import TwitterBlock from "~/client/components/news/entities/TwitterBlock";
import TwitterButton from "~/client/components/news/entities/TwitterButton";

import YouTubeBlock from "~/client/components/news/entities/YouTubeBlock";
import YouTubeButton from "~/client/components/news/entities/YouTubeButton";

import TeamFormBlock from "~/client/components/news/entities/TeamFormBlock";
import HeadToHeadButton from "~/client/components/news/entities/TeamFormButton";

const imagePlugin = {
	title: "Add Image",
	type: "image",
	buttonComponent: ImageButton,
	blockComponent: ImageBlock
};

const videoPlugin = {
	title: "Add Video",
	type: "video",
	buttonComponent: VideoButton,
	blockComponent: VideoBlock
};
const sporclePlugin = {
	title: "Embed Sporcle Quiz",
	type: "sporcle",
	buttonComponent: SporcleButton,
	blockComponent: SporcleBlock
};
const twitterPlugin = {
	title: "Embed Tweet",
	type: "twitter",
	buttonComponent: TwitterButton,
	blockComponent: TwitterBlock
};
const youtubePlugin = {
	title: "Embed YouTube Video",
	type: "youtube",
	buttonComponent: YouTubeButton,
	blockComponent: YouTubeBlock
};

const teamFormPlugin = {
	title: "Team Form",
	type: "team-form",
	buttonComponent: HeadToHeadButton,
	blockComponent: TeamFormBlock
};

export default post => {
	const plugins = [imagePlugin, videoPlugin, sporclePlugin, twitterPlugin, youtubePlugin];

	if (post) {
		//Add Game Preview Plugins
		if (post.category === "previews") {
			plugins.push(teamFormPlugin);
		}
	}

	return plugins;
};
