# Dependencias entre os arquivos js/

Gerado por `node tools/dependencias.js`. So leitura: nada do jogo e alterado.

## Resumo por arquivo

"Expostas e usadas fora" = globais que outros arquivos usam. "So internas" = globais usadas apenas dentro do proprio arquivo (podem ser escondidas). "Possivelmente mortas" = definidas e nunca usadas (ou usadas uma vez so, na propria definicao).

| Arquivo | Globais | Usadas fora | So internas | Possivelmente mortas | Depende de (arquivos) | Usado por (arquivos) |
|---|---:|---:|---:|---:|---:|---:|
| 01-base | 45 | 40 | 5 | 0 | 0 | 18 |
| 02-audio | 68 | 32 | 35 | 1 | 5 | 15 |
| 03-dados | 44 | 32 | 12 | 0 | 2 | 15 |
| 04-estado | 83 | 78 | 5 | 0 | 6 | 17 |
| 05-geometria | 57 | 42 | 15 | 0 | 10 | 13 |
| 06-interiores-portas | 31 | 16 | 15 | 0 | 7 | 6 |
| 07-loot-mapa | 62 | 30 | 32 | 0 | 13 | 8 |
| 08-cidade-vilas-marcos | 44 | 23 | 20 | 1 | 11 | 12 |
| 09-milharal-geracao | 63 | 36 | 27 | 0 | 12 | 9 |
| 10-jogo-saves | 90 | 62 | 28 | 0 | 13 | 9 |
| 11-pesca-update | 27 | 10 | 17 | 0 | 13 | 12 |
| 12-crafting-multiplayer | 40 | 17 | 23 | 0 | 13 | 14 |
| 13-render-personagens | 96 | 47 | 49 | 0 | 12 | 13 |
| 14-arquitetura-luz-ambiente | 0 | 0 | 0 | 0 | 12 | 0 |
| 15-missoes-ui-controles | 75 | 17 | 58 | 0 | 9 | 10 |
| 16-orientacao | 0 | 0 | 0 | 0 | 3 | 0 |
| 17-arte-menu | 0 | 0 | 0 | 0 | 0 | 0 |
| 18-plantacao | 0 | 0 | 0 | 0 | 11 | 0 |
| 19-cerca | 0 | 0 | 0 | 0 | 10 | 0 |
| 20-piso-telhado | 0 | 0 | 0 | 0 | 9 | 0 |

## Matriz: quantos usos cada arquivo (linha) faz de globais de outro (coluna)

| de \ para | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 01-base | . |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 02-audio | 25 | . |  | 40 | 4 |  |  | 2 | 1 |  |  |  |  |  |  |  |  |  |  |  |
| 03-dados | 1 |  | . | 18 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 04-estado | 23 | 1 | 3 | . |  |  |  |  |  | 3 |  | 2 |  |  | 2 |  |  |  |  |  |
| 05-geometria | 118 | 7 | 27 | 147 | . | 6 |  | 5 | 9 |  | 2 | 1 | 11 |  |  |  |  |  |  |  |
| 06-interiores-portas | 42 | 11 | 4 | 32 | 1 | . |  |  |  |  |  | 1 | 30 |  |  |  |  |  |  |  |
| 07-loot-mapa | 124 | 3 | 30 | 127 | 2 | 7 | . | 14 | 19 | 2 | 5 | 1 | 5 |  | 2 |  |  |  |  |  |
| 08-cidade-vilas-marcos | 119 | 3 | 17 | 130 | 19 |  | 2 | . | 5 |  | 3 | 3 | 23 |  | 1 |  |  |  |  |  |
| 09-milharal-geracao | 203 | 10 | 87 | 273 | 40 |  | 1 | 35 | . | 3 | 3 | 6 | 126 |  | 1 |  |  |  |  |  |
| 10-jogo-saves | 90 | 50 | 46 | 619 | 16 | 2 | 10 | 10 | 7 | . | 84 | 25 | 9 |  | 17 |  |  |  |  |  |
| 11-pesca-update | 229 | 37 | 49 | 808 | 59 | 2 | 3 | 4 | 19 | 59 | . | 13 | 14 |  | 4 |  |  |  |  |  |
| 12-crafting-multiplayer | 55 | 35 | 27 | 573 | 12 | 1 | 6 | 5 | 11 | 24 | 36 | . | 18 |  | 10 |  |  |  |  |  |
| 13-render-personagens | 320 | 39 | 20 | 258 | 13 | 22 | 2 | 2 |  | 4 | 8 | 2 | . |  | 1 |  |  |  |  |  |
| 14-arquitetura-luz-ambiente | 583 | 13 | 16 | 293 | 12 |  | 8 | 8 | 23 | 7 | 3 | 1 | 176 | . |  |  |  |  |  |  |
| 15-missoes-ui-controles | 173 | 51 | 21 | 220 |  |  | 17 |  |  | 55 | 11 | 23 | 5 |  | . |  |  |  |  |  |
| 16-orientacao | 1 |  |  | 5 |  |  |  |  |  |  |  |  |  |  | 2 | . |  |  |  |  |
| 17-arte-menu |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |  |
| 18-plantacao | 36 | 6 | 13 | 59 | 14 |  |  | 12 | 1 |  | 8 | 3 | 41 |  | 1 |  |  | . |  |  |
| 19-cerca | 29 | 7 | 2 | 81 | 12 |  |  | 1 |  | 3 | 2 | 3 | 70 |  |  |  |  |  | . |  |
| 20-piso-telhado | 39 | 3 | 6 | 37 | 6 |  |  | 1 |  |  | 2 | 2 | 30 |  |  |  |  |  |  | . |

