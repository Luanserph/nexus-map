export type CategoryIconKey =
  | 'compass'
  | 'flame'
  | 'zap'
  | 'landmark'
  | 'navigation'
  | 'signpost'
  | 'skull'
  | 'swords'
  | 'scroll-text'
  | 'alert-circle'
  | 'gem'
  | 'box'
  | 'shield'
  | 'sword'
  | 'lock'
  | 'crown'
  | 'store'
  | 'user'
  | 'wrench'
  | 'shopping-bag'
  | 'hammer'
  | 'flask-conical'
  | 'sparkles'
  | 'heart'
  | 'leaf'
  | 'star'
  | 'spade'
  | 'radio'
  | 'flag'
  | 'bookmark'
  | 'map-pin'
  | 'castle'
  | 'mountain'
  | 'door-open'
  | 'anchor'
  | 'activity'
  | 'circle-dot';

export const CATEGORY_ICON_SVG_PATHS: Record<CategoryIconKey, string> = {
  compass:
    '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
  flame:
    '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  landmark:
    '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
  navigation: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>',
  signpost:
    '<path d="M12 3v3"/><path d="M18.5 13h-13L2 9.5 5.5 6h13L22 9.5Z"/><path d="M12 13v8"/>',
  skull:
    '<circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="M12.5 17l-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/>',
  swords:
    '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/><line x1="19" y1="21" x2="21" y2="19"/>',
  'scroll-text':
    '<path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M15 8h-5"/><path d="M15 12h-5"/>',
  'alert-circle':
    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
  gem: '<polygon points="6 3 18 3 22 9 12 22 2 9 6 3"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  sword:
    '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" y1="19" x2="19" y2="13"/><line x1="16" y1="16" x2="20" y2="20"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  crown: '<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>',
  store:
    '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  wrench:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  'shopping-bag':
    '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  hammer:
    '<path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/>',
  'flask-conical':
    '<path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2"/><path d="M8.5 2h7"/><path d="M7 16h10"/>',
  sparkles:
    '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/><path d="M19 3v3"/><path d="M17.5 4.5h3"/>',
  heart:
    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  spade:
    '<path d="M5 9c-1.5 1.5-3 3.2-3 5.5A5.5 5.5 0 0 0 7.5 20c1.8 0 3-.5 4.5-2 1.5 1.5 2.7 2 4.5 2a5.5 5.5 0 0 0 5.5-5.5c0-2.3-1.5-4-3-5.5l-7-7-7 7Z"/><path d="M12 18v4"/>',
  radio:
    '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
  bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  'map-pin':
    '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  castle:
    '<path d="M22 20v-9H2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2Z"/><path d="M18 11V4H6v7"/><path d="M15 22v-4a3 3 0 0 0-3-3v0a3 3 0 0 0-3 3v4"/><path d="M22 11V9"/><path d="M2 11V9"/><path d="M6 4V2"/><path d="M18 4V2"/><path d="M10 4V2"/><path d="M14 4V2"/>',
  mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  'door-open':
    '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3"/><path d="M13 20h9"/><path d="M10 12v.01"/><path d="M13 4.562v16.157a1 1 0 0 1-1.242.97L5 20V5.562a2 2 0 0 1 1.515-1.94l4-1A2 2 0 0 1 13 4.561Z"/>',
  anchor:
    '<circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  'circle-dot': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="2.5"/>',
};

const VALID_ICON_KEYS = new Set<string>(Object.keys(CATEGORY_ICON_SVG_PATHS));
const GENERIC_HINTS = new Set(['map-pin', 'default', 'circle-dot', '']);

/**
 * Semantic category icon resolver supporting English & Portuguese keywords across all 15+ games.
 * Respects explicit non-generic `iconHint` overrides from `manifest.json` when provided.
 */
