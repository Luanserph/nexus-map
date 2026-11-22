import type { GamePlatform } from '../../src/types/schema';

export interface RawgGameMetadata {
  id: number;
  slug: string;
  title: string;
  studio: string;
  releaseYear: number;
  genres: string[];
  platforms: GamePlatform[];
  backgroundImage?: string;
  additionalImage?: string;
}

export interface SteamGridDbAssets {
  coverUrl?: string;
  bannerUrl?: string;
  logoUrl?: string;
}

interface RawgSearchResponse {
  results?: Array<{
    id: number;
    slug: string;
    name: string;
    released?: string | null;
    background_image?: string | null;
    genres?: Array<{ name: string }>;
  }>;
}

interface RawgDetailResponse {
  id: number;
  slug: string;
  name: string;
  released?: string | null;
  background_image?: string | null;
  background_image_additional?: string | null;
  developers?: Array<{ name: string }>;
  publishers?: Array<{ name: string }>;
  genres?: Array<{ name: string }>;
  parent_platforms?: Array<{ platform: { slug: string } }>;
}

function mapRawgPlatforms(
  parentPlatforms?: Array<{ platform: { slug: string } }>
): GamePlatform[] {
  const result = new Set<GamePlatform>();
  for (const item of parentPlatforms ?? []) {
    const slug = item.platform?.slug?.toLowerCase() ?? '';
    if (slug === 'pc') result.add('pc');
    else if (slug === 'playstation') result.add('playstation');
    else if (slug === 'xbox') result.add('xbox');
    else if (slug === 'nintendo') result.add('switch');
  }
  return Array.from(result);
}

interface SgdbSearchResponse {
  success: boolean;
  data?: Array<{ id: number; name: string }>;
}

interface SgdbMediaResponse {
  success: boolean;
  data?: Array<{ url: string; width?: number; height?: number }>;
}

export async function fetchRawgMetadata(
  query: string,
  apiKey: string
): Promise<RawgGameMetadata> {
  const searchUrl = new URL('https://api.rawg.io/api/games');
  searchUrl.searchParams.set('search', query);
  searchUrl.searchParams.set('page_size', '5');
  searchUrl.searchParams.set('key', apiKey);

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    throw new Error(
      `RAWG API retornou HTTP ${searchRes.status} ao buscar "${query}". Verifique sua RAWG_API_KEY.`
    );
  }

  const searchData = (await searchRes.json()) as RawgSearchResponse;
  const bestMatch = searchData.results?.[0];
  if (!bestMatch) {
    throw new Error(`Nenhum jogo encontrado na RAWG API para "${query}".`);
  }

  // Fetch full details to retrieve developers/studio and additional background image
  const detailUrl = new URL(`https://api.rawg.io/api/games/${bestMatch.id}`);
  detailUrl.searchParams.set('key', apiKey);

  const detailRes = await fetch(detailUrl);
  const detailData: RawgDetailResponse | null = detailRes.ok
    ? ((await detailRes.json()) as RawgDetailResponse)
    : null;

  const released = detailData?.released ?? bestMatch.released ?? '';
  const parsedYear = released ? Number.parseInt(released.slice(0, 4), 10) : NaN;
  const releaseYear = Number.isFinite(parsedYear)
    ? parsedYear
    : new Date().getFullYear();

  const studio =
    detailData?.developers?.[0]?.name ??
    detailData?.publishers?.[0]?.name ??
    'Estúdio Desconhecido';

  const rawGenres = (detailData?.genres ?? bestMatch.genres ?? [])
    .map((g) => g.name)
    .slice(0, 3);
  const platforms = mapRawgPlatforms(detailData?.parent_platforms);

  return {
    id: bestMatch.id,
    slug: detailData?.slug ?? bestMatch.slug,
    title: detailData?.name ?? bestMatch.name,
    studio,
    releaseYear,
    genres: rawGenres.length > 0 ? rawGenres : ['Aventura'],
    platforms: platforms.length > 0 ? platforms : ['pc'],
    backgroundImage:
      detailData?.background_image ?? bestMatch.background_image ?? undefined,
    additionalImage: detailData?.background_image_additional ?? undefined,
  };
}

export async function fetchSteamGridDbAssets(
  gameName: string,
  apiKey?: string
): Promise<SteamGridDbAssets> {
  if (!apiKey) {
    return {};
  }

  const headers = {
    Authorization: `Bearer ${apiKey}`,
  };

  try {
    const searchRes = await fetch(
      `https://www.steamgriddb.com/api/v2/search/autocomplete/${encodeURIComponent(gameName)}`,
      { headers }
    );
    if (!searchRes.ok) {
      console.warn(
        `[SteamGridDB] Busca retornou HTTP ${searchRes.status}. Usando fallback da RAWG.`
      );
      return {};
    }

    const searchJson = (await searchRes.json()) as SgdbSearchResponse;
    const gameId = searchJson.data?.[0]?.id;
    if (!gameId) {
      console.warn(
        `[SteamGridDB] Jogo "${gameName}" não encontrado. Usando fallback da RAWG.`
      );
      return {};
    }

    const [gridsRes, heroesRes, logosRes] = await Promise.all([
      fetch(
        `https://www.steamgriddb.com/api/v2/grids/game/${gameId}?dimensions=920x430,460x215&limit=1`,
        { headers }
      ),
      fetch(`https://www.steamgriddb.com/api/v2/heroes/game/${gameId}?limit=1`, {
        headers,
      }),
      fetch(`https://www.steamgriddb.com/api/v2/logos/game/${gameId}?limit=1`, {
        headers,
      }),
    ]);

    let coverUrl: string | undefined;
    if (gridsRes.ok) {
      const gridsJson = (await gridsRes.json()) as SgdbMediaResponse;
      coverUrl = gridsJson.data?.[0]?.url;
    }
    if (!coverUrl) {
      // Fallback to any grid dimension if wide grids were empty
      const anyGridRes = await fetch(
        `https://www.steamgriddb.com/api/v2/grids/game/${gameId}?limit=1`,
        { headers }
      );
      if (anyGridRes.ok) {
        const anyGridJson = (await anyGridRes.json()) as SgdbMediaResponse;
        coverUrl = anyGridJson.data?.[0]?.url;
      }
    }

    let bannerUrl: string | undefined;
    if (heroesRes.ok) {
      const heroesJson = (await heroesRes.json()) as SgdbMediaResponse;
      bannerUrl = heroesJson.data?.[0]?.url;
    }

    let logoUrl: string | undefined;
    if (logosRes.ok) {
      const logosJson = (await logosRes.json()) as SgdbMediaResponse;
      logoUrl = logosJson.data?.[0]?.url;
    }

    return { coverUrl, bannerUrl, logoUrl };
  } catch (error) {
    console.warn(
      '[SteamGridDB] Falha na consulta, usando fallback da RAWG:',
      error instanceof Error ? error.message : error
    );
    return {};
  }
}

export async function downloadBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao baixar "${url}" (HTTP ${response.status}).`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
