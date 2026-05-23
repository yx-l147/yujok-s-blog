import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { LinkPreset, type NavBarLink } from "@/types/config";

export const LinkPresets: { [key in LinkPreset]: NavBarLink } = {
	[LinkPreset.Home]: {
		name: i18n(I18nKey.home),
		url: "/",
	},
	[LinkPreset.About]: {
		name: i18n(I18nKey.about),
		url: "/about/",
	},
	[LinkPreset.Archive]: {
		name: i18n(I18nKey.archive),
		url: "/archive/",
	},
	[LinkPreset.Categories]: {
		name: "分类",
		url: "/categories/",
	},
	[LinkPreset.Tags]: {
		name: "标签",
		url: "/tags/",
	},
	[LinkPreset.Series]: {
		name: "系列",
		url: "/series/",
	},
	[LinkPreset.Columns]: {
		name: "专栏",
		url: "/columns/",
	},
};
