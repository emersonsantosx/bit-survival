# Dependencias entre os arquivos js/

Gerado por `node tools/dependencias.js`. So leitura: nada do jogo e alterado.

## Resumo por arquivo

"Expostas e usadas fora" = globais que outros arquivos usam. "So internas" = globais usadas apenas dentro do proprio arquivo (podem ser escondidas). "Possivelmente mortas" = definidas e nunca usadas (ou usadas uma vez so, na propria definicao).

| Arquivo | Globais | Usadas fora | So internas | Possivelmente mortas | Depende de (arquivos) | Usado por (arquivos) |
|---|---:|---:|---:|---:|---:|---:|
| 01-base | 45 | 40 | 5 | 0 | 0 | 15 |
| 02-audio | 64 | 32 | 30 | 2 | 5 | 12 |
| 03-dados | 46 | 34 | 11 | 1 | 2 | 12 |
| 04-estado | 83 | 78 | 5 | 0 | 6 | 14 |
| 05-geometria | 58 | 40 | 17 | 1 | 11 | 10 |
| 06-interiores-portas | 31 | 16 | 15 | 0 | 8 | 6 |
| 07-loot-mapa | 65 | 30 | 32 | 3 | 13 | 8 |
| 08-cidade-vilas-marcos | 37 | 17 | 19 | 1 | 12 | 9 |
| 09-milharal-geracao | 63 | 35 | 28 | 0 | 13 | 8 |
| 10-jogo-saves | 81 | 56 | 25 | 0 | 14 | 8 |
| 11-pesca-update | 27 | 10 | 17 | 0 | 14 | 9 |
| 12-crafting-multiplayer | 40 | 17 | 23 | 0 | 14 | 11 |
| 13-render-personagens | 96 | 47 | 49 | 0 | 13 | 10 |
| 14-arquitetura-luz-ambiente | 84 | 15 | 69 | 0 | 12 | 9 |
| 15-missoes-ui-controles | 75 | 17 | 56 | 2 | 10 | 9 |
| 16-orientacao | 0 | 0 | 0 | 0 | 3 | 0 |
| 17-arte-menu | 0 | 0 | 0 | 0 | 0 | 0 |

## Matriz: quantos usos cada arquivo (linha) faz de globais de outro (coluna)

| de \ para | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 01-base | . |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 02-audio | 25 | . |  | 38 | 4 |  |  | 1 | 1 |  |  |  |  |  |  |  |  |
| 03-dados | 1 |  | . | 18 |  |  |  |  |  |  |  |  |  |  |  |  |  |
| 04-estado | 23 | 1 | 3 | . |  |  |  |  |  | 3 |  | 2 |  |  | 2 |  |  |
| 05-geometria | 118 | 7 | 27 | 147 | . | 6 |  | 5 | 9 |  | 2 | 1 | 11 | 11 |  |  |  |
| 06-interiores-portas | 42 | 11 | 4 | 32 | 1 | . |  |  |  |  |  | 1 | 30 | 2 |  |  |  |
| 07-loot-mapa | 147 | 3 | 32 | 131 | 2 | 7 | . | 14 | 19 | 3 | 5 | 1 | 5 |  | 2 |  |  |
| 08-cidade-vilas-marcos | 117 | 3 | 17 | 127 | 19 |  | 2 | . | 5 |  | 3 | 3 | 23 | 1 | 1 |  |  |
| 09-milharal-geracao | 203 | 10 | 87 | 266 | 40 |  | 1 | 23 | . | 3 | 3 | 6 | 126 | 2 | 1 |  |  |
| 10-jogo-saves | 86 | 49 | 44 | 562 | 15 | 2 | 10 | 10 | 7 | . | 79 | 24 | 9 | 1 | 17 |  |  |
| 11-pesca-update | 224 | 37 | 47 | 795 | 58 | 2 | 3 | 4 | 19 | 57 | . | 13 | 14 | 11 | 4 |  |  |
| 12-crafting-multiplayer | 55 | 31 | 26 | 568 | 12 | 1 | 6 | 5 | 11 | 17 | 32 | . | 18 | 1 | 10 |  |  |
| 13-render-personagens | 320 | 39 | 20 | 250 | 12 | 22 | 2 | 2 |  | 4 | 8 | 2 | . | 60 | 1 |  |  |
| 14-arquitetura-luz-ambiente | 567 | 13 | 16 | 288 | 12 |  | 8 | 4 | 23 | 6 | 3 | 1 | 153 | . |  |  |  |
| 15-missoes-ui-controles | 173 | 51 | 23 | 218 |  |  | 17 |  |  | 51 | 11 | 23 | 5 | 1 | . |  |  |
| 16-orientacao | 1 |  |  | 5 |  |  |  |  |  |  |  |  |  |  | 2 | . |  |
| 17-arte-menu |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | . |

(colunas = os dois primeiros digitos do nome do arquivo)

## Globais usadas por 4 ou mais arquivos (o "miolo" compartilhado: mexer nelas e a parte arriscada)