export function getCategoryIconKey(
  categoryId?: string,
  categoryName?: string,
  iconHint?: string
): CategoryIconKey {
  const hint = (iconHint ?? '').trim().toLowerCase();
  if (hint && !GENERIC_HINTS.has(hint) && VALID_ICON_KEYS.has(hint)) {
    return hint as CategoryIconKey;
  }

  const text = `${categoryId ?? ''} ${categoryName ?? ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // 1. Bosses, Cyberpsychos, Enemies, Combat Camps, Outposts, Notorious Marks & Hunts
  if (
    /\b(boss|chefe|cyberpsycho|ciberpsicopata|skulltula|guardian|lynel|hinox|talus|gleeok|frox|illegal|gang|bandit|monster|enemy|inimigo|camp|acampamento|outpost|posto|ncpd|arena|pantheon|grimm|notorious|mark|hunt|cacada|classified|esper|cave-master|fiend|genma)\b/.test(
      text
    )
  ) {
    return /\b(camp|acampamento|outpost|posto|ncpd|arena|combat|combate|shooting|tiro|swords|espada|chronolith|trial)\b/.test(
      text
    )
      ? 'swords'
      : 'skull';
  }

  // 2. Fast Travel, Shrines, Sesters, Bonfires, Towers, Obelisks, Chocobo Stops, Portals
  if (
    /\b(site-of-grace|grace|graca|shrine|santuario|lightroot|bonfire|sester|flame|fogueira|chronolith|save-point|mirror-of-light)\b/.test(
      text
    )
  ) {
    return 'flame';
  }
  if (
    /\b(tower|torre|remnawave|skyview|sheikah|waygate|portal|oni-portal|teleport|warp|rift|fenda|obelisk|obelisco|control-point)\b/.test(
      text
    )
  ) {
    return 'zap';
  }
  if (/\b(chocobo-stop|chocobo|fast-travel-board)\b/.test(text)) {
    return 'signpost';
  }
  if (
    /\b(fast-travel|viagem|dataterm|signpost|placa|stag|besouro|tram|bonde|bus|onibus|harbor|porto|pier|wreck|shipwreck|naufragio|world-intel|intel|kingslayer|kingslayer-file|clue|pista)\b/.test(
      text
    )
  ) {
    return /\b(harbor|porto|pier|boat|barco|marina|wreck|shipwreck|naufragio)\b/.test(text)
      ? 'anchor'
      : 'compass';
  }

  // 3. Quests, Missions, Gigs, Contracts, Substories, Notes, Memos, Treasure Maps
  if (
    /\b(quest|missao|missoes|gig|contract|contrato|main-job|side-job|odd-job|job|substory|substories|notice|noticeboard|aviso|bounty|recompensa|event|evento|story|historia|adventure|side-adventure|renown|note|nota|memo|document|documento|file|arquivo|journal|diario|dossier|lore|treasure-map)\b/.test(
      text
    )
  ) {
    return /\b(main-job|story|historia|alert|emergency)\b/.test(text)
      ? 'alert-circle'
      : 'scroll-text';
  }

  // 4. Treasures, Chests, Caches, Weapon Cases, Safes, Key Items, Locker Keys, Gear
  if (/\b(safe|cofre|vault|lock|locker-key|coin-locker|chave|key|key-item|keycard|cartao)\b/.test(text)) {
    return 'lock';
  }
  if (
    /\b(chest|bau|baus|treasure|tesouro|loot|spoils|stash|supply|cache|weapon-case|case|crate|caixa|dig-site|buried|glimmer|drop-point)\b/.test(
      text
    )
  ) {
    return 'box';
  }
  if (/\b(weapon|arma|armas|sword|espada|phantom-edge|bow|arco|gun|ammo|ammu-nation|iconic)\b/.test(text)) {
    return 'sword';
  }
  if (/\b(armor|armadura|shield|escudo|shell|gear|equipamento|clothing|roupa|outfit|vest|accessory|acessorio)\b/.test(text)) {
    return 'shield';
  }
  if (
    /\b(bank|banco|jewelry|joalheria|pawn|gem|gema|rupee|ore|minerio|smithing|rune|runa|atm|golden-seed|scadutree|pale-ore|summon-crystal|vision-crystal|crystal|cristal|magicite|tablet-shard|skill-point|ponto-de-habilidade|animus-fragment|animus)\b/.test(
      text
    )
  ) {
    return 'gem';
  }

  // 5. NPCs, Shops, Ripperdocs, Vendors, Fixers, Workshops, Blueprints
  if (/\b(ripperdoc|mod-shop|modshop|paynspray|pay-n-spray|garage|garagem|mechanic|oficina|upgrade|blacksmith|ferreiro|armourer|armeiro|craft|forja|forge|blueprint|esquema)\b/.test(text)) {
    return 'wrench';
  }
  if (/\b(shop|loja|store|vendor|vendedor|merchant|mercador|market|mercado|convenience|conveniencia|bar|cafe|food|comida|inn|estalagem|tavern|stable|estabulo|vending|chocoboutique|automat)\b/.test(text)) {
    return 'store';
  }
  if (/\b(npc|fixer|character|personagem|contact|contato|trainer|gwent|fairy|fada|goddess|deusa|bench|descanso|rest-spot|apartment|apartamento|safehouse|esconderijo|moogle|chadley)\b/.test(text)) {
    return /\b(bench|descanso|rest-spot|apartment|apartamento|safehouse|esconderijo)\b/.test(text)
      ? 'bookmark'
      : 'user';
  }

  // 6. Collectibles: Lucky Emblems, Shanties, Trinkets, Gobbos, PDAs, Cassettes, Speed Traps
  if (/\b(korok|leaf|folha|herb|erva|flower|flor|mushroom|cogumelo|plant|planta|material|ingredient|seed|semente)\b/.test(text)) {
    return 'leaf';
  }
  if (/\b(heart|coracao|mask|mascara|vessel|receptaculo|life|vida|health|saude|sacred-tear|tear|lagrima)\b/.test(text)) {
    return 'heart';
  }
  if (/\b(tarot|taro|arcana|card|carta|playing-card|spade|queens-blood|queen-s-blood)\b/.test(text)) {
    return 'spade';
  }
  if (/\b(waink|radio|drone|signal|sinal|crtv|phone|telefone|antenna|antena|pda|cassette|cassette-tape|tape)\b/.test(text)) {
    return 'radio';
  }
  if (/\b(stunt|salto|race|corrida|hoop|cesta|mural|flag|bandeira|challenge|desafio|minigame|speed-trap|speed-zone|drift-zone|danger-sign|xp-board)\b/.test(text)) {
    return 'flag';
  }
  if (
    /\b(charm|amuleto|talisman|talisma|spell|feitico|incantation|sorcery|magic|magia|ability|habilidade|memory|memoria|memento|postcard|geoglyph|dragon|grub|larva|seashell|maiamai|collectible|colecionavel|relic|reliquia|protorelic|poe|bubbulfrog|materia|lifespring|orchestrion|sheet-music|shanty|scenic|arete|lucky-emblem|hidden-mickey|emblem|emblema|trinket|gobbo)\b/.test(
      text
    )
  ) {
    return /\b(relic|reliquia|protorelic|star|estrela|geoglyph|memory|memoria|memento|postcard|notch|encaixe|orchestrion|sheet-music|shanty|scenic|lucky-emblem|hidden-mickey|emblem|emblema|gobbo)\b/.test(
      text
    )
      ? 'star'
      : 'sparkles';
  }

  // 7. Locations, Dungeons, Sanctums, Caves, Castles, Mountains, Landmarks, Barn Finds
  if (/\b(dungeon|masmorra|temple|templo|sanctum|castle|castelo|fort|forte|palace|palacio|ruin|ruina|legacy-dungeon)\b/.test(text)) {
    return 'castle';
  }
  if (/\b(cave|caverna|well|poco|entrance|entrada|interior|mine|mina|tunnel|tunel|chasm|abismo)\b/.test(text)) {
    return 'door-open';
  }
  if (/\b(mountain|montanha|peak|pico|viewpoint|mirante|cliff|penhasco|island|ilha)\b/.test(text)) {
    return 'mountain';
  }
  if (/\b(landmark|marco|settlement|vila|village|town|cidade|city|poi|location|local|region|regiao|club|clube|gym|academia)\b/.test(text)) {
    return 'landmark';
  }
  if (/\b(vehicle|veiculo|car|carro|bike|moto|horse|cavalo|barn-find)\b/.test(text)) {
    return 'crown';
  }

  if (hint && VALID_ICON_KEYS.has(hint)) {
    return hint as CategoryIconKey;
  }

  return 'circle-dot';
}
