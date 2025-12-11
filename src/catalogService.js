const prisma = require("./prisma");

function genId(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function createSeries(dto) {
  const id = dto.id || genId("SER");
  return prisma.series.create({
    data: {
      id,
      title: dto.title,
      description: dto.description || null,
      languageCode: dto.languageCode,
      genre: dto.genre || null,
      seasonCount: dto.seasonCount ?? 1,
      adult: dto.adult ?? false,
      published: dto.published ?? true,
    },
  });
}

async function listSeries() {
  return prisma.series.findMany({ orderBy: { title: "asc" } });
}

async function getSeries(id) {
  return prisma.series.findUnique({ where: { id } });
}

async function createEpisode(dto) {
  const id = dto.id || genId("EP");
  const releaseAt = dto.releaseAt ? new Date(dto.releaseAt) : new Date();
  return prisma.episode.create({
    data: {
      id,
      seriesId: dto.seriesId,
      seasonNumber: dto.seasonNumber ?? 1,
      episodeNumber: dto.episodeNumber ?? 1,
      title: dto.title,
      languageCode: dto.languageCode,
      durationSeconds: dto.durationSeconds ?? 480,
      free: dto.free ?? true,
      published: dto.published ?? true,
      releaseAt,
      hlsMasterUrl: dto.hlsMasterUrl ?? null,
      dashMpdUrl: dto.dashMpdUrl ?? null,
      offlineAssetUrl: dto.offlineAssetUrl ?? null,
    },
  });
}

async function listEpisodesBySeries(seriesId) {
  return prisma.episode.findMany({
    where: { seriesId, published: true },
    orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }],
  });
}

async function exploreFeed(language, size) {
  const episodes = await prisma.episode.findMany({
    where: { published: true, languageCode: language },
    take: Math.min(size * 3, 200),
    orderBy: { releaseAt: "desc" },
  });

  if (!episodes.length) return [];

  const shuffled = episodes.sort(() => Math.random() - 0.5).slice(0, size);

  const seriesIds = [...new Set(shuffled.map(e => e.seriesId))];
  const seriesList = await prisma.series.findMany({ where: { id: { in: seriesIds } } });
  const seriesMap = new Map(seriesList.map(s => [s.id, s]));

  return shuffled.map(ep => {
    const s = seriesMap.get(ep.seriesId);
    return {
      seriesId: ep.seriesId,
      seriesTitle: (s && s.title) || null,
      seriesLanguage: (s && s.languageCode) || language,
      genre: (s && s.genre) || null,
      episodeId: ep.id,
      seasonNumber: ep.seasonNumber,
      episodeNumber: ep.episodeNumber,
      episodeTitle: ep.title,
      durationSeconds: ep.durationSeconds,
      hlsMasterUrl: ep.hlsMasterUrl,
      dashMpdUrl: ep.dashMpdUrl,
      offlineAssetUrl: ep.offlineAssetUrl,
      free: ep.free,
      published: ep.published,
    };
  });
}

async function seedDummyIfEmpty() {
  const count = await prisma.series.count();
  if (count > 0) return;

  const series = await createSeries({
    id: "SERIES_DUMMY_1",
    title: "Dummy Vertical Drama",
    description: "Sample series for Explore testing",
    languageCode: "hi",
    genre: "drama",
    seasonCount: 1,
    adult: false,
    published: true,
  });

  await createEpisode({
    id: "EP_DUMMY_1",
    seriesId: series.id,
    seasonNumber: 1,
    episodeNumber: 1,
    title: "Dummy Episode 1",
    languageCode: "hi",
    durationSeconds: 480,
    free: true,
    published: true,
    offlineAssetUrl: "http://localhost:8081/dummy/ep1.mp4",
  });

  await createEpisode({
    id: "EP_DUMMY_2",
    seriesId: series.id,
    seasonNumber: 1,
    episodeNumber: 2,
    title: "Dummy Episode 2",
    languageCode: "hi",
    durationSeconds: 480,
    free: true,
    published: true,
    offlineAssetUrl: "http://localhost:8081/dummy/ep2.mp4",
  });

  await createEpisode({
    id: "EP_DUMMY_3",
    seriesId: series.id,
    seasonNumber: 1,
    episodeNumber: 3,
    title: "Dummy Episode 3",
    languageCode: "hi",
    durationSeconds: 480,
    free: false,
    published: true,
    offlineAssetUrl: "http://localhost:8081/dummy/ep3.mp4",
  });
}

module.exports = {
  createSeries,
  listSeries,
  getSeries,
  createEpisode,
  listEpisodesBySeries,
  exploreFeed,
  seedDummyIfEmpty,
};