| Nome | Tipo | Definida em | Usada em N arquivos | Usos |
|---|---|---|---:|---:|
| P | let | 04-estado:13 | 13 | 1376 |
| MP | let | 04-estado:18 | 13 | 505 |
| clamp | const | 01-base:4 | 13 | 88 |
| selectedMap | let | 04-estado:3 | 12 | 187 |
| beep | funcao | 02-audio:34 | 12 | 98 |
| rnd | const | 01-base:16 | 11 | 353 |
| zombies | let | 04-estado:9 | 11 | 58 |
| T | let | 04-estado:13 | 10 | 101 |
| weather | let | 04-estado:5 | 10 | 86 |
| WW | let | 03-dados:2 | 10 | 83 |
| WH | let | 03-dados:2 | 10 | 72 |
| items | let | 04-estado:9 | 10 | 51 |
| blds | let | 04-estado:9 | 10 | 48 |
| sendEvt | funcao | 12-crafting-multiplayer:89 | 10 | 41 |
| toast | funcao | 11-pesca-update:1218 | 9 | 149 |
| state | let | 04-estado:2 | 9 | 84 |
| parts | let | 04-estado:9 | 9 | 56 |
| animals | let | 04-estado:9 | 9 | 37 |
| R | funcao | 13-render-personagens:2 | 8 | 938 |
| ctx | const | 01-base:27 | 8 | 852 |
| H | let | 01-base:47 | 8 | 100 |
| W | let | 01-base:47 | 8 | 96 |
| remotePlayers | let | 04-estado:10 | 8 | 87 |
| dark | let | 04-estado:13 | 8 | 54 |
| trees | let | 04-estado:9 | 8 | 43 |
| rocks | let | 04-estado:9 | 8 | 43 |
| campfires | let | 04-estado:9 | 8 | 37 |
| solidPoint | funcao | 05-geometria:325 | 8 | 23 |
| CFG | const | 01-base:99 | 7 | 83 |
| vehicles | let | 04-estado:9 | 7 | 48 |
| day | let | 04-estado:13 | 7 | 29 |
| lakes | let | 04-estado:9 | 7 | 27 |
| pick | const | 01-base:18 | 7 | 22 |
| tents | let | 04-estado:9 | 7 | 20 |
| $ | const | 01-base:2 | 6 | 135 |
| Z | let | 01-base:47 | 6 | 99 |
| rint | const | 01-base:17 | 6 | 86 |
| plane | let | 04-estado:12 | 6 | 62 |
| ORLA | let | 05-geometria:123 | 6 | 34 |
| shake | let | 04-estado:13 | 6 | 33 |
| pointInLake | funcao | 05-geometria:111 | 6 | 24 |
| atkHeld | let | 04-estado:15 | 6 | 14 |
| vehKind | funcao | 08-cidade-vilas-marcos:297 | 6 | 14 |
| weatherTimer | let | 04-estado:6 | 6 | 13 |
| sprintHeld | let | 04-estado:15 | 6 | 12 |
| setRain | funcao | 02-audio:586 | 6 | 11 |
| track | funcao | 15-missoes-ui-controles:60 | 6 | 11 |
| mapHasLake | funcao | 03-dados:239 | 6 | 8 |
| ITEMS | const | 03-dados:127 | 5 | 51 |
| joy | const | 04-estado:182 | 5 | 51 |
| roads | let | 04-estado:9 | 5 | 28 |
| decals | let | 04-estado:9 | 5 | 15 |
| rebuildSolidGrid | funcao | 05-geometria:365 | 5 | 15 |
| flash | let | 04-estado:13 | 5 | 13 |
| walls | let | 04-estado:9 | 5 | 10 |
| AC | let | 02-audio:2 | 4 | 188 |
| _rng | let | 01-base:6 | 4 | 61 |
| FIELD | let | 09-milharal-geracao:2 | 4 | 38 |
| decorations | let | 04-estado:9 | 4 | 30 |
| camX | let | 01-base:47 | 4 | 20 |

(78 no total, mostrando ate 60)

## Candidatas a esconder (so usadas dentro do proprio arquivo)

