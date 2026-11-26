# Dependencias entre os arquivos js/

Gerado por `node tools/dependencias.js`. So leitura: nada do jogo e alterado.

## Resumo por arquivo

"Expostas e usadas fora" = globais que outros arquivos usam. "So internas" = globais usadas apenas dentro do proprio arquivo (podem ser escondidas). "Possivelmente mortas" = definidas e nunca usadas (ou usadas uma vez so, na propria definicao).

| Arquivo | Globais | Usadas fora | So internas | Possivelmente mortas | Depende de (arquivos) | Usado por (arquivos) |
|---|---:|---:|---:|---:|---:|---:|
| 01-base | 57 | 45 | 12 | 0 | 0 | 30 |
| 02-audio | 68 | 32 | 35 | 1 | 5 | 22 |
| 03-dados | 54 | 42 | 12 | 0 | 2 | 23 |
| 04-estado | 89 | 83 | 6 | 0 | 6 | 29 |
| 05-geometria | 59 | 43 | 16 | 0 | 11 | 19 |
| 06-interiores-portas | 40 | 18 | 22 | 0 | 8 | 6 |
| 07-loot-mapa | 63 | 31 | 32 | 0 | 13 | 10 |
| 08-cidade-vilas-marcos | 48 | 23 | 24 | 1 | 12 | 17 |
| 09-milharal-geracao | 65 | 37 | 28 | 0 | 14 | 9 |
| 10-jogo-saves | 117 | 83 | 34 | 0 | 14 | 15 |
| 11-pesca-update | 48 | 14 | 34 | 0 | 14 | 18 |
| 12-crafting-multiplayer | 75 | 27 | 48 | 0 | 14 | 21 |
| 13-render-personagens | 116 | 52 | 64 | 0 | 13 | 19 |
| 14-arquitetura-luz-ambiente | 0 | 0 | 0 | 0 | 15 | 0 |
| 15-missoes-ui-controles | 88 | 19 | 69 | 0 | 10 | 13 |
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
| 30-desempenho | 11 | 3 | 8 | 0 | 4 | 2 |
| 31-rastro-sangue | 0 | 0 | 0 | 0 | 4 | 0 |
| 32-passageiro | 0 | 0 | 0 | 0 | 9 | 0 |
| 33-dano-visual | 0 | 0 | 0 | 0 | 4 | 0 |
| 34-caminhos-naturais | 16 | 7 | 9 | 0 | 2 | 4 |

## Matriz: quantos usos cada arquivo (linha) faz de globais de outro (coluna)

