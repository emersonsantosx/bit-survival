# Dependencias entre os arquivos js/

Gerado por `node tools/dependencias.js`. So leitura: nada do jogo e alterado.

## Resumo por arquivo

"Expostas e usadas fora" = globais que outros arquivos usam. "So internas" = globais usadas apenas dentro do proprio arquivo (podem ser escondidas). "Possivelmente mortas" = definidas e nunca usadas (ou usadas uma vez so, na propria definicao).

| Arquivo | Globais | Usadas fora | So internas | Possivelmente mortas | Depende de (arquivos) | Usado por (arquivos) |
|---|---:|---:|---:|---:|---:|---:|
| 01-base | 45 | 40 | 5 | 0 | 0 | 17 |
| 02-audio | 65 | 32 | 31 | 2 | 5 | 14 |
| 03-dados | 46 | 34 | 11 | 1 | 2 | 14 |
| 04-estado | 83 | 78 | 5 | 0 | 6 | 16 |
| 05-geometria | 58 | 40 | 17 | 1 | 10 | 12 |
| 06-interiores-portas | 31 | 16 | 15 | 0 | 7 | 6 |
| 07-loot-mapa | 65 | 30 | 32 | 3 | 13 | 8 |
| 08-cidade-vilas-marcos | 39 | 19 | 19 | 1 | 11 | 11 |
| 09-milharal-geracao | 63 | 36 | 27 | 0 | 12 | 9 |
| 10-jogo-saves | 84 | 56 | 28 | 0 | 13 | 8 |
| 11-pesca-update | 27 | 10 | 17 | 0 | 13 | 11 |
| 12-crafting-multiplayer | 40 | 17 | 23 | 0 | 13 | 13 |
| 13-render-personagens | 96 | 47 | 49 | 0 | 12 | 12 |
| 14-arquitetura-luz-ambiente | 0 | 0 | 0 | 0 | 12 | 0 |
| 15-missoes-ui-controles | 77 | 17 | 58 | 2 | 9 | 10 |
| 16-orientacao | 0 | 0 | 0 | 0 | 3 | 0 |
| 17-arte-menu | 0 | 0 | 0 | 0 | 0 | 0 |
| 18-plantacao | 0 | 0 | 0 | 0 | 11 | 0 |
| 19-cerca | 0 | 0 | 0 | 0 | 9 | 0 |

## Matriz: quantos usos cada arquivo (linha) faz de globais de outro (coluna)

| de \ para | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 01-base | . |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 02-audio | 25 | . |  | 40 | 4 |  |  | 2 | 1 |  |  |  |  |  |  |  |  |  |  |
| 03-dados | 1 |  | . | 18 |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 04-estado | 23 | 1 | 3 | . |  |  |  |  |  | 3 |  | 2 |  |  | 2 |  |  |  |  |
| 05-geometria | 118 | 7 | 27 | 147 | . | 6 |  | 5 | 9 |  | 2 | 1 | 11 |  |  |  |  |  |  |
| 06-interiores-portas | 42 | 11 | 4 | 32 | 1 | . |  |  |  |  |  | 1 | 30 |  |  |  |  |  |  |
| 07-loot-mapa | 147 | 3 | 32 | 131 | 2 | 7 | . | 14 | 19 | 3 | 5 | 1 | 5 |  | 2 |  |  |  |  |
| 08-cidade-vilas-marcos | 117 | 3 | 17 | 127 | 19 |  | 2 | . | 5 |  | 3 | 3 | 23 |  | 1 |  |  |  |  |
| 09-milharal-geracao | 203 | 10 | 87 | 266 | 40 |  | 1 | 26 | . | 3 | 3 | 6 | 126 |  | 1 |  |  |  |  |
| 10-jogo-saves | 89 | 49 | 45 | 585 | 15 | 2 | 10 | 10 | 7 | . | 84 | 25 | 9 |  | 17 |  |  |  |  |
| 11-pesca-update | 226 | 37 | 48 | 801 | 58 | 2 | 3 | 4 | 19 | 57 | . | 13 | 14 |  | 4 |  |  |  |  |
| 12-crafting-multiplayer | 55 | 33 | 26 | 572 | 12 | 1 | 6 | 5 | 11 | 17 | 34 | . | 18 |  | 10 |  |  |  |  |
| 13-render-personagens | 320 | 39 | 20 | 250 | 12 | 22 | 2 | 2 |  | 4 | 8 | 2 | . |  | 1 |  |  |  |  |
| 14-arquitetura-luz-ambiente | 572 | 13 | 16 | 291 | 12 |  | 8 | 6 | 23 | 6 | 3 | 1 | 159 | . |  |  |  |  |  |
| 15-missoes-ui-controles | 173 | 51 | 23 | 222 |  |  | 17 |  |  | 51 | 11 | 23 | 5 |  | . |  |  |  |  |
| 16-orientacao | 1 |  |  | 5 |  |  |  |  |  |  |  |  |  |  | 2 | . |  |  |  |
| 17-arte-menu |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |  |  |
| 18-plantacao | 36 | 6 | 13 | 57 | 14 |  |  | 7 | 1 |  | 8 | 3 | 41 |  | 1 |  |  | . |  |
| 19-cerca | 11 | 4 | 2 | 24 | 8 |  |  | 1 |  |  | 3 | 1 | 25 |  |  |  |  |  | . |

