import ImageBlock from "~/client/components/news/entities/ImageBlock";
import ImageButton from "~/client/components/news/entities/ImageButton";

import SporcleBlock from "~/client/components/news/entities/SporcleBlock";
import SporcleButton from "~/client/components/news/entities/SporcleButton";

import TwitterBlock from "~/client/components/news/entities/TwitterBlock";
import TwitterButton from "~/client/components/news/entities/TwitterButton";

import YouTubeBlock from "~/client/components/news/entities/YouTubeBlock";
import YouTubeButton from "~/client/components/news/entities/YouTubeButton";

const imagePlugin = {
	title: "Add Image",
	type: "image",
	buttonComponent: ImageButton,
	blockComponent: ImageBlock
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

export default [imagePlugin, sporclePlugin, twitterPlugin, youtubePlugin];