| de \ para | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 01-base | . |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 02-audio | 25 | . |  | 40 | 4 |  |  | 2 | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 03-dados | 1 |  | . | 22 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 04-estado | 25 | 1 | 3 | . |  |  |  |  |  | 3 |  | 2 |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 05-geometria | 118 | 11 | 27 | 160 | . | 6 |  | 6 | 9 |  | 4 | 1 | 11 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 2 |
| 06-interiores-portas | 42 | 11 | 7 | 36 | 1 | . |  |  |  |  |  | 1 | 30 |  |  |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |
| 07-loot-mapa | 135 | 3 | 30 | 128 | 3 | 9 | . | 14 | 21 | 2 | 5 | 1 | 5 |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 08-cidade-vilas-marcos | 135 | 3 | 17 | 136 | 21 |  | 2 | . | 5 |  | 3 | 3 | 23 |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 3 |
| 09-milharal-geracao | 212 | 10 | 87 | 285 | 40 |  | 1 | 35 | . | 2 | 3 | 8 | 125 |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  | 1 |  |  |  | 4 |
| 10-jogo-saves | 90 | 50 | 60 | 702 | 18 | 3 | 12 | 7 | 7 | . | 87 | 23 | 10 |  | 17 |  |  |  |  |  |  |  |  |  |  | 1 |  |  |  |  |  |  |  |  |
| 11-pesca-update | 274 | 41 | 67 | 912 | 63 | 2 | 3 | 5 | 20 | 66 | . | 14 | 16 |  | 5 |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |
| 12-crafting-multiplayer | 62 | 36 | 29 | 746 | 12 | 1 | 6 | 5 | 11 | 46 | 42 | . | 18 |  | 11 |  |  |  |  |  |  |  |  |  |  |  |  |  | 4 |  |  |  |  |  |
| 13-render-personagens | 302 | 39 | 23 | 252 | 13 | 22 | 2 | 2 |  | 4 | 9 | 2 | . |  | 1 |  |  |  |  |  |  |  |  |  |  | 2 |  |  |  |  |  |  |  |  |
| 14-arquitetura-luz-ambiente | 691 | 13 | 16 | 325 | 17 |  | 10 | 8 | 24 | 8 | 6 | 1 | 162 | . |  |  |  |  |  |  |  |  |  |  |  | 5 |  |  |  | 2 |  |  |  | 2 |
| 15-missoes-ui-controles | 181 | 61 | 21 | 255 |  |  | 17 |  |  | 68 | 10 | 24 | 6 |  | . |  |  |  |  |  |  |  |  |  |  |  |  |  | 1 |  |  |  |  |  |
| 16-orientacao | 2 |  |  | 5 |  |  |  |  |  |  |  |  |  |  | 2 | . |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 17-arte-menu |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 18-plantacao | 39 | 6 | 22 | 77 | 16 |  |  | 13 | 1 | 1 | 8 | 3 | 140 |  | 1 |  |  | . |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 19-cerca | 43 | 13 | 3 | 119 | 12 |  |  | 1 |  | 5 | 5 | 7 | 35 |  |  |  |  |  | . |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 20-piso-telhado | 42 | 3 | 6 | 37 | 6 |  |  | 1 |  |  | 2 | 2 | 30 |  |  |  |  |  |  | . |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 21-frutiferas | 17 | 1 | 7 | 25 | 2 |  |  |  |  |  | 2 | 3 | 13 |  | 1 |  |  |  |  |  | . |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 22-bau | 21 | 14 | 11 | 80 | 12 |  |  | 1 |  | 3 | 9 | 6 |  |  |  |  |  |  |  |  |  | . |  |  |  |  |  |  |  |  |  |  |  |  |
| 23-poco | 20 | 4 | 4 | 51 | 14 |  |  | 2 |  | 1 | 6 | 2 |  |  |  |  |  |  |  |  |  |  | . |  |  |  |  |  |  |  |  |  |  |  |
| 24-tronco | 19 | 5 | 4 | 100 | 15 |  |  | 1 |  | 1 | 6 | 2 |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |  |  |  |  |  |  |  |
| 25-icones-acoes |  |  | 16 |  |  |  |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |  |  |  |  |  |  |
| 26-clima-acabamento | 19 |  | 2 | 21 | 4 |  |  |  |  |  |  |  | 8 |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |  |  |  |  |  |
| 27-variedade-decoracao | 6 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |  |  |  |  |
| 28-modo-desktop | 45 | 2 |  | 41 |  |  | 2 |  |  | 7 | 2 |  |  |  | 2 |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |  |  |  |
| 29-sala-multiplayer | 15 | 5 |  | 38 |  |  |  |  |  |  |  | 10 |  |  | 4 |  |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |  |  |
| 30-desempenho | 4 |  | 14 | 3 |  |  |  |  |  |  |  |  | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |  |
| 31-rastro-sangue | 7 |  |  | 17 | 5 |  |  |  |  |  |  |  | 13 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |
| 32-passageiro | 8 | 4 |  | 40 |  |  | 1 | 1 |  | 4 | 6 | 7 | 12 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |
| 33-dano-visual | 1 |  |  | 5 |  |  |  |  |  |  |  | 1 | 16 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |  |
| 34-caminhos-naturais |  |  | 4 | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |

(colunas = os dois primeiros digitos do nome do arquivo)

## Globais usadas por 4 ou mais arquivos (o "miolo" compartilhado: mexer nelas e a parte arriscada)

