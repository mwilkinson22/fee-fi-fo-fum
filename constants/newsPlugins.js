import ImageBlock from "~/client/components/news/entities/ImageBlock";
import ImageButton from "~/client/components/news/entities/ImageButton";

import YouTubeBlock from "~/client/components/news/entities/YouTubeBlock";
import YouTubeButton from "~/client/components/news/entities/YouTubeButton";

const imagePlugin = {
	title: "Image",
	type: "image",
	buttonComponent: ImageButton,
	blockComponent: ImageBlock
};
const youtubePlugin = {
	title: "Youtube",
	type: "youtube",
	buttonComponent: YouTubeButton,
	blockComponent: YouTubeBlock
};

export default [imagePlugin, youtubePlugin];