(colunas = os dois primeiros digitos do nome do arquivo)

## Globais usadas por 4 ou mais arquivos (o "miolo" compartilhado: mexer nelas e a parte arriscada)

| Nome | Tipo | Definida em | Usada em N arquivos | Usos |
|---|---|---|---:|---:|
| P | let | 04-estado:13 | 15 | 1462 |
| MP | let | 04-estado:18 | 15 | 510 |
| selectedMap | let | 04-estado:3 | 14 | 195 |
| beep | funcao | 02-audio:34 | 14 | 109 |
| clamp | const | 01-base:4 | 14 | 92 |
| rnd | const | 01-base:16 | 13 | 370 |
| T | let | 04-estado:13 | 12 | 104 |
| WW | let | 03-dados:2 | 12 | 86 |
| WH | let | 03-dados:2 | 12 | 75 |
| sendEvt | funcao | 12-crafting-multiplayer:97 | 12 | 46 |
| toast | funcao | 11-pesca-update:1219 | 11 | 167 |
| weather | let | 04-estado:5 | 11 | 87 |
| parts | let | 04-estado:9 | 11 | 59 |
| zombies | let | 04-estado:9 | 11 | 58 |
| items | let | 04-estado:9 | 11 | 53 |
| R | funcao | 13-render-personagens:2 | 10 | 1014 |
| ctx | const | 01-base:27 | 10 | 883 |
| blds | let | 04-estado:9 | 10 | 48 |
| solidPoint | funcao | 05-geometria:325 | 10 | 26 |
| state | let | 04-estado:2 | 9 | 84 |
| animals | let | 04-estado:9 | 9 | 37 |
| H | let | 01-base:47 | 8 | 100 |
| W | let | 01-base:47 | 8 | 96 |
| remotePlayers | let | 04-estado:10 | 8 | 87 |
| dark | let | 04-estado:13 | 8 | 54 |
| trees | let | 04-estado:9 | 8 | 43 |
| rocks | let | 04-estado:9 | 8 | 43 |
| campfires | let | 04-estado:9 | 8 | 37 |
| ORLA | let | 05-geometria:123 | 8 | 36 |
| pointInLake | funcao | 05-geometria:111 | 8 | 33 |
| lakes | let | 04-estado:9 | 8 | 28 |
| rint | const | 01-base:17 | 7 | 88 |
| CFG | const | 01-base:99 | 7 | 83 |
| vehicles | let | 04-estado:9 | 7 | 48 |
| day | let | 04-estado:13 | 7 | 29 |
| pick | const | 01-base:18 | 7 | 22 |
| tents | let | 04-estado:9 | 7 | 20 |
| track | funcao | 15-missoes-ui-controles:60 | 7 | 12 |
| $ | const | 01-base:2 | 6 | 138 |
| Z | let | 01-base:47 | 6 | 99 |
| plane | let | 04-estado:12 | 6 | 62 |
| ITEMS | const | 03-dados:134 | 6 | 53 |
| shake | let | 04-estado:13 | 6 | 33 |
| atkHeld | let | 04-estado:15 | 6 | 14 |
| onCityRoad | funcao | 08-cidade-vilas-marcos:8 | 6 | 14 |
| vehKind | funcao | 08-cidade-vilas-marcos:304 | 6 | 14 |
| weatherTimer | let | 04-estado:6 | 6 | 13 |
| sprintHeld | let | 04-estado:15 | 6 | 12 |
| setRain | funcao | 02-audio:597 | 6 | 11 |
| mapHasLake | funcao | 03-dados:256 | 6 | 8 |
| joy | const | 04-estado:182 | 5 | 51 |
| roads | let | 04-estado:9 | 5 | 28 |
| DAY_SECONDS | const | 03-dados:8 | 5 | 19 |
| decals | let | 04-estado:9 | 5 | 15 |
| rebuildSolidGrid | funcao | 05-geometria:365 | 5 | 15 |
| bldAt | funcao | 05-geometria:578 | 5 | 15 |
| flash | let | 04-estado:13 | 5 | 13 |
| addItem | funcao | 04-estado:249 | 5 | 13 |
| walls | let | 04-estado:9 | 5 | 10 |
| bldNear | funcao | 05-geometria:574 | 5 | 10 |

(83 no total, mostrando ate 60)

## Candidatas a esconder (so usadas dentro do proprio arquivo)