| Nome | Tipo | Definida em | Usada em N arquivos | Usos |
|---|---|---|---:|---:|
| P | let | 04-estado:14 | 24 | 2054 |
| MP | let | 04-estado:19 | 24 | 713 |
| selectedMap | let | 04-estado:3 | 23 | 230 |
| beep | funcao | 02-audio:42 | 20 | 143 |
| ctx | const | 01-base:27 | 19 | 1124 |
| WW | let | 03-dados:2 | 19 | 105 |
| WH | let | 03-dados:2 | 19 | 94 |
| sendEvt | funcao | 12-crafting-multiplayer:112 | 19 | 64 |
| rnd | const | 01-base:16 | 18 | 433 |
| T | let | 04-estado:14 | 18 | 130 |
| toast | funcao | 11-pesca-update:1370 | 18 | 122 |
| clamp | const | 01-base:4 | 17 | 101 |
| parts | let | 04-estado:10 | 17 | 76 |
| R | funcao | 13-render-personagens:2 | 16 | 1247 |
| items | let | 04-estado:10 | 15 | 64 |
| blds | let | 04-estado:10 | 15 | 60 |
| solidPoint | funcao | 05-geometria:361 | 15 | 35 |
| pointInLake | funcao | 05-geometria:147 | 14 | 50 |
| weather | let | 04-estado:6 | 13 | 92 |
| trees | let | 04-estado:10 | 12 | 54 |
| bldAt | funcao | 05-geometria:632 | 12 | 31 |
| state | let | 04-estado:2 | 11 | 106 |
| remotePlayers | let | 04-estado:11 | 11 | 102 |
| ITEMS | const | 03-dados:182 | 11 | 70 |
| zombies | let | 04-estado:10 | 11 | 58 |
| campfires | let | 04-estado:10 | 11 | 41 |
| say | funcao | 11-pesca-update:1320 | 10 | 92 |
| dark | let | 04-estado:14 | 10 | 62 |
| tents | let | 04-estado:10 | 10 | 23 |
| onCityRoad | funcao | 08-cidade-vilas-marcos:9 | 10 | 22 |
| rint | const | 01-base:17 | 9 | 70 |
| animals | let | 04-estado:10 | 9 | 38 |
| ORLA | let | 05-geometria:159 | 9 | 38 |
| rebuildSolidGrid | funcao | 05-geometria:408 | 9 | 35 |
| lakes | let | 04-estado:10 | 9 | 32 |
| addItem | funcao | 04-estado:271 | 9 | 20 |
| $ | const | 01-base:2 | 8 | 188 |
| H | let | 01-base:48 | 8 | 103 |
| W | let | 01-base:48 | 8 | 98 |
| rocks | let | 04-estado:10 | 8 | 49 |
| atkHeld | let | 04-estado:16 | 8 | 18 |
| sprintHeld | let | 04-estado:16 | 8 | 16 |
| vehKind | funcao | 08-cidade-vilas-marcos:355 | 8 | 16 |
| track | funcao | 15-missoes-ui-controles:60 | 8 | 13 |
| Z | let | 01-base:48 | 7 | 125 |
| CFG | const | 01-base:128 | 7 | 78 |
| aud | funcao | 02-audio:11 | 7 | 59 |
| joy | const | 04-estado:203 | 7 | 58 |
| vehicles | let | 04-estado:10 | 7 | 52 |
| decorations | let | 04-estado:10 | 7 | 39 |
| shake | let | 04-estado:14 | 7 | 39 |
| KBM | let | 01-base:44 | 7 | 32 |
| DAY_SECONDS | const | 03-dados:8 | 7 | 30 |
| day | let | 04-estado:14 | 7 | 26 |
| countInv | funcao | 04-estado:282 | 7 | 24 |
| pick | const | 01-base:18 | 7 | 22 |
| pushOut | funcao | 05-geometria:439 | 7 | 14 |
| removeInv | funcao | 04-estado:287 | 7 | 11 |
| plane | let | 04-estado:13 | 6 | 62 |
| touchGas | let | 04-estado:18 | 6 | 19 |

(96 no total, mostrando ate 60)

## Candidatas a esconder (so usadas dentro do proprio arquivo)

