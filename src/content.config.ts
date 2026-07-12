import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const postsCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		cover: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		series: z.string().optional().nullable().default(""),
		column: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});

const specCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/spec" }),
	schema: z.object({}),
});

const thoughtsCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/thoughts" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		draft: z.boolean().optional().default(false),
		series: z.string().optional().default("偶得"),
		tags: z.array(z.string()).optional().default([]),
		pinned: z.boolean().optional().default(false),
	}),
});

const bookReviewsCollection = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx}",
		base: "./src/content/book-reviews",
	}),
	schema: z.object({
		title: z.string(),
		bookId: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		summary: z.string().optional().default(""),
		verdict: z
			.enum(["recommend", "neutral", "avoid"])
			.optional()
			.default("neutral"),
		rating: z.number().min(0).max(10).optional(),
		topics: z.array(z.string()).optional().default([]),
		quotes: z
			.array(
				z.object({
					text: z.string(),
					chapter: z.string().optional().default(""),
				}),
			)
			.optional()
			.default([]),
		relatedPosts: z.array(z.string()).optional().default([]),
	}),
});

type Collections = {
	posts: typeof postsCollection;
	spec: typeof specCollection;
	thoughts: typeof thoughtsCollection;
	"book-reviews": typeof bookReviewsCollection;
};

export const collections: Collections = {
	posts: postsCollection,
	spec: specCollection,
	thoughts: thoughtsCollection,
	"book-reviews": bookReviewsCollection,
};
