export function optimizeYoutubeMetadata(params: {
  topic: string;
  nicheName?: string | null;
  scriptTitle?: string;
  scriptDescription?: string;
  tags?: string[];
}) {
  const nichePrefix = params.nicheName ? `${params.nicheName} | ` : "";
  const baseTitle = (params.scriptTitle || params.topic).slice(0, 90).trim();
  const title = `${nichePrefix}${baseTitle}`.slice(0, 100);

  const defaultDescription = `Video tự động được tạo cho chủ đề: ${params.topic}.\n\n#ai #youtubeautomation #contentfactory`;
  const description = (params.scriptDescription || defaultDescription).slice(0, 4900);

  const seedTags = [
    ...(params.tags || []),
    ...params.topic
      .split(/\s+/)
      .map((t) => t.toLowerCase())
      .filter((t) => t.length > 3),
    "ai automation",
    "youtube automation",
  ];

  const tags = Array.from(new Set(seedTags)).slice(0, 15);

  return { title, description, tags };
}
