# Dependencias entre os arquivos js/

Gerado por `node tools/dependencias.js`. So leitura: nada do jogo e alterado.

## Resumo por arquivo

"Expostas e usadas fora" = globais que outros arquivos usam. "So internas" = globais usadas apenas dentro do proprio arquivo (podem ser escondidas). "Possivelmente mortas" = definidas e nunca usadas (ou usadas uma vez so, na propria definicao).

| Arquivo | Globais | Usadas fora | So internas | Possivelmente mortas | Depende de (arquivos) | Usado por (arquivos) |
|---|---:|---:|---:|---:|---:|---:|
| 01-base | 45 | 40 | 5 | 0 | 0 | 22 |
| 02-audio | 68 | 32 | 35 | 1 | 5 | 19 |
| 03-dados | 47 | 34 | 13 | 0 | 2 | 19 |
| 04-estado | 84 | 79 | 5 | 0 | 6 | 21 |
| 05-geometria | 57 | 42 | 15 | 0 | 10 | 17 |
| 06-interiores-portas | 36 | 18 | 18 | 0 | 7 | 6 |
| 07-loot-mapa | 62 | 30 | 32 | 0 | 13 | 8 |
| 08-cidade-vilas-marcos | 44 | 23 | 20 | 1 | 11 | 15 |
| 09-milharal-geracao | 63 | 36 | 27 | 0 | 12 | 9 |
| 10-jogo-saves | 112 | 74 | 38 | 0 | 13 | 13 |
| 11-pesca-update | 27 | 11 | 16 | 0 | 13 | 16 |
| 12-crafting-multiplayer | 41 | 17 | 24 | 0 | 13 | 18 |
| 13-render-personagens | 96 | 48 | 48 | 0 | 12 | 14 |
| 14-arquitetura-luz-ambiente | 0 | 0 | 0 | 0 | 12 | 0 |
| 15-missoes-ui-controles | 80 | 18 | 62 | 0 | 9 | 11 |
| 16-orientacao | 0 | 0 | 0 | 0 | 3 | 0 |
| 17-arte-menu | 0 | 0 | 0 | 0 | 0 | 0 |
| 18-plantacao | 0 | 0 | 0 | 0 | 12 | 0 |
| 19-cerca | 0 | 0 | 0 | 0 | 10 | 0 |
| 20-piso-telhado | 0 | 0 | 0 | 0 | 9 | 0 |
| 21-frutiferas | 0 | 0 | 0 | 0 | 9 | 0 |
| 22-bau | 0 | 0 | 0 | 0 | 9 | 0 |
| 23-poco | 0 | 0 | 0 | 0 | 9 | 0 |
| 24-tronco | 0 | 0 | 0 | 0 | 9 | 0 |

## Matriz: quantos usos cada arquivo (linha) faz de globais de outro (coluna)

