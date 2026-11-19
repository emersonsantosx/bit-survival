# Dependencias entre os arquivos js/

Gerado por `node tools/dependencias.js`. So leitura: nada do jogo e alterado.

## Resumo por arquivo

"Expostas e usadas fora" = globais que outros arquivos usam. "So internas" = globais usadas apenas dentro do proprio arquivo (podem ser escondidas). "Possivelmente mortas" = definidas e nunca usadas (ou usadas uma vez so, na propria definicao).

| Arquivo | Globais | Usadas fora | So internas | Possivelmente mortas | Depende de (arquivos) | Usado por (arquivos) |
|---|---:|---:|---:|---:|---:|---:|
| 01-base | 57 | 45 | 12 | 0 | 0 | 28 |
| 02-audio | 68 | 32 | 35 | 1 | 5 | 21 |
| 03-dados | 49 | 38 | 11 | 0 | 2 | 22 |
| 04-estado | 88 | 82 | 6 | 0 | 6 | 26 |
| 05-geometria | 57 | 43 | 14 | 0 | 10 | 19 |
| 06-interiores-portas | 40 | 18 | 22 | 0 | 8 | 6 |
| 07-loot-mapa | 63 | 31 | 32 | 0 | 13 | 9 |
| 08-cidade-vilas-marcos | 48 | 23 | 24 | 1 | 11 | 16 |
| 09-milharal-geracao | 64 | 36 | 28 | 0 | 13 | 9 |
| 10-jogo-saves | 117 | 82 | 35 | 0 | 14 | 14 |
| 11-pesca-update | 36 | 11 | 25 | 0 | 14 | 17 |
| 12-crafting-multiplayer | 68 | 25 | 43 | 0 | 14 | 19 |
| 13-render-personagens | 105 | 49 | 56 | 0 | 13 | 17 |
| 14-arquitetura-luz-ambiente | 0 | 0 | 0 | 0 | 14 | 0 |
| 15-missoes-ui-controles | 91 | 21 | 70 | 0 | 10 | 13 |
| 16-orientacao | 0 | 0 | 0 | 0 | 3 | 0 |
| 17-arte-menu | 0 | 0 | 0 | 0 | 0 | 0 |
| 18-plantacao | 0 | 0 | 0 | 0 | 12 | 0 |
| 19-cerca | 0 | 0 | 0 | 0 | 10 | 0 |
| 20-piso-telhado | 0 | 0 | 0 | 0 | 9 | 0 |
| 21-frutiferas | 0 | 0 | 0 | 0 | 9 | 0 |
| 22-bau | 0 | 0 | 0 | 0 | 9 | 0 |
| 23-poco | 0 | 0 | 0 | 0 | 9 | 0 |
| 24-tronco | 0 | 0 | 0 | 0 | 9 | 0 |
| 25-icones-acoes | 0 | 0 | 0 | 0 | 2 | 0 |
| 26-clima-acabamento | 8 | 8 | 0 | 0 | 5 | 5 |
| 27-variedade-decoracao | 0 | 0 | 0 | 0 | 1 | 0 |
| 28-modo-desktop | 0 | 0 | 0 | 0 | 7 | 0 |
| 29-sala-multiplayer | 4 | 2 | 2 | 0 | 5 | 2 |
| 30-desempenho | 8 | 3 | 5 | 0 | 4 | 2 |
| 31-rastro-sangue | 0 | 0 | 0 | 0 | 4 | 0 |

## Matriz: quantos usos cada arquivo (linha) faz de globais de outro (coluna)