(colunas = os dois primeiros digitos do nome do arquivo)

## Globais usadas por 4 ou mais arquivos (o "miolo" compartilhado: mexer nelas e a parte arriscada)

| Nome | Tipo | Definida em | Usada em N arquivos | Usos |
|---|---|---|---:|---:|
| P | let | 04-estado:13 | 16 | 1586 |
| MP | let | 04-estado:18 | 16 | 514 |
| selectedMap | let | 04-estado:3 | 15 | 198 |
| beep | funcao | 02-audio:42 | 15 | 113 |
| clamp | const | 01-base:4 | 15 | 96 |
| rnd | const | 01-base:16 | 14 | 386 |
| T | let | 04-estado:13 | 13 | 105 |
| WW | let | 03-dados:2 | 13 | 88 |
| WH | let | 03-dados:2 | 13 | 77 |
| items | let | 04-estado:9 | 13 | 55 |
| sendEvt | funcao | 12-crafting-multiplayer:100 | 13 | 50 |
| toast | funcao | 11-pesca-update:1233 | 12 | 170 |
| parts | let | 04-estado:9 | 12 | 63 |
| R | funcao | 13-render-personagens:2 | 11 | 1126 |
| ctx | const | 01-base:27 | 11 | 931 |
| weather | let | 04-estado:5 | 11 | 87 |
| zombies | let | 04-estado:9 | 11 | 58 |
| solidPoint | funcao | 05-geometria:325 | 11 | 27 |
| blds | let | 04-estado:9 | 10 | 50 |
| state | let | 04-estado:2 | 9 | 84 |
| animals | let | 04-estado:9 | 9 | 37 |
| ORLA | let | 05-geometria:123 | 9 | 37 |
| pointInLake | funcao | 05-geometria:111 | 9 | 35 |
| H | let | 01-base:47 | 8 | 100 |
| W | let | 01-base:47 | 8 | 96 |
| remotePlayers | let | 04-estado:10 | 8 | 87 |
| rint | const | 01-base:17 | 8 | 69 |
| dark | let | 04-estado:13 | 8 | 54 |
| trees | let | 04-estado:9 | 8 | 45 |
| rocks | let | 04-estado:9 | 8 | 45 |
| campfires | let | 04-estado:9 | 8 | 37 |
| lakes | let | 04-estado:9 | 8 | 28 |
| CFG | const | 01-base:99 | 7 | 83 |
| vehicles | let | 04-estado:9 | 7 | 48 |
| shake | let | 04-estado:13 | 7 | 34 |
| day | let | 04-estado:13 | 7 | 26 |
| pick | const | 01-base:18 | 7 | 22 |
| tents | let | 04-estado:9 | 7 | 20 |
| onCityRoad | funcao | 08-cidade-vilas-marcos:9 | 7 | 17 |
| track | funcao | 15-missoes-ui-controles:60 | 7 | 12 |
| $ | const | 01-base:2 | 6 | 140 |
| Z | let | 01-base:47 | 6 | 99 |
| plane | let | 04-estado:12 | 6 | 62 |
| ITEMS | const | 03-dados:140 | 6 | 55 |
| rebuildSolidGrid | funcao | 05-geometria:365 | 6 | 16 |
| atkHeld | let | 04-estado:15 | 6 | 14 |
| addItem | funcao | 04-estado:249 | 6 | 14 |
| vehKind | funcao | 08-cidade-vilas-marcos:348 | 6 | 14 |
| weatherTimer | let | 04-estado:6 | 6 | 13 |
| sprintHeld | let | 04-estado:15 | 6 | 12 |
| setRain | funcao | 02-audio:601 | 6 | 11 |
| bldNear | funcao | 05-geometria:576 | 6 | 11 |
| mapHasLake | funcao | 03-dados:274 | 6 | 8 |
| onSand | funcao | 05-geometria:131 | 6 | 8 |
| joy | const | 04-estado:182 | 5 | 51 |
| decorations | let | 04-estado:9 | 5 | 35 |
| roads | let | 04-estado:9 | 5 | 28 |
| countInv | funcao | 04-estado:260 | 5 | 20 |
| DAY_SECONDS | const | 03-dados:8 | 5 | 19 |
| decals | let | 04-estado:9 | 5 | 15 |

(84 no total, mostrando ate 60)

## Candidatas a esconder (so usadas dentro do proprio arquivo)