| de \ para | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 01-base | . |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 02-audio | 25 | . |  | 40 | 4 |  |  | 2 | 1 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 03-dados | 1 |  | . | 19 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 04-estado | 23 | 1 | 3 | . |  |  |  |  |  | 3 |  | 2 |  |  | 2 |  |  |  |  |  |  |  |  |  |
| 05-geometria | 118 | 7 | 27 | 147 | . | 6 |  | 5 | 9 |  | 2 | 1 | 11 |  |  |  |  |  |  |  |  |  |  |  |
| 06-interiores-portas | 42 | 11 | 7 | 36 | 1 | . |  |  |  |  |  | 1 | 30 |  |  |  |  |  |  |  |  |  |  |  |
| 07-loot-mapa | 124 | 3 | 30 | 127 | 2 | 9 | . | 14 | 21 | 2 | 5 | 1 | 5 |  | 2 |  |  |  |  |  |  |  |  |  |
| 08-cidade-vilas-marcos | 119 | 3 | 17 | 130 | 19 |  | 2 | . | 5 |  | 3 | 3 | 23 |  | 1 |  |  |  |  |  |  |  |  |  |
| 09-milharal-geracao | 203 | 10 | 87 | 273 | 40 |  | 1 | 35 | . | 3 | 3 | 6 | 126 |  | 1 |  |  |  |  |  |  |  |  |  |
| 10-jogo-saves | 91 | 51 | 47 | 685 | 17 | 2 | 12 | 10 | 7 | . | 88 | 25 | 10 |  | 18 |  |  |  |  |  |  |  |  |  |
| 11-pesca-update | 231 | 37 | 49 | 834 | 59 | 2 | 3 | 4 | 19 | 61 | . | 13 | 14 |  | 5 |  |  |  |  |  |  |  |  |  |
| 12-crafting-multiplayer | 55 | 37 | 29 | 608 | 12 | 1 | 6 | 5 | 11 | 38 | 39 | . | 18 |  | 10 |  |  |  |  |  |  |  |  |  |
| 13-render-personagens | 321 | 40 | 20 | 260 | 13 | 22 | 2 | 2 |  | 4 | 8 | 2 | . |  | 1 |  |  |  |  |  |  |  |  |  |
| 14-arquitetura-luz-ambiente | 608 | 13 | 16 | 316 | 13 |  | 8 | 8 | 23 | 7 | 3 | 1 | 176 | . |  |  |  |  |  |  |  |  |  |  |
| 15-missoes-ui-controles | 191 | 58 | 21 | 251 |  |  | 17 |  |  | 68 | 11 | 23 | 6 |  | . |  |  |  |  |  |  |  |  |  |
| 16-orientacao | 1 |  |  | 5 |  |  |  |  |  |  |  |  |  |  | 2 | . |  |  |  |  |  |  |  |  |
| 17-arte-menu |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |  |  |  |  |
| 18-plantacao | 36 | 6 | 22 | 77 | 16 |  |  | 13 | 1 | 1 | 8 | 3 | 139 |  | 1 |  |  | . |  |  |  |  |  |  |
| 19-cerca | 34 | 11 | 3 | 101 | 12 |  |  | 1 |  | 4 | 4 | 5 | 70 |  |  |  |  |  | . |  |  |  |  |  |
| 20-piso-telhado | 39 | 3 | 6 | 37 | 6 |  |  | 1 |  |  | 2 | 2 | 30 |  |  |  |  |  |  | . |  |  |  |  |
| 21-frutiferas | 17 | 1 | 7 | 25 | 2 |  |  |  |  |  | 1 | 3 | 13 |  | 1 |  |  |  |  |  | . |  |  |  |
| 22-bau | 14 | 13 | 11 | 63 | 11 |  |  | 1 |  | 3 | 8 | 6 |  |  |  |  |  |  |  |  |  | . |  |  |
| 23-poco | 15 | 4 | 4 | 51 | 14 |  |  | 2 |  | 1 | 6 | 2 |  |  |  |  |  |  |  |  |  |  | . |  |
| 24-tronco | 23 | 5 | 4 | 98 | 14 |  |  | 1 |  | 1 | 6 | 2 |  |  |  |  |  |  |  |  |  |  |  | . |

(colunas = os dois primeiros digitos do nome do arquivo)

## Globais usadas por 4 ou mais arquivos (o "miolo" compartilhado: mexer nelas e a parte arriscada)