| de \ para | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 01-base | . |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 02-audio | 25 | . |  | 40 | 4 |  |  | 2 | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 03-dados | 1 |  | . | 19 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 04-estado | 25 | 1 | 3 | . |  |  |  |  |  | 3 |  | 2 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 05-geometria | 118 | 7 | 27 | 147 | . | 6 |  | 5 | 9 |  | 2 | 1 | 11 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 06-interiores-portas | 42 | 11 | 7 | 36 | 1 | . |  |  |  |  |  | 1 | 30 |  |  |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |
| 07-loot-mapa | 135 | 3 | 30 | 128 | 3 | 9 | . | 14 | 21 | 2 | 5 | 1 | 5 |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 08-cidade-vilas-marcos | 135 | 3 | 17 | 136 | 21 |  | 2 | . | 5 |  | 3 | 3 | 23 |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 09-milharal-geracao | 206 | 10 | 87 | 284 | 40 |  | 1 | 35 | . | 3 | 3 | 8 | 126 |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 1 |  |
| 10-jogo-saves | 90 | 52 | 57 | 706 | 18 | 3 | 12 | 10 | 7 | . | 89 | 25 | 10 |  | 18 |  |  |  |  |  |  |  |  |  |  | 1 |  |  |  |  |  |
| 11-pesca-update | 255 | 40 | 55 | 888 | 63 | 2 | 3 | 5 | 20 | 64 | . | 14 | 16 |  | 5 |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |
| 12-crafting-multiplayer | 57 | 36 | 29 | 728 | 12 | 1 | 6 | 5 | 11 | 44 | 40 | . | 18 |  | 11 |  |  |  |  |  |  |  |  |  |  |  |  |  | 4 |  |  |
| 13-render-personagens | 330 | 40 | 22 | 252 | 13 | 22 | 2 | 2 |  | 4 | 8 | 2 | . |  | 1 |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |
| 14-arquitetura-luz-ambiente | 660 | 13 | 16 | 324 | 17 |  | 10 | 8 | 23 | 7 | 3 | 1 | 155 | . |  |  |  |  |  |  |  |  |  |  |  | 5 |  |  |  | 2 |  |
| 15-missoes-ui-controles | 195 | 60 | 21 | 254 |  |  | 17 |  |  | 68 | 11 | 21 | 6 |  | . |  |  |  |  |  |  |  |  |  |  |  |  |  | 1 |  |  |
| 16-orientacao | 2 |  |  | 5 |  |  |  |  |  |  |  |  |  |  | 2 | . |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 17-arte-menu |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 18-plantacao | 36 | 6 | 22 | 77 | 16 |  |  | 13 | 1 | 1 | 8 | 3 | 139 |  | 1 |  |  | . |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 19-cerca | 40 | 13 | 3 | 115 | 12 |  |  | 1 |  | 5 | 5 | 7 | 35 |  |  |  |  |  | . |  |  |  |  |  |  |  |  |  |  |  |  |
| 20-piso-telhado | 39 | 3 | 6 | 37 | 6 |  |  | 1 |  |  | 2 | 2 | 30 |  |  |  |  |  |  | . |  |  |  |  |  |  |  |  |  |  |  |
| 21-frutiferas | 17 | 1 | 7 | 25 | 2 |  |  |  |  |  | 1 | 3 | 13 |  | 1 |  |  |  |  |  | . |  |  |  |  |  |  |  |  |  |  |
| 22-bau | 25 | 14 | 11 | 80 | 12 |  |  | 1 |  | 3 | 9 | 6 |  |  |  |  |  |  |  |  |  | . |  |  |  |  |  |  |  |  |  |
| 23-poco | 15 | 4 | 4 | 51 | 14 |  |  | 2 |  | 1 | 6 | 2 |  |  |  |  |  |  |  |  |  |  | . |  |  |  |  |  |  |  |  |
| 24-tronco | 23 | 5 | 4 | 100 | 15 |  |  | 1 |  | 1 | 6 | 2 |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |  |  |  |  |
| 25-icones-acoes |  |  | 16 |  |  |  |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |  |  |  |
| 26-clima-acabamento | 19 |  | 2 | 21 | 4 |  |  |  |  |  |  |  | 8 |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |  |  |
| 27-variedade-decoracao | 6 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |  |
| 28-modo-desktop | 45 | 2 |  | 41 |  |  | 2 |  |  | 7 | 2 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |
| 29-sala-multiplayer | 15 | 5 |  | 37 |  |  |  |  |  |  |  | 10 |  |  | 6 |  |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |
| 30-desempenho | 4 |  | 10 | 1 |  |  |  |  |  |  |  |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |  |
| 31-rastro-sangue | 4 |  |  | 16 | 3 |  |  |  |  |  |  |  | 11 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |

(colunas = os dois primeiros digitos do nome do arquivo)

## Globais usadas por 4 ou mais arquivos (o "miolo" compartilhado: mexer nelas e a parte arriscada)