- **01-base** (5): makeLightSprite, mmC, IS_MOBILE, dispH, PERF_TIERS
- **02-audio** (31): muted, gAtk, ambientSrc, ambientGain, rainNoise, stepNoise, VOICE_BOOST, voice, ZVB, creatureGain, AVB, musicWanted, musicOn, musicGain, musicTimer, musicNext, musicStepN, musicVerb, MUSIC_BASE, MUSIC_STEP, MUSIC_CACHE, ksBuf, MUSIC_CHORDS, MUSIC_PATTERN, MUSIC_MELODY, ...
- **03-dados** (11): PXPAL, PXG, pxLines, pxRot, PXURL, pxData, PXCV, hydratePx, FISH_TPL, fishGrid, FISH_POOL
- **04-estado** (5): chatLog, chatUnread, chatTime, chatAddHistory, chatShowEmpty
- **05-geometria** (17): iceOf, orlaHit, _PAVE, _SANDP, orlaPatterns, TERR, CAR_TOP, SPG_C, spgSync, WG_C, WG, wallGrid, SOLID_GRID, pushRect, wallBlockerAt, obbHitsRect, obbHitsCircle
- **06-interiores-portas** (15): FURN, ROOMFURN, BLD_ROOMS, ROOM_FLOOR, rectsHit, intConnected, intUnreached, DOOR_BREAK, doorHearable, doorSound, intBlocked, bldSpawnPoint, roomSpawnPoint, FLOOT, furnLootTable
- **07-loot-mapa** (32): LOOT_RESPAWN, PING_LIFE, pingAdd, pingBadge, pingCandidate, pingCol, ALLY_COL, wpUpdate, WP_COL, wpDist, wpPick, bigTimer, bigPrevState, bigMapTap, drawPingsMini, RG_CELL, RG_FRAC, RG_TREE_S, RG_ROCK_S, RG_BT, RG_BR, RG_SET_T, RG_SET_R, rgKey, rgCount, ...
- **08-cidade-vilas-marcos** (19): bldDims, bldDims0, bldSize, cityPickType, cityFillBlock, cityRubble, cityPark, bldSizeRural, ruralPickType, genTown, ruralCarFree, SLED_COLS, BUGGY_COLS, ATV_COLS, prints, LM_SIDE_D, LM_SIDE_S, chestLoot, lmCurse
- **09-milharal-geracao** (27): CORNT, genField, YT, _stalkCache, worldFlavor, MM_K, buildMinimap, bigBase, ANIMAL_PREY, BIRD_MAP, BIRD_FLOCK, birds, birdsReady, flockT, birdChirpT, birdSeq, BKEYS, BST, birdAnchors, birdOK, birdSound, newBird, initBirds, birdTakeoff, updateBirdsGuest, ...
- **10-jogo-saves** (28): SAVE_KEY, SAVE_PREFIX, SAVE_VER, curSlot, slotKey, autoSlot, packObj, canSave, saveWorldOk, readSave, EAT, eatLock, SEED_OF, seedGain, giveSeedFor, applyUse, consumeOne, putAwayHold, chooseWeapon, dropWeaponFromArsenal, buildWeaponWheel, nearestFurn, isVehicleOccupied, showVehicleHUD, scareAnimals, ...
- **11-pesca-update** (17): fishPop, reelHeld, rr, fishCastWait, fishPickSpecies, tryFish, fishStartReel, fishEnd, tickFishing, drawFishLine, autoSwitchMelee, meleeDmg, TEMP_MAP, envTemp, tempTick, updateP, updateZ
- **12-crafting-multiplayer** (23): canCraft, craft, handleEvt, loadPeerJS, makeRoomCode, hostRetryTimer, hostOpenPeer, hostSignalRetry, RECONN_MAX_MS, showReconnectUI, updateReconnectUI, hideReconnectUI, mpReconnectFail, mpGuestReconnectAttempt, hostResumeGuest, guestResumed, setupConn, handleNetData, vehSetTarget, applySnapshot, goneList, applyGone, enterMultiplayerGame
- **13-render-personagens** (49): skinLook, snowOutfit, _shc, Sh, ZS_COMMON, ZSTYLE, ZEYE, zstyle, humanBody, meleeLeft, swingAngle, drawHeld, armLine, TWO_HAND, humanDraw, TSP, treeSprite, treeShadow, drawOpenVeh, vehDriverLook, drawRider, obsStopDrone, obsStartDrone, obsStatic, obsSpotOk, ...
- **15-missoes-ui-controles** (58): MS_GROUPS, MS_DEF, msRng, MS, msDef, msRender, ACH, ACHD, achSave, achChime, achCheck, achSet, _statPx, _statPy, _statSaveT, fmtDur, renderStats, renderAch, bindSlider, bindToggle, bindSeg, slotMode, slotAsk, slotDateStr, renderSlots, ...

## Possivelmente mortas (revisar antes de apagar: podem ser chamadas por onclick no HTML ou pelos testes)

- `animalGrowl` (funcao, 02-audio:249)
- `updateCreatureVoices` (funcao, 02-audio:391)
- `PXWEATHER` (let, 03-dados:98)
- `vehicleHitsEnv` (funcao, 05-geometria:556)
- `pingNearest` (funcao, 07-loot-mapa:54)
- `tryPlaceBuilding` (funcao, 07-loot-mapa:450)
- `pickCityBuildingType` (funcao, 07-loot-mapa:470)
- `drawAurora` (funcao, 08-cidade-vilas-marcos:500)
- `dayToast` (funcao, 15-missoes-ui-controles:71)
- `_statAcc` (let, 15-missoes-ui-controles:128)