- **01-base** (5): makeLightSprite, mmC, IS_MOBILE, dispH, PERF_TIERS
- **02-audio** (35): muted, gAtk, ambientSrc, ambientGain, rainNoise, ACT, sndBusy, _sndT, sndThrottle, stepNoise, VOICE_BOOST, voice, ZVB, creatureGain, AVB, musicWanted, musicOn, musicGain, musicTimer, musicNext, musicStepN, musicVerb, MUSIC_BASE, MUSIC_STEP, MUSIC_CACHE, ...
- **03-dados** (12): PXPAL, PXG, pxLines, pxRot, PXURL, pxData, PXCV, hydratePx, FISH_TPL, fishGrid, FISH_POOL, ZUNLOCK
- **04-estado** (5): chatLog, chatUnread, chatTime, chatAddHistory, chatShowEmpty
- **05-geometria** (15): iceOf, orlaHit, _PAVE, _SANDP, orlaPatterns, TERR, CAR_TOP, SPG_C, spgSync, WG_C, WG, wallGrid, SOLID_GRID, wallBlockerAt, obbHitsCircle
- **06-interiores-portas** (15): FURN, ROOMFURN, BLD_ROOMS, ROOM_FLOOR, rectsHit, intConnected, intUnreached, DOOR_BREAK, doorHearable, doorSound, intBlocked, bldSpawnPoint, roomSpawnPoint, FLOOT, furnLootTable
- **07-loot-mapa** (32): LOOT_RESPAWN, PING_LIFE, pingAdd, pingBadge, pingCandidate, pingCol, ALLY_COL, wpUpdate, WP_COL, wpDist, wpPick, bigTimer, bigPrevState, bigMapTap, drawPingsMini, RG_CELL, RG_FRAC, RG_TREE_S, RG_ROCK_S, RG_BT, RG_BR, RG_SET_T, RG_SET_R, rgKey, rgCount, ...
- **08-cidade-vilas-marcos** (20): bldDims, bldDims0, bldSize, cityPickType, cityFillBlock, cityRubble, cityPark, cityHouseFence, bldSizeRural, ruralPickType, genTown, ruralCarFree, SLED_COLS, BUGGY_COLS, ATV_COLS, prints, LM_SIDE_D, LM_SIDE_S, chestLoot, lmCurse
- **09-milharal-geracao** (27): CORNT, genField, YT, _stalkCache, worldFlavor, MM_K, buildMinimap, bigBase, ANIMAL_PREY, BIRD_MAP, BIRD_FLOCK, birds, birdsReady, flockT, birdChirpT, birdSeq, BKEYS, BST, birdAnchors, birdOK, birdSound, newBird, initBirds, birdTakeoff, updateBirdsGuest, ...
- **10-jogo-saves** (28): SAVE_KEY, SAVE_PREFIX, SAVE_VER, curSlot, slotKey, autoSlot, packObj, canSave, saveWorldOk, readSave, EAT, eatLock, SEED_OF, seedGain, giveSeedFor, applyUse, consumeOne, putAwayHold, chooseWeapon, dropWeaponFromArsenal, buildWeaponWheel, nearestFurn, isVehicleOccupied, showVehicleHUD, scareAnimals, ...
- **11-pesca-update** (17): fishPop, reelHeld, rr, fishCastWait, fishPickSpecies, tryFish, fishStartReel, fishEnd, tickFishing, drawFishLine, autoSwitchMelee, meleeDmg, TEMP_MAP, envTemp, tempTick, updateP, updateZ
- **12-crafting-multiplayer** (23): canCraft, craft, handleEvt, loadPeerJS, makeRoomCode, hostRetryTimer, hostOpenPeer, hostSignalRetry, RECONN_MAX_MS, showReconnectUI, updateReconnectUI, hideReconnectUI, mpReconnectFail, mpGuestReconnectAttempt, hostResumeGuest, guestResumed, setupConn, handleNetData, vehSetTarget, applySnapshot, goneList, applyGone, enterMultiplayerGame
- **13-render-personagens** (49): skinLook, snowOutfit, _shc, Sh, ZS_COMMON, ZSTYLE, ZEYE, zstyle, humanBody, meleeLeft, swingAngle, drawHeld, armLine, TWO_HAND, humanDraw, TSP, treeSprite, treeShadow, drawOpenVeh, vehDriverLook, drawRider, obsStopDrone, obsStartDrone, obsStatic, obsSpotOk, ...
- **15-missoes-ui-controles** (58): MS_GROUPS, MS_DEF, msRng, MS, msDef, msRender, ACH, ACHD, achSave, achChime, achCheck, achSet, _statPx, _statPy, _statSaveT, fmtDur, renderStats, renderAch, bindSlider, bindToggle, bindSeg, slotMode, slotAsk, slotDateStr, renderSlots, ...

## Possivelmente mortas (revisar antes de apagar: podem ser chamadas por onclick no HTML ou pelos testes)

- `updateCreatureVoices` (funcao, 02-audio:397)
- `drawAurora` (funcao, 08-cidade-vilas-marcos:544)