| Nome | Tipo | Definida em | Usada em N arquivos | Usos |
|---|---|---|---:|---:|
| P | let | 04-estado:14 | 23 | 2013 |
| MP | let | 04-estado:19 | 22 | 703 |
| selectedMap | let | 04-estado:3 | 22 | 222 |
| beep | funcao | 02-audio:42 | 19 | 137 |
| ctx | const | 01-base:27 | 18 | 1085 |
| rnd | const | 01-base:16 | 18 | 435 |
| WW | let | 03-dados:2 | 18 | 101 |
| WH | let | 03-dados:2 | 18 | 90 |
| toast | funcao | 11-pesca-update:1276 | 17 | 205 |
| T | let | 04-estado:14 | 17 | 121 |
| parts | let | 04-estado:10 | 17 | 76 |
| sendEvt | funcao | 12-crafting-multiplayer:112 | 17 | 62 |
| clamp | const | 01-base:4 | 16 | 98 |
| items | let | 04-estado:10 | 15 | 64 |
| solidPoint | funcao | 05-geometria:327 | 15 | 35 |
| R | funcao | 13-render-personagens:2 | 14 | 1185 |
| blds | let | 04-estado:10 | 14 | 58 |
| pointInLake | funcao | 05-geometria:113 | 14 | 48 |
| weather | let | 04-estado:6 | 13 | 89 |
| trees | let | 04-estado:10 | 12 | 55 |
| bldAt | funcao | 05-geometria:591 | 12 | 31 |
| state | let | 04-estado:2 | 11 | 106 |
| ITEMS | const | 03-dados:167 | 11 | 66 |
| zombies | let | 04-estado:10 | 11 | 58 |
| campfires | let | 04-estado:10 | 11 | 41 |
| remotePlayers | let | 04-estado:11 | 10 | 98 |
| dark | let | 04-estado:14 | 10 | 62 |
| tents | let | 04-estado:10 | 10 | 23 |
| onCityRoad | funcao | 08-cidade-vilas-marcos:9 | 10 | 22 |
| rint | const | 01-base:17 | 9 | 70 |
| animals | let | 04-estado:10 | 9 | 38 |
| ORLA | let | 05-geometria:125 | 9 | 38 |
| rebuildSolidGrid | funcao | 05-geometria:367 | 9 | 34 |
| lakes | let | 04-estado:10 | 9 | 31 |
| addItem | funcao | 04-estado:271 | 9 | 20 |
| $ | const | 01-base:2 | 8 | 185 |
| H | let | 01-base:48 | 8 | 103 |
| W | let | 01-base:48 | 8 | 98 |
| rocks | let | 04-estado:10 | 8 | 49 |
| atkHeld | let | 04-estado:16 | 8 | 18 |
| sprintHeld | let | 04-estado:16 | 8 | 16 |
| track | funcao | 15-missoes-ui-controles:60 | 8 | 13 |
| Z | let | 01-base:48 | 7 | 118 |
| CFG | const | 01-base:127 | 7 | 91 |
| aud | funcao | 02-audio:11 | 7 | 58 |
| joy | const | 04-estado:203 | 7 | 58 |
| vehicles | let | 04-estado:10 | 7 | 50 |
| shake | let | 04-estado:14 | 7 | 35 |
| KBM | let | 01-base:44 | 7 | 32 |
| day | let | 04-estado:14 | 7 | 26 |
| countInv | funcao | 04-estado:282 | 7 | 24 |
| pick | const | 01-base:18 | 7 | 22 |
| vehKind | funcao | 08-cidade-vilas-marcos:353 | 7 | 17 |
| pushOut | funcao | 05-geometria:398 | 7 | 14 |
| removeInv | funcao | 04-estado:287 | 7 | 11 |
| plane | let | 04-estado:13 | 6 | 62 |
| decorations | let | 04-estado:10 | 6 | 38 |
| DAY_SECONDS | const | 03-dados:8 | 6 | 27 |
| weatherTimer | let | 04-estado:7 | 6 | 13 |
| setRain | funcao | 02-audio:601 | 6 | 11 |

(93 no total, mostrando ate 60)

## Candidatas a esconder (so usadas dentro do proprio arquivo)