| Nome | Tipo | Definida em | Usada em N arquivos | Usos |
|---|---|---|---:|---:|
| P | let | 04-estado:14 | 20 | 1886 |
| MP | let | 04-estado:19 | 20 | 567 |
| selectedMap | let | 04-estado:3 | 20 | 214 |
| beep | funcao | 02-audio:42 | 19 | 133 |
| rnd | const | 01-base:16 | 18 | 424 |
| sendEvt | funcao | 12-crafting-multiplayer:115 | 17 | 60 |
| toast | funcao | 11-pesca-update:1241 | 16 | 197 |
| clamp | const | 01-base:4 | 16 | 97 |
| WW | let | 03-dados:2 | 16 | 95 |
| WH | let | 03-dados:2 | 16 | 84 |
| parts | let | 04-estado:10 | 16 | 72 |
| T | let | 04-estado:14 | 15 | 113 |
| items | let | 04-estado:10 | 15 | 61 |
| solidPoint | funcao | 05-geometria:325 | 15 | 35 |
| ctx | const | 01-base:27 | 14 | 972 |
| blds | let | 04-estado:10 | 14 | 57 |
| R | funcao | 13-render-personagens:2 | 12 | 1238 |
| weather | let | 04-estado:6 | 12 | 88 |
| trees | let | 04-estado:10 | 12 | 51 |
| pointInLake | funcao | 05-geometria:111 | 12 | 41 |
| zombies | let | 04-estado:10 | 11 | 58 |
| campfires | let | 04-estado:10 | 11 | 41 |
| state | let | 04-estado:2 | 10 | 93 |
| tents | let | 04-estado:10 | 10 | 23 |
| onCityRoad | funcao | 08-cidade-vilas-marcos:9 | 10 | 22 |
| remotePlayers | let | 04-estado:11 | 9 | 91 |
| rint | const | 01-base:17 | 9 | 72 |
| ITEMS | const | 03-dados:166 | 9 | 61 |
| dark | let | 04-estado:14 | 9 | 58 |
| animals | let | 04-estado:10 | 9 | 37 |
| ORLA | let | 05-geometria:123 | 9 | 37 |
| rebuildSolidGrid | funcao | 05-geometria:365 | 9 | 33 |
| lakes | let | 04-estado:10 | 9 | 30 |
| bldAt | funcao | 05-geometria:583 | 9 | 24 |
| addItem | funcao | 04-estado:250 | 9 | 20 |
| H | let | 01-base:47 | 8 | 101 |
| W | let | 01-base:47 | 8 | 97 |
| rocks | let | 04-estado:10 | 8 | 45 |
| track | funcao | 15-missoes-ui-controles:60 | 8 | 13 |
| CFG | const | 01-base:99 | 7 | 83 |
| vehicles | let | 04-estado:10 | 7 | 48 |
| shake | let | 04-estado:14 | 7 | 35 |
| day | let | 04-estado:14 | 7 | 26 |
| countInv | funcao | 04-estado:261 | 7 | 23 |
| pick | const | 01-base:18 | 7 | 22 |
| atkHeld | let | 04-estado:16 | 7 | 15 |
| pushOut | funcao | 05-geometria:396 | 7 | 14 |
| sprintHeld | let | 04-estado:16 | 7 | 13 |
| $ | const | 01-base:2 | 6 | 153 |
| Z | let | 01-base:47 | 6 | 107 |
| plane | let | 04-estado:13 | 6 | 62 |
| joy | const | 04-estado:183 | 6 | 54 |
| decorations | let | 04-estado:10 | 6 | 38 |
| DAY_SECONDS | const | 03-dados:8 | 6 | 27 |
| vehKind | funcao | 08-cidade-vilas-marcos:353 | 6 | 14 |
| weatherTimer | let | 04-estado:7 | 6 | 13 |
| setRain | funcao | 02-audio:601 | 6 | 11 |
| bldNear | funcao | 05-geometria:579 | 6 | 11 |
| removeInv | funcao | 04-estado:266 | 6 | 10 |
| mapHasLake | funcao | 03-dados:307 | 6 | 8 |

(92 no total, mostrando ate 60)

## Candidatas a esconder (so usadas dentro do proprio arquivo)

