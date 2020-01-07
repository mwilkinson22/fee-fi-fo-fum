//Modules
import { DraftJS, createTypeStrategy } from "megadraft";

//Components
import ExternalLink from "~/client/components/news/entities/ExternalLink";
import InternalLink from "~/client/components/news/entities/InternalLink";

const decorators = [
	["LINK", ExternalLink],
	["INTERNAL_PAGE_LINK", InternalLink]
];

export default new DraftJS.CompositeDecorator(
	decorators.map(([entity, component]) => ({
		strategy: createTypeStrategy(entity),
		component
	}))
);