- **01-base** (12): makeLightSprite, mmC, dispH, UI_REF, UI_MAX, MQ_H, MQ_W, UIS, uiClasses, applyUiScale, PERF_TIERS, _cl
- **02-audio** (35): muted, gAtk, ambientSrc, ambientGain, rainNoise, ACT, sndBusy, _sndT, sndThrottle, stepNoise, VOICE_BOOST, voice, ZVB, creatureGain, AVB, musicWanted, musicOn, musicGain, musicTimer, musicNext, musicStepN, musicVerb, MUSIC_BASE, MUSIC_STEP, MUSIC_CACHE, ...
- **03-dados** (12): pxLines, pxRot, PXURL, PXCV, PXLIT, hydratePx, FISH_TPL, fishGrid, FISH_POOL, WX_BASE, SEED_POOL, ZUNLOCK
- **04-estado** (6): MP_HOST_ALL, chatLog, chatUnread, chatTime, chatAddHistory, chatShowEmpty
- **05-geometria** (16): iceOf, ICE_VW, iceVehicles, orlaHit, _PAVE, _SANDP, orlaPatterns, TERR, SPG_C, spgSync, WG_C, WG, wallGrid, SOLID_GRID, wallBlockerAt, obbHitsCircle
- **06-interiores-portas** (22): FURN, ROOMFURN, BLD_ROOMS, ROOM_FLOOR, rectsHit, intConnected, intUnreached, DOOR_BREAK, doorHearable, doorSound, SLEEPERS, KEEPF, rectGap, organizeFurn, intBlocked, bldSpawnPoint, roomSpawnPoint, FLOOT, furnLootTable, SEED_BONUS, bonusSpot, FLASH_BONUS
- **07-loot-mapa** (32): LOOT_RESPAWN, PING_LIFE, pingAdd, pingBadge, pingCandidate, pingCol, ALLY_COLS, wpUpdate, WP_COL, wpDist, wpPick, bigTimer, bigPrevState, bigMapTap, drawPingsMini, RG_CELL, RG_FRAC, RG_TREE_S, RG_ROCK_S, RG_BT, RG_BR, RG_SET_T, RG_SET_R, rgKey, rgCount, ...
- **08-cidade-vilas-marcos** (24): bldDims, bldDims0, bldSize, cityPickType, cityFillBlock, cityRubble, cityPark, cityHouseFence, bldSizeRural, ruralPickType, genTown, ruralCarFree, SLED_COLS, BUGGY_COLS, ATV_COLS, prints, tracks, LM_SIDE_D, LM_SIDE_S, chestLoot, lmCurse, TRACK_W, updateTracks, drawTracks
- **09-milharal-geracao** (28): CORNT, genField, YT, _stalkCache, worldFlavor, MM_K, buildMinimap, bigBase, ANIMAL_PREY, BIRD_MAP, BIRD_FLOCK, birds, birdsReady, flockT, birdChirpT, birdSeq, BKEYS, BST, birdAnchors, birdOK, birdSound, newBird, initBirds, birdTakeoff, updateBirdsGuest, ...
- **10-jogo-saves** (34): SAVE_KEY, SAVE_PREFIX, SAVE_VER, slotKey, autoSlot, packObj, canSave, saveWorldOk, saveDayScale, iceLoad, doorsLoad, normalizeLoadout, GUEST_SKIP, guestKey, guestForget, FRUIT_FOOD, eatLock, SEED_OF, seedGain, giveSeedFor, applyUse, consumeOne, putAwayHold, closeTool, chooseWeapon, ...
- **11-pesca-update** (34): fishPop, reelHeld, rr, fishCastWait, fishPickSpecies, tryFish, fishStartReel, fishEnd, drawFishLine, autoSwitchMelee, meleeDmg, TEMP_MAP, envTemp, tempTick, BURN_R, BURN_T, BURN_DPS, burnTick, updateP, updateZ, CHAINSAW_LEN, CHAINSAW_R, chainsawHit, CAM_FAR, camSpeedZoom, ...
- **12-crafting-multiplayer** (48): canCraft, craft, STRUCT_EVT, LOCAL_GRACE, handleEvt, loadPeerJS, makeRoomCode, joinFormSync, joinErrMsg, lastRoomSet, lastRoomForget, hostRetryTimer, hostOpenPeer, hostSignalRetry, RECONN_MAX_MS, showReconnectUI, updateReconnectUI, hideReconnectUI, mpReconnectFail, mpGuestReconnectAttempt, hostResumeGuest, guestResumed, hostBuildWorld, MAP_NOME, hostSync, ...
- **13-render-personagens** (64): skinLook, snowOutfit, _shc, ZS_COMMON, ZSTYLE, ZEYE, zstyle, humanBody, meleeLeft, swingAngle, _heldCv, _heldG, _heldZ, drawHeld, armLine, TWO_HAND, humanDraw, RSP, rockKind, rockSprite, TSP, treeSprite, treeShadow, treeShadow0, TREE_ALTS, ...
- **15-missoes-ui-controles** (69): MS_GROUPS, MS_DEF, msRng, MS, msDef, msRender, ACH, ACH_MAPS, ACHD, achSave, achChime, achCheck, achSet, achMeta, _statPx, _statPy, _statSaveT, fmtDur, renderStats, achTab, achRow, renderAch, renderHostWorlds, bindSlider, bindToggle, ...
- **29-sala-multiplayer** (2): LOB_COL, lobbyLeave
- **30-desempenho** (8): GC_SZ, GC_M, GC_MAX, GC, layerBlock, layerDraw, layerWarm, groundPaint
- **34-caminhos-naturais** (9): RC, RW_A, roadWarp, rmHash, rmNoise, rmN1, roadDense, roadStamp, RPAL

## Possivelmente mortas (revisar antes de apagar: podem ser chamadas por onclick no HTML ou pelos testes)

- `updateCreatureVoices` (funcao, 02-audio:397)
- `drawAurora` (funcao, 08-cidade-vilas-marcos:589)
