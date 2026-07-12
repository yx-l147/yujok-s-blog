import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "yujok Blog",
	subtitle: "雪花飘散",
	lang: "zh_CN",
	themeColor: {
		hue: 220,
		fixed: false,
	},
	banner: {
		enable: false,
		src: "assets/images/head.jpg",
		position: "center",
		credit: {
			enable: true,
			text: "by 若干爱",
			url: "https://www.pixiv.net/artworks/138075280",
		},
	},
	toc: {
		enable: true,
		depth: 2,
	},
	rightSidebar: {
		enable: true,
		siteStats: {
			enable: true,
			// 建站日（YYYY-MM-DD）。运行天数 = 今天 - since，浏览器实时算
			since: "2026-02-16",
		},
		calendar: {
			enable: true,
		},
		musicPlayer: {
			enable: true,
			// 在 tracks 里添加歌曲就能用，示例：
			// tracks: [
			//   {
			//     title:  "Avid",
			//     artist: "SawanoHiroyuki[nZk]:mizuki",
			//     src:    "/audio/avid.mp3",            // 放 public/audio/ 下，或填公网音频 URL
			//     cover:  "/images/avid-cover.jpg",     // 同理，本地放 public/images/ 或外链
			//   },
			//   {
			//     title:  "リテラチュア",
			//     artist: "上田麗奈",
			//     src:    "https://example.com/lit.mp3",
			//   },
			// ],
			tracks: [],
		},
	},
	favicon: [],
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Categories,
		LinkPreset.Tags,
		LinkPreset.Archive,
		{
			name: "书架",
			url: "/book/",
		},
		{
			name: "课程表",
			url: "/schedule/",
		},
		LinkPreset.About,
		{
			name: "偶得",
			url: "/thoughts/",
		},
		{
			name: "Bangumi",
			url: "/bangumi/",
		},
		{
			name: "GitHub",
			url: "https://github.com/yx-l147",
			external: true,
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/head.jpg",
	name: "yujok",
	bio: "自由之风永远吹拂",
	links: [
		{
			name: "Twitter",
			icon: "fa6-brands:twitter",
			url: "https://x.com/yxl147",
		},
		{
			name: "Steam",
			icon: "fa6-brands:steam",
			url: "https://steamcommunity.com/profiles/76561199175076036/",
		},
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/yx-l147",
		},
		{
			name: "Tiktok",
			icon: "fa6-brands:tiktok",
			url: "https://www.douyin.com/user/self?from_tab_name=main&showTab=post",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	theme: "github-dark",
};