- **01-base** (12): makeLightSprite, mmC, dispH, UI_REF, UI_MAX, MQ_H, MQ_W, UIS, uiClasses, applyUiScale, PERF_TIERS, _cl
- **02-audio** (35): muted, gAtk, ambientSrc, ambientGain, rainNoise, ACT, sndBusy, _sndT, sndThrottle, stepNoise, VOICE_BOOST, voice, ZVB, creatureGain, AVB, musicWanted, musicOn, musicGain, musicTimer, musicNext, musicStepN, musicVerb, MUSIC_BASE, MUSIC_STEP, MUSIC_CACHE, ...
- **03-dados** (11): PXPAL, pxLines, pxRot, PXURL, PXCV, hydratePx, FISH_TPL, fishGrid, FISH_POOL, SEED_POOL, ZUNLOCK
- **04-estado** (6): MP_HOST_ALL, chatLog, chatUnread, chatTime, chatAddHistory, chatShowEmpty
- **05-geometria** (14): iceOf, orlaHit, _PAVE, _SANDP, orlaPatterns, TERR, SPG_C, spgSync, WG_C, WG, wallGrid, SOLID_GRID, wallBlockerAt, obbHitsCircle
- **06-interiores-portas** (22): FURN, ROOMFURN, BLD_ROOMS, ROOM_FLOOR, rectsHit, intConnected, intUnreached, DOOR_BREAK, doorHearable, doorSound, SLEEPERS, KEEPF, rectGap, organizeFurn, intBlocked, bldSpawnPoint, roomSpawnPoint, FLOOT, furnLootTable, SEED_BONUS, bonusSpot, FLASH_BONUS
- **07-loot-mapa** (32): LOOT_RESPAWN, PING_LIFE, pingAdd, pingBadge, pingCandidate, pingCol, ALLY_COLS, wpUpdate, WP_COL, wpDist, wpPick, bigTimer, bigPrevState, bigMapTap, drawPingsMini, RG_CELL, RG_FRAC, RG_TREE_S, RG_ROCK_S, RG_BT, RG_BR, RG_SET_T, RG_SET_R, rgKey, rgCount, ...
- **08-cidade-vilas-marcos** (24): bldDims, bldDims0, bldSize, cityPickType, cityFillBlock, cityRubble, cityPark, cityHouseFence, bldSizeRural, ruralPickType, genTown, ruralCarFree, SLED_COLS, BUGGY_COLS, ATV_COLS, prints, tracks, LM_SIDE_D, LM_SIDE_S, chestLoot, lmCurse, TRACK_W, updateTracks, drawTracks
- **09-milharal-geracao** (28): CORNT, genField, YT, _stalkCache, worldFlavor, MM_K, buildMinimap, bigBase, ANIMAL_PREY, BIRD_MAP, BIRD_FLOCK, birds, birdsReady, flockT, birdChirpT, birdSeq, BKEYS, BST, birdAnchors, birdOK, birdSound, newBird, initBirds, birdTakeoff, updateBirdsGuest, ...
- **10-jogo-saves** (35): SAVE_KEY, SAVE_PREFIX, SAVE_VER, slotKey, autoSlot, packObj, canSave, saveWorldOk, iceLoad, doorsLoad, normalizeLoadout, GUEST_SKIP, guestKey, guestForget, FRUIT_FOOD, eatLock, SEED_OF, seedGain, giveSeedFor, applyUse, consumeOne, putAwayHold, closeTool, chooseWeapon, dropWeaponFromArsenal, ...
- **11-pesca-update** (25): fishPop, reelHeld, rr, fishCastWait, fishPickSpecies, tryFish, fishStartReel, fishEnd, drawFishLine, autoSwitchMelee, meleeDmg, TEMP_MAP, envTemp, tempTick, BURN_R, BURN_T, BURN_DPS, burnTick, updateP, updateZ, CHAINSAW_LEN, CHAINSAW_R, chainsawHit, CAM_FAR, camSpeedZoom
- **12-crafting-multiplayer** (43): canCraft, craft, STRUCT_EVT, LOCAL_GRACE, handleEvt, loadPeerJS, makeRoomCode, hostRetryTimer, hostOpenPeer, hostSignalRetry, RECONN_MAX_MS, showReconnectUI, updateReconnectUI, hideReconnectUI, mpReconnectFail, mpGuestReconnectAttempt, hostResumeGuest, guestResumed, hostBuildWorld, MAP_NOME, hostSync, hostBroadcastLobby, hostFreeId, hostUniqueName, hostRefuse, ...
- **13-render-personagens** (56): skinLook, snowOutfit, _shc, Sh, ZS_COMMON, ZSTYLE, ZEYE, zstyle, humanBody, meleeLeft, swingAngle, drawHeld, armLine, TWO_HAND, humanDraw, RSP, rockKind, rockSprite, TSP, treeSprite, treeShadow, treeShadow0, TREE_ALTS, treeAlt, SNOWTOP, ...
- **15-missoes-ui-controles** (70): MS_GROUPS, MS_DEF, msRng, MS, msDef, msRender, ACH, ACH_MAPS, ACHD, achSave, achChime, achCheck, achSet, achMeta, _statPx, _statPy, _statSaveT, fmtDur, renderStats, achTab, achRow, renderAch, bindSlider, bindToggle, bindSliderResize, ...
- **29-sala-multiplayer** (2): LOB_COL, lobbyLeave
- **30-desempenho** (5): GC_SZ, GC_M, GC_MAX, GC, layerDraw

## Possivelmente mortas (revisar antes de apagar: podem ser chamadas por onclick no HTML ou pelos testes)

- `updateCreatureVoices` (funcao, 02-audio:397)
- `drawAurora` (funcao, 08-cidade-vilas-marcos:587)