- **01-base** (5): makeLightSprite, mmC, IS_MOBILE, dispH, PERF_TIERS
- **02-audio** (35): muted, gAtk, ambientSrc, ambientGain, rainNoise, ACT, sndBusy, _sndT, sndThrottle, stepNoise, VOICE_BOOST, voice, ZVB, creatureGain, AVB, musicWanted, musicOn, musicGain, musicTimer, musicNext, musicStepN, musicVerb, MUSIC_BASE, MUSIC_STEP, MUSIC_CACHE, ...
- **03-dados** (13): PXPAL, PXG, pxLines, pxRot, PXURL, pxData, PXCV, hydratePx, FISH_TPL, fishGrid, FISH_POOL, SEED_POOL, ZUNLOCK
- **04-estado** (5): chatLog, chatUnread, chatTime, chatAddHistory, chatShowEmpty
- **05-geometria** (15): iceOf, orlaHit, _PAVE, _SANDP, orlaPatterns, TERR, CAR_TOP, SPG_C, spgSync, WG_C, WG, wallGrid, SOLID_GRID, wallBlockerAt, obbHitsCircle
- **06-interiores-portas** (18): FURN, ROOMFURN, BLD_ROOMS, ROOM_FLOOR, rectsHit, intConnected, intUnreached, DOOR_BREAK, doorHearable, doorSound, intBlocked, bldSpawnPoint, roomSpawnPoint, FLOOT, furnLootTable, SEED_BONUS, bonusSpot, FLASH_BONUS
- **07-loot-mapa** (32): LOOT_RESPAWN, PING_LIFE, pingAdd, pingBadge, pingCandidate, pingCol, ALLY_COL, wpUpdate, WP_COL, wpDist, wpPick, bigTimer, bigPrevState, bigMapTap, drawPingsMini, RG_CELL, RG_FRAC, RG_TREE_S, RG_ROCK_S, RG_BT, RG_BR, RG_SET_T, RG_SET_R, rgKey, rgCount, ...
- **08-cidade-vilas-marcos** (20): bldDims, bldDims0, bldSize, cityPickType, cityFillBlock, cityRubble, cityPark, cityHouseFence, bldSizeRural, ruralPickType, genTown, ruralCarFree, SLED_COLS, BUGGY_COLS, ATV_COLS, prints, LM_SIDE_D, LM_SIDE_S, chestLoot, lmCurse
- **09-milharal-geracao** (27): CORNT, genField, YT, _stalkCache, worldFlavor, MM_K, buildMinimap, bigBase, ANIMAL_PREY, BIRD_MAP, BIRD_FLOCK, birds, birdsReady, flockT, birdChirpT, birdSeq, BKEYS, BST, birdAnchors, birdOK, birdSound, newBird, initBirds, birdTakeoff, updateBirdsGuest, ...
- **10-jogo-saves** (38): SAVE_KEY, SAVE_PREFIX, SAVE_VER, slotKey, autoSlot, packObj, canSave, saveWorldOk, icePack, iceLoad, doorsPack, doorsLoad, normalizeLoadout, GUEST_SKIP, guestKey, guestForget, FRUIT_FOOD, eatLock, SEED_OF, seedGain, giveSeedFor, applyUse, consumeOne, putAwayHold, closeTool, ...
- **11-pesca-update** (16): fishPop, reelHeld, rr, fishCastWait, fishPickSpecies, tryFish, fishStartReel, fishEnd, drawFishLine, autoSwitchMelee, meleeDmg, TEMP_MAP, envTemp, tempTick, updateP, updateZ
- **12-crafting-multiplayer** (24): canCraft, craft, handleEvt, loadPeerJS, makeRoomCode, hostRetryTimer, hostOpenPeer, hostSignalRetry, RECONN_MAX_MS, showReconnectUI, updateReconnectUI, hideReconnectUI, mpReconnectFail, mpGuestReconnectAttempt, hostResumeGuest, guestResumed, hostBuildWorld, setupConn, handleNetData, vehSetTarget, applySnapshot, goneList, applyGone, enterMultiplayerGame
- **13-render-personagens** (48): skinLook, snowOutfit, _shc, Sh, ZS_COMMON, ZSTYLE, ZEYE, zstyle, humanBody, meleeLeft, swingAngle, drawHeld, armLine, TWO_HAND, humanDraw, TSP, treeSprite, treeShadow, drawOpenVeh, vehDriverLook, drawRider, obsStopDrone, obsStartDrone, obsStatic, obsSpotOk, ...
- **15-missoes-ui-controles** (62): MS_GROUPS, MS_DEF, msRng, MS, msDef, msRender, ACH, ACHD, achSave, achChime, achCheck, achSet, _statPx, _statPy, _statSaveT, fmtDur, renderStats, achTab, renderAch, renderHostWorlds, lockHostWorlds, bindSlider, bindToggle, bindSeg, slotMode, ...

## Possivelmente mortas (revisar antes de apagar: podem ser chamadas por onclick no HTML ou pelos testes)

- `updateCreatureVoices` (funcao, 02-audio:397)
- `drawAurora` (funcao, 08-cidade-vilas-marcos:549)