- **01-base** (5): makeLightSprite, mmC, IS_MOBILE, dispH, PERF_TIERS
- **02-audio** (30): muted, gAtk, ambientSrc, ambientGain, rainNoise, VOICE_BOOST, voice, ZVB, creatureGain, AVB, musicWanted, musicOn, musicGain, musicTimer, musicNext, musicStepN, musicVerb, MUSIC_BASE, MUSIC_STEP, MUSIC_CACHE, ksBuf, MUSIC_CHORDS, MUSIC_PATTERN, MUSIC_MELODY, musicPluck, ...
- **03-dados** (11): PXPAL, PXG, pxLines, pxRot, PXURL, pxData, PXCV, hydratePx, FISH_TPL, fishGrid, FISH_POOL
- **04-estado** (5): chatLog, chatUnread, chatTime, chatAddHistory, chatShowEmpty
- **05-geometria** (17): iceOf, orlaHit, _PAVE, _SANDP, orlaPatterns, TERR, CAR_TOP, SPG_C, spgSync, WG_C, WG, wallGrid, SOLID_GRID, pushRect, wallBlockerAt, obbHitsRect, obbHitsCircle
- **06-interiores-portas** (15): FURN, ROOMFURN, BLD_ROOMS, ROOM_FLOOR, rectsHit, intConnected, intUnreached, DOOR_BREAK, doorHearable, doorSound, intBlocked, bldSpawnPoint, roomSpawnPoint, FLOOT, furnLootTable
- **07-loot-mapa** (32): LOOT_RESPAWN, PING_LIFE, pingAdd, pingBadge, pingCandidate, pingCol, ALLY_COL, wpUpdate, WP_COL, wpDist, wpPick, bigTimer, bigPrevState, bigMapTap, drawPingsMini, RG_CELL, RG_FRAC, RG_TREE_S, RG_ROCK_S, RG_BT, RG_BR, RG_SET_T, RG_SET_R, rgKey, rgCount, ...
- **08-cidade-vilas-marcos** (19): bldDims, bldDims0, bldSize, cityPickType, cityFillBlock, cityRubble, cityPark, bldSizeRural, ruralPickType, genTown, ruralCarFree, SLED_COLS, BUGGY_COLS, ATV_COLS, prints, LM_SIDE_D, LM_SIDE_S, chestLoot, lmCurse
- **09-milharal-geracao** (28): CORNT, genField, YT, _stalkCache, stalkSprite, worldFlavor, MM_K, buildMinimap, bigBase, ANIMAL_PREY, BIRD_MAP, BIRD_FLOCK, birds, birdsReady, flockT, birdChirpT, birdSeq, BKEYS, BST, birdAnchors, birdOK, birdSound, newBird, initBirds, birdTakeoff, ...
- **10-jogo-saves** (25): SAVE_KEY, SAVE_PREFIX, SAVE_VER, curSlot, slotKey, autoSlot, packObj, canSave, saveWorldOk, readSave, EAT, eatLock, applyUse, consumeOne, putAwayHold, chooseWeapon, dropWeaponFromArsenal, buildWeaponWheel, nearestFurn, isVehicleOccupied, showVehicleHUD, scareAnimals, isOtherPlayerAlive, zArmor, zHeavy
- **11-pesca-update** (17): fishPop, reelHeld, rr, fishCastWait, fishPickSpecies, tryFish, fishStartReel, fishEnd, tickFishing, drawFishLine, autoSwitchMelee, meleeDmg, TEMP_MAP, envTemp, tempTick, updateP, updateZ
- **12-crafting-multiplayer** (23): canCraft, craft, handleEvt, loadPeerJS, makeRoomCode, hostRetryTimer, hostOpenPeer, hostSignalRetry, RECONN_MAX_MS, showReconnectUI, updateReconnectUI, hideReconnectUI, mpReconnectFail, mpGuestReconnectAttempt, hostResumeGuest, guestResumed, setupConn, handleNetData, vehSetTarget, applySnapshot, goneList, applyGone, enterMultiplayerGame
- **13-render-personagens** (49): skinLook, snowOutfit, _shc, Sh, ZS_COMMON, ZSTYLE, ZEYE, zstyle, humanBody, meleeLeft, swingAngle, drawHeld, armLine, TWO_HAND, humanDraw, TSP, treeSprite, treeShadow, drawOpenVeh, vehDriverLook, drawRider, obsStopDrone, obsStartDrone, obsStatic, obsSpotOk, ...
- **14-arquitetura-luz-ambiente** (69): _shC, shadeCol, bHash, ARCH, bldLook, rfEdges, rfTex, rfOverlay, RF, rfSnow, rfDisc, rfExtras, bldRoofBuild, drawRoof, bldGroundBuild, drawBldGround, bldFacadeBuild, drawFacade, updateSun, hullPts, bldShadow, GK, MAPG, WEATHG, NIGHTC, ...
- **15-missoes-ui-controles** (56): MS_GROUPS, MS_DEF, msRng, MS, msDef, msRender, ACH, ACHD, achSave, achChime, achCheck, achSet, _statPx, _statPy, _statSaveT, fmtDur, renderStats, renderAch, bindSlider, bindToggle, bindSeg, slotMode, slotAsk, slotDateStr, renderSlots, ...

## Possivelmente mortas (revisar antes de apagar: podem ser chamadas por onclick no HTML ou pelos testes)

- `animalGrowl` (funcao, 02-audio:238)
- `updateCreatureVoices` (funcao, 02-audio:380)
- `PXWEATHER` (let, 03-dados:91)
- `vehicleHitsEnv` (funcao, 05-geometria:556)
- `pingNearest` (funcao, 07-loot-mapa:54)
- `tryPlaceBuilding` (funcao, 07-loot-mapa:450)
- `pickCityBuildingType` (funcao, 07-loot-mapa:470)
- `drawAurora` (funcao, 08-cidade-vilas-marcos:493)
- `dayToast` (funcao, 15-missoes-ui-controles:71)
- `_statAcc` (let, 15-missoes-ui-controles:128)
