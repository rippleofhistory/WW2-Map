# Research checklist

Occupation fills (`public/data/world/occupation.json`) are schematic modern-border country control. Add a row only with `date | side | status | note | source | confidence`. No source, no fill change. Do not interpolate a monthly front across Ukraine or France.

Starter pack for Easy Company, Sherwood Rangers Yeomanry, and 2nd SS Das Reich. Rule for every new row: `date | place | lat | lng | note | source | confidence`. No source, no pin. Do not invent extra dates.

The live files are `public/data/normandy/units.json`, `battles.json`, `fronts.json`, and `theaters.json`, plus war-spanning stops in `public/data/world/units.json`. Field definitions are in `docs/SCHEMA.md`.

## War-global follow

One Hub id, one track, many theaters. Extra dates merge from `world/units.json`. Named-place pins only.

- `de-2-ss-panzer`: Middelburg 17 May 1940 (not Sedan), Brest 22 Jun 1941, Moscow 2 Oct 1941, Prokhorovka 12 Jul 1943, then Montauban / Tulle / Oradour. Do not pin at Bastogne.
- `21st-panzer`: El Alamein 1 Jul and 23 Oct 1942, Tunis 13 May 1943, then Caen. Gap after Africa is the rebuilt division.
- `british-7th-armoured`: Sidi Barrani, El Alamein, Tunis, Salerno, then Gold / Villers-Bocage. Skip Greece (elements only). Skip Remagen.
- `us-101st-airborne`: Sainte-Marie-du-Mont / Carentan, then Eindhoven (not Arnhem), Bastogne 19 Dec 1944.
- `de-4th-army`: Warsaw 28 Sep 1939 (not 1 Sep), Dunkirk 26 May 1940, Brest 22 Jun 1941, Moscow 2 Oct 1941.
- `de-6th-army`: Kiev 19 Sep 1941 (Army Group South, not Brest), Stalingrad 17 Jul 1942 and 2 Feb 1943.
- `su-62nd`: Stalingrad 17 Jul 1942 and 2 Feb 1943.
- `su-5th-guards-tank`: Prokhorovka, Minsk, Berlin (tagged `eastern-front`).
- `jp-25th-army`: Kota Bharu 8 Dec 1941, Kuala Lumpur 11 Jan 1942, Singapore 15 Feb 1942.
- `us-3rd-infantry`: Casablanca 11 Nov 1942 (not Fedala), Licata 10 Jul 1943, Salerno 18 Sep 1943 (not Avalanche D-Day), Anzio 22 Jan 1944, Rome 4 Jun 1944, Saint-Tropez 15 Aug 1944. Skip Colmar.
- `us-1st-armored`: Oran 8 Nov 1942, Kasserine 19 Feb 1943, Anzio 24 Jan 1944 (CCA, not Shingle D-Day).
- `canadian-1st-division`: Pachino 10 Jul 1943, Ortona 28 Dec 1943.
- `british-51st-highland`: Saint-Valery-en-Caux 12 Jun 1940 (tagged `nw-europe`), El Alamein, Pachino. Skip Caen / Charnwood.
- `us-4th-armored`: Bastogne 26 Dec 1944 (CCR relief). Not the 19 Dec 101st pin.
- `in-4th-inf`: Sidi Barrani 9 Dec 1940, El Alamein, Monte Cassino 15 Mar 1944 (not 18 May Polish II Corps).
- `us-6th-army`: Tacloban 20 Oct 1944 (Leyte landing, not 23 Oct Gulf).
- `fr-1st-army`: Marseille 28 Aug 1944. Skip Saint-Tropez.
- `pl-1st-armoured`: Falaise 19 Aug 1944 (Hill 262 / Mont Ormel, coarser commune pin). Not 16 Aug 3rd Canadian.
- `de-1st-panzer`: Sedan 13 May 1940, Abbeville 20 May 1940, Leningrad 8 Sep 1941 (Panzer Group 4). Skip Warsaw 1939. Skip Moscow.
- `de-2nd-panzer`: Sedan, Moscow Typhoon, Celles 24 Dec 1944. Do not pin at Bastogne.
- `de-15th-panzer`: Tobruk 21 Jun 1942, El Alamein, Tunis 13 May 1943. Do not continue as 15th Panzergrenadier.
- `it-ariete`: El Alamein 23 Oct 1942. Skip Gazala.
- `de-grossdeutschland`: Kharkov 15 Mar 1943 (Third Kharkov, coarser city pin). Skip Prokhorovka.
- `de-9th-army`: Moscow Typhoon, Kursk city 5 Jul 1943 (northern face), Bobruisk 29 Jun 1944. Not Prokhorovka.
- `su-8th-guards`: Berlin 16 Apr 1945. Formed from 62nd Army 16 Apr 1943; Stalingrad stays on `su-62nd`.
- `su-1st-belorussian`: Bobruisk 29 Jun 1944, Warsaw 17 Jan 1945, Berlin 16 Apr 1945. Minsk is not a second pin on this id.
- `su-1st-ukrainian`: Kiev 6 Nov 1943, Berlin 16 Apr 1945.
- `jp-15th-army`: Imphal 8 Mar 1944 (same date as `uk-14th-army`).
- `jp-14th-army`: Manila 2 Jan 1942, Corregidor 6 May 1942. Skip Bataan province.
- `jp-17th-army`: Honiara 24 Oct 1942 (Henderson Field). Not the 7 Aug 1st Marine pin.
- `jp-18th-army`: Wewak 11 May 1945. No pin after 2 Sep 1945.
- Extra stops on existing ids: `su-leningrad-front` siege lifted 27 Jan 1944; `uk-14th-army` Rangoon 3 May 1945; `us-1st-marines` Peleliu 15 Sep 1944 (skip Naha); `us-2nd-marines` Saipan 15 Jun 1944 (island pin, not Garapan); `us-2nd-armored` Gela 10 Jul 1943.
- Hub catalog ids: `canadian-1st-division` → `cdn-1st-div`; `british-51st-highland` → `uk-51st-highland`; `in-4th-inf` → `in-4th-div`; `de-2nd-panzer` → `de-2-panzer`; `de-15th-panzer` → `de-15-panzer`. Hub pages for `pl-1st-armoured` and `de-9th-army` were added to `moreUnits.js`.
- Hub-catalog tracks at existing named places: `au-6th-div` Tobruk 22 Jan 1941 (Compass capture, not the siege); `in-5th-div` Imphal; `su-1st-guards-tank` Prokhorovka and Berlin; `us-7th-army` Gela 10 Jul 1943; `de-ag-centre` Brest 22 Jun 1941, Moscow Typhoon, Bobruisk 29 Jun 1944; `de-4th-panzer` Warsaw 8 Sep 1939, Moscow Typhoon, Kursk city 5 Jul 1943; `it-folgore` El Alamein; `za-1st-div` El Alamein; `uk-2nd-army` Arromanches 6 Jun 1944; `de-ag-b` Middelburg 17 May 1940 (not Sedan); `pl-army-warsaw` Warsaw 8 Sep 1939; `us-3rd-armored` Saint-Lô 25 Jul 1944 (Cobra commune pin). Later: `jp-1st-air-fleet` Pearl Harbor and Midway; `pl-westerplatte` Gdańsk 1 Sep; `us-1st-army` Cherbourg and Remagen; `us-3rd-army` Avranches 1 Aug and Bastogne 26 Dec; `us-1st-cav` Tacloban and Manila 3 Feb 1945; `us-24th-inf` Tacloban; `us-4th-marines` Iwo Jima (not Tarawa); `us-11th-airborne` Manila 3 Feb 1945; `us-34th-inf` Algiers and Cassino 17 Jan; `us-36th-inf` Salerno 9 Sep; `uk-21st-ag` Arromanches; `uk-18th-inf` Singapore 15 Feb; `uk-1st-armoured` El Alamein; `uk-5th-inf` Dunkirk; `uk-78th-inf` Tunis and Cassino 17 Jan; `uk-11th-armoured` Caen 18 Jul Goodwood; `cdn-1st-army` Falaise 16 Aug; `uk-2nd-inf` Dunkirk (Kohima unsourced); `de-3rd-army` Warsaw 28 Sep; `uk-46th-inf` Salerno 9 Sep. Extra stops: `de-4th-panzer-army` Stalingrad 17 Jul 1942 (not the kessel); `ijn-combined-fleet` Tacloban 20 Oct 1944.
- German / Soviet / Japanese Hub-catalog batch: `de-ag-north` Gdańsk 1 Sep and Warsaw 28 Sep 1939 (Poland card only); `de-8th-army` Warsaw 28 Sep; `luftflotte-1` Gdańsk and Warsaw; `de-3-ss` Dunkirk, Kharkov, Prokhorovka; `de-5-ss` Kharkov only; `de-8-ss` Warsaw 1 Aug 1944; `de-9-ss` Caen Goodwood and Falaise (skip Arnhem/Bastogne); `de-10-ss` Caen, Falaise, Remagen (skip Berlin); `de-11-ss` Berlin; `de-7th-army` Caen 6 Jun and Falaise; `de-3-panzer` Brest, Moscow, Kharkov (skip Prokhorovka/Berlin); `de-5-panzer` Arras, Moscow, Kursk city (skip 22 Jun Brest); `de-6-panzer` Leningrad, Moscow, Kharkov; `de-8-panzer` Leningrad; `de-9-panzer` Kiev, Kharkov, Falaise; `de-10-panzer` Sedan, Dunkirk, Brest, Tunis (destroyed, stop); `de-11-panzer` Kiev, Kharkov; `de-14-panzer` Kiev and Stalingrad both dates; `de-16-panzer` Kiev, Stalingrad both dates, Salerno rebuilt; `de-17-panzer` Brest, Moscow (skip Stalingrad city); `de-24-panzer` Stalingrad both dates; `de-25-panzer` Warsaw 17 Jan 1945; `de-26-panzer` Salerno and Cassino 17 Jan; `de-116-panzer` Falaise; `su-16th-air` Stalingrad, Kursk city, Berlin; `su-baltic-fleet` Leningrad siege open and lift; `ijn-akagi` / `ijn-kaga` / `ijn-hiryu` Pearl and Midway; `ijn-shokaku` Pearl only; `ijn-yamato` Tacloban and Naha Ten-Go (sunk heading for Okinawa); `ijn-musashi` Tacloban 24 Oct (Sibuyan Sea, coarser Leyte commune).
- Hub battle overview pins at published communes: `westerplatte` (Gdańsk), `siege-of-warsaw`, `kharkov-3`, `warsaw-uprising`, `vistula-oder` (Warsaw), `dieppe`, `anzio`, `tobruk`, `first-el-alamein`, `hong-kong`, `bataan-corregidor` (Corregidor), `malaya` (Kota Bharu), `stalingrad-surrender`, `italian-campaign` (Salerno 3 Sep; Avalanche remains 9 Sep), `ten-go` (Naha 7 Apr 1945), `mers-el-kebir` (Oran 3 Jul 1940, coarser Torch harbour commune), `kiev-1941` (Kiev 19 Sep), `kiev-1943` (Kiev 6 Nov), `second-kharkov` (Kharkov 12 May 1942). Hub ids `invasion-of-poland` / `norwegian-campaign` / `battle-of-france` / `battle-of-britain` / `operation-compass` / `second-el-alamein` / `sicily` / `salerno` / `monte-cassino` / `normandy` / `leyte-gulf` alias to existing map pins. Skip Gazala (no sourced commune). Skip `italy-end` until Bologna is sourced. Skip `in-7th-div` and `uk-2nd-inf` Kohima until Kohima is sourced. Skip `de-ag-south` (Hub card is Poland 1939 only; no named Silesia commune). Skip `de-10th-army` / `de-14th-army` (Radom / Lwów unsourced). Skip `luftflotte-4`. Skip `su-belorussian-front` / `su-ukrainian-front-1939` (no named 17 Sep 1939 commune). Skip `de-4-ss` / `de-6-ss` / `de-7-ss`. Skip `us-4th-marines` at Tarawa (2nd Marines). Skip `us-3rd-marines` on 19 Feb (floating reserve). Skip ocean naval (Scapa, Denmark Strait, Bismarck, Cape Matapan, Java Sea, North Cape, Atlantic, Philippine Sea, River Plate, Coral Sea). Skip Taranto until Taranto is sourced. Skip unnamed Soviet extra battles (Smolensk, Odessa, Sevastopol, Rostov, Korsun, Budapest, Vienna, Prague, Manchuria, East Prussia, Crimea 1944).
- Europe + Pacific Hub leftover batch (named places only): Pacific `c-force` Hong Kong 8 Dec; `us-philippine-div` Corregidor 6 May; `us-pacific-fleet` Pearl / Midway / Tacloban / Tokyo; `us-7th-inf` Tacloban+Naha; `us-25th-inf` Honiara 10 Jan 1943 (relief, not 7 Aug); `us-27th-inf` Naha only; `us-32nd-inf` / `us-41st-inf` Tacloban; `us-77th-inf` / `us-96th-inf` Tacloban+Naha; `us-6th-marines` Naha; `us-5th-af` Honiara+Tacloban; `us-submarine-force` Pearl; ships Arizona / Nevada / Enterprise CV-6 (Midway+Tacloban, skip Pearl 7 Dec) / Yorktown CV-5 Midway / Hornet CV-8 Midway / Missouri Iwo+Naha+Tokyo / Indianapolis Iwo+Naha / Prince of Wales and Repulse Singapore 10 Dec / Schleswig-Holstein Gdańsk / Warspite Oslo+Salerno+Arromanches / Rodney and Belfast Arromanches / Dunkerque Oran 3 Jul / Home Fleet Oslo / Atlantic Fleet Algiers. Remaining panzer `de-12-panzer` Leningrad+Kursk city (skip Brest); `de-13-panzer` Kiev; `de-18-panzer` Brest+Moscow; `de-19-panzer` Moscow (skip Brest); `de-20-panzer` Moscow+Kursk city+Bobruisk; `de-22-panzer` Stalingrad 17 Jul only; `de-16-ss` Anzio. Soviet `su-southwestern-front` Kiev+Stalingrad; `su-stalingrad-front` / `su-don-front` Stalingrad; `su-voronezh-front` Kharkov+Kursk city; `su-steppe-front` Kursk city; `su-2nd-belorussian` Minsk+Berlin; `su-3rd-belorussian` Minsk; `su-5th-shock` Stalingrad+Warsaw+Berlin; `su-8th-air` Stalingrad; `su-13th-guards-rifle` Stalingrad 14 Sep (Volga crossing)+Kursk city+Berlin; `su-150th-rifle` Berlin; `su-316th-rifle` Moscow; `su-night-witches` Berlin only. Allied `cdn-2nd-div` Dieppe; `cdn-4th-armoured` Falaise; `us-17th-airborne` Bastogne 29 Dec; `us-12th-ag` Avranches 1 Aug; `us-35th-inf` Saint-Lô+Bastogne 26 Dec; `us-45th-inf` Gela/Salerno/Anzio; extra `us-9th-infantry` Algiers+Gela; `us-28th-inf` Paris 29 Aug; `fr-1e-dfl` Tunis+Cassino; `fr-ffi` Paris 25 Aug; `be-army-1940` Dunkirk; `ro-3rd-army` / `ro-4th-army` / `hu-2nd-army` / `it-8th-army` Stalingrad Don-flank coarser city pins; `cn-cef` Imphal; British 1st/4th Inf Dunkirk+Tunis; 6th Inf Tobruk; 15th Scottish Caen 26 Jun; 43rd Wessex Caen+Nijmegen; 44th Home Counties Dunkirk+Alamein; 53rd Welsh Caen; 59th Staffs Charnwood; 70th Inf Tobruk; 6th Armoured Tunis; 10th Armoured Alamein; 79th Armoured Arromanches; 56th London Tunis; 42nd East Lancs and 48th South Midland Dunkirk; 23rd Northumbrian Arras; 49th West Riding Caen; Gurkha Rifles Imphal+Cassino; Parachute Regiment Arnhem; SAS Algiers+Tunis; LRDG Sidi Barrani+both Alameins; Devil's Brigade Anzio; 6th SA Armoured Cassino; Fighter Command / 11 Group / Luftflotte 2 / JG 26 London 15 Sep 1940; 8th AF London 6 Jun; 9th AF Tunis+Arromanches. Extra dates: `us-36th-inf` Cassino 17 Jan; `uk-2nd-army` Eindhoven 17 Sep.
- Named-place leftover batch (Hub battles and skip-list units at published cities/harbours/capes): battle pins `bzura` (Kutno), `saar-offensive` (Saarbrücken), `suomussalmi`, `river-plate` (Montevideo harbour), `royal-oak-scapa` (Scapa Flow), `narvik`, `taranto`, `cape-matapan` (Cape Tainaron), `gazala` (Ain el Gazala), `java-sea` (Surabaya harbour), `coral-sea` (Port Moresby harbour), `bismarck-sea` (Lae), `kohima`, `philippine-sea` (Saipan), `italy-end` (Bologna), `north-cape`, `khalkhin-gol` (Nomonhan), `bessarabia-1940` (Chișinău), `smolensk-1941`, `odessa-1941`, `sevastopol`, `rostov-1941`, `case-blue` (Voronezh), `caucasus` (Novorossiysk), `rzhev`, `operation-iskra` (Shlisselburg), `dnieper` (Dnipro), `korsun`, `leningrad-novgorod` (Veliky Novgorod), `crimea-1944` (Sevastopol 9 May 1944), `lvov-sandomierz` (Lviv), `jassy-kishinev` (Iași), `belgrade-1944`, `baltic-offensive` (Riga), `budapest`, `petsamo-kirkenes` (Kirkenes), `east-prussia` (Königsberg), `vienna`, `prague`, `manchuria` (Mukden). Units include `no-6th-div` Narvik, `in-7th-div` / extra `uk-2nd-inf` Kohima, `us-7th-armored` St. Vith, `us-9th-army` Rheinberg, `us-30th-inf` Mortain, `us-99th-inf` Elsenborn, `us-442nd` / `us-10th-mountain` Bologna, `nl-princess-irene` Arromanches, `be-piron` Courseulles, `gr-epirus` Ioannina, `uk-12th-eastern` Abbeville, `uk-beauman` Rouen, Poland 1939 leftover armies, `de-ag-south` Kraków, `de-10th-army` Radom, `de-14th-army` Lviv, leftover Soviet fronts/armies, Kwantung / 6th Army at Nomonhan, harbour ships at Scapa / Taranto / Montevideo / Surabaya / North Cape. Extra dates: Eighth Army / Afrika Korps / Ariete / 1st SA / LRDG at Gazala; II Corps / Fifth Army / 6th Armoured / 56th London / 6th SA Armoured at Bologna. Theater frames widened: NW Europe north 70 / east 18.5, Eastern Front north 72, Italy south 36, Pacific north 50. Prague and Vienna tracks tagged `eastern-front`. Campaign rail adds Saar, River Plate, Taranto, Java Sea, Coral Sea, Gazala, Bismarck Sea, Italy end.
- China / Pacific leftover battles at named places: `changsha-1939` / `1941` / `1942` and `ichi-go` (Changsha), `indochina-1940` (Lạng Sơn), `wake-island`, `guam-1941` / `guam-1944` (Hagåtña), `dutch-east-indies` (Batavia), `rabaul-1942`, `burma-1942` (Rangoon), `kokoda`, `milne-bay` (Alotau), `aleutians` (Dutch Harbor), `new-georgia` (Munda), `bougainville` (Cape Torokina), `kwajalein`, `biak`, `saipan`, `tinian`, `peleliu`, `luzon` (Lingayen), `manila-1945`, `meiktila`. Special-ops pins: `chariot` (Saint-Nazaire), `claymore` (Svolvær), `archery` (Måløy), `gunnerside` / `freshman` (Rjukan), `frankton` (Bordeaux), `harling` (Gorgopotamos), `gran-sasso` (Campo Imperatore), `anthropoid` (Prague 27 May 1942), `jaywick` (Singapore harbour). Soviet leftover numbered armies and Guards/tank/air armies follow existing Eastern Front commune pins. Japanese leftover area armies, South Seas Detachment, 2nd Tank, 1st Raiding (Palembang), 64th Sentai, Tainan / 201st air groups. Special forces `soe` / `oss` / `bletchley-park` / `de-brandenburg` / `su-partisans` / `pl-cichociemni` / `fr-bcra` / `au-z-special`. SS leftovers at Leningrad / Warsaw Uprising / Berlin. Named panzer Müncheberg / Kurmark / Jüterbog / Kempf. Polish 1939 air force and navy. Pacific frame west 100 / north 55 (Changsha, Lạng Sơn, Dutch Harbor). NW Europe south 44 (Bordeaux).
- Leftover-3 extra dates on existing tracks at leftover-1/2 named places: `21st-panzer` / `british-7th-armoured` / `british-50th-division` at Gazala (50th also Dunkirk and Second Alamein), `hms-belfast` North Cape, `uss-yorktown-cv5` / `ijn-shokaku` Coral Sea (Port Moresby harbour), `jp-15th-army` / `jp-33rd-div` Meiktila, `jp-18th-army` Lae (Bismarck Sea convoy), `jp-4th-fleet` Rabaul, `su-leningrad-front` Shlisselburg / Veliky Novgorod / Riga. New Hub identity units: `hmcs-haida` Arromanches, `raf-bomber-command` London 15 Sep 1940, `de-29-ss-italia` Anzio, `de-34-ss` Arnhem.
- Leftover-4 extra dates on existing tracks at leftover-1/2 named places: `british-3rd-division` Dunkirk, `de-panzer-lehr` Bastogne, `de-7th-panzer` Dunkirk and Moscow (skip Sedan and Brest), `us-5th-army` Anzio, `su-western-front` Smolensk and Rzhev, `su-8th-guards` / `su-1st-guards-tank` Warsaw (Vistula–Oder; skip `su-5th-guards-tank` Warsaw — East Prussia with 2nd Belorussian), `de-8th-army` Kutno (Bzura; skip `de-4th-army` Kutno), `su-volkhov-front` Veliky Novgorod (skip `su-2nd-shock` Novgorod — Oranienbaum/Iskra axis), `de-9-ss` / `de-10-ss` Arnhem (skip Bastogne), `su-voronezh-front` / `su-steppe-front` / `su-central-front` / `su-13th-guards-rifle` Dnipro, `su-1st-ukrainian` Korsun and Lviv (skip Dnieper before the October 1943 rename; skip Warsaw), `su-8th-air` Korsun and Iași, `su-51st-army` Riga. No new Hub identity units. Skip AA divisions on London, Remagen-vs-Plunder, Gela-vs-Syracuse, Bastogne for northern-shoulder units, parent fleets, 2nd Marines at Honiara 7 Aug (Tulagi), and Bologna stacking on Fifth Army.
- Still skipped: Finnish army / `fi-9th-div` (no `side` enum). `de-23-panzer` / `de-27-panzer` (no Hub unit cards). `uk-52nd-lowland` (Dunkirk is the wrong fight; Cherbourg 17 Jun 1940 is outside the Hub dunkirk window). `uk-11th-east-africa` / `uk-36th-inf` / `uk-81st-west-africa` / `uk-82nd-west-africa` (Arakan / NCAC, not Imphal or Kohima). `us-37th-inf` / `us-43rd-inf` (New Georgia, not Guadalcanal — Hub cards still only list Guadalcanal). `us-5th-inf` unnamed Overlord commune. `us-7th-army` Dragoon (no Hub Dragoon battleId). `us-15th-af` (Foggia is not the Italy-end fight). `au-7th-div` / `us-avg` / `us-14th-af` / `nl-knil` empty battleIds. AA and UK county/home divisions with empty battleIds. Individual BoB squadrons. `uk-commandos` stays aliased to `uk-47-rm-commando`. Mid-ocean Denmark Strait / sinking of Bismarck / Battle of the Atlantic (no named shore). `sino-japanese-war` 7 July 1937 is before the war-window parser (`1939-09-01`). `de-7-ss` and later SS mountain/anti-partisan cards with empty battleIds. Tirpitz / HMAS Sydney. Parent HQ/service cards (`de-okw`, `de-okh`, `uk-cos`, `us-shaef`, `su-stavka`, `jp-ighq`, `su-red-army`, `su-vvs`, `jp-ija`, `jp-ijn`, `jp-ija-air`, `jp-ijn-air`, `de-heer`, `us-coast-guard`). `fj-infantry` (Hub lists Guadalcanal 7 Aug, not Bougainville). `pl-army-prusy` / `pl-army-karpaty` / `pl-nog-narew` (no named commune on 1 Sep). `uk-y-division` (Tunisia campaign-start date is too early). `de-14-ss` Brody is not the Bagration Minsk pin. `de-20-ss` / `de-26-ss` / `de-30-ss` / `de-38-ss` Hub battle places are the wrong fight. `hist-*` people in specialOps. `it-decima-mas` Hub battles are Taranto/Matapan (wrong fight). Unnamed towns. Wikipedia overlays.

Schematic fronts (named communes only): Sedan–Dinant 10 May 1940, Dunkirk–Calais 26 May 1940, Warsaw–Modlin 28 Sep 1939, Brest–Białystok 22 Jun 1941, Leningrad–Kronstadt 8 Sep 1941, Moscow–Klin 2 Oct 1941, Stalingrad Tractor Factory–city 17 Jul 1942 and 2 Feb 1943, Kursk–Prokhorovka 12 Jul 1943, Vitebsk–Minsk 22 Jun 1944, Seelow–Berlin 16 Apr 1945, El Alamein–Tel el Eisa 23 Oct 1942, Oran–Algiers 8 Nov 1942, Johor Bahru–Singapore 8 Feb 1942, Gela–Syracuse 10 Jul 1943, Eindhoven–Nijmegen–Arnhem 17 Sep 1944, Bastogne–St. Vith 19 Dec 1944. Eastern Front sectors stay simultaneous (Leningrad during Stalingrad).

## Easy Company, 506th PIR (`easy-company-506`)

Pull 506th S-3 / AAR and 101st G-3 from NARA before trusting Ambrose or the series for coordinates.

Starter pins already in the pack:

- 6 June Brécourt Manor `49.390056, -1.226111`
- 10–12 June Carentan
- 13 June Bloody Gulch

Named on the advance but **not** pinned until a diary date exists: Sainte-Marie-du-Mont, Saint-Côme-du-Mont.

World extra date (not in the Normandy file): 5 June RAF Upottery (`theater: "nw-europe"`) from the airfield Wikipedia page — Easy Company / 506th PIR boarded C-47s here for the first combat jump. Confirm against 506th S-3 / AAR. Band of Brothers is television.

Next pins: DZ C, Hiesville, Dead Man’s Corner, then later Bois Jacques. Do not put those in the Normandy file. Eindhoven 17 Sep and Bastogne 19 Dec are already on the world stub.

## Sherwood Rangers Yeomanry (`sherwood-rangers-yeomanry`)

TNA WO 171 regiment and 8th Armoured Brigade diaries.

Starter pins:

- 6 June Gold Jig (Asnelles / Le Hamel)
- 7 June Bayeux
- no 8 June row
- 9–13 June Point 103 / Saint-Pierre
- 11 June: Laycock killed at Saint-Pierre (note on that row)

They are **not** the regiment in Villers-Bocage. That fight is tagged to `4th-county-of-london-yeomanry` and `de-ss-pz-abt-101`.

After 13 June: Tilly, Fontenay, Rauray, Hottot, Mont Pinçon. Keep A Squadron (first into Bayeux) separate from the DD squadrons on 6–7 June if you want squadron resolution.

Deep link alias: `?unit=sherwood-rangers` still opens this unit.

## 1st Battalion, Hampshire Regiment (`uk-1-hampshires`)

TNA WO 171/1305 June 1944, transcribed at Normandy War Guide. Parent 50th Division / 231st Brigade. One track object per Place-column day at a named commune. Sheet 7F/1 six-figure grids are quoted, not converted.

- 6 June Arromanches (landed Jig Green / Le Hamel, stormed Arromanches; Bn HQ Saint-Côme-de-Fresné is not a second pin)
- no 7–8 June row (Place RUBERSY)
- 9 June Bayeux (south-west of the town, took over from 2nd Essex)
- 10 June Saint-Paul-du-Vernay (Bn HQ grid 749698)
- 11–12 June Bernières-Bocage
- no 13–18 June row (Place LA SENAUDIERE, a lieu-dit)
- 19 June Lingèvres (then dug in north of Hottot)
- 20–30 June Hottot-les-Bagues (Place HOTTOT AREA)

German opposite units from Ziegelmann Ia Fernsprech-Meldebuch 6 June 1944 (MS B-388 / BArch ZA 1/738; Wikisource French transcription). Map-only ids; no Hub cards, no MAP_TO_HUB.

- 6 June Arromanches: Grenadier-Regiment 726 (`de-726-gr`), parent 716th Infantry Division. 05.06 WNs toward Arromanches; 07.35 landing imminent near Arromanches on the division right boundary. Same-day WN/Asnelles reports are not a second pin. `de-716-inf` stays at Luc-sur-Mer.
- 6 June Asnelles (Gold Jig coords): I./Grenadier-Regiment 916 (`de-916-i`), parent 352nd Infantry Division. 11.14 I./916 attack on cote 22 east of Asnelles. 14.05 redirect toward Saint-Côme-de-Fresné is the same calendar day, not a second pin. 1 June garrison CP at Ryes is not a 6 June fight. II./916 stays on the Omaha hinterland; do not smear Formigny onto Gold. `de-352nd` stays at Formigny.

Skip until a German Place/KTB names the commune: 8–9 June Bayeux (Essex ID of 1 Bn 916 GR is Allied, not German Place); 10 June Saint-Paul-du-Vernay (1 June GR 915 CP; Kampfgruppe Meyer ordered west on 6 June 03.15); 11–12 June Bernières-Bocage; 13–18 June La Senaudière (lieu-dit); 19 June Lingèvres for Panzer Lehr (British took the village 14 June; Hants used it as a start line); 12th SS (eastern Tilly/Fontenay, not 231 Bde west of Tilly); 276 Inf at Hottot (July). Panzer Lehr stays on the existing 11 June Tilly pin; no extra Hottot date until Bayerlein/KTB names that commune on a dated row.

## 2nd SS Panzer Das Reich (`de-2-ss-panzer`)

Do not put Tulle, Oradour, and Mortain on one marker. Split Der Führer / Deutschland / the panzer regiment once you have column dates.

Starter pins:

- 6 June Montauban (still there on D-Day)
- no 7 or 8 June town row (march starts 8 June; no fake town)
- 9 June Tulle
- 10 June Oradour-sur-Glane, **I./Der Führer only**
- Loire crossings from 13 June are not pinned until a named crossing is sourced
- First Normandy fighting is later in the month

Allow this unit to draw outside the Normandy bounding box. Following it before 15 June flies the camera south. Caption: “Not yet on the Normandy front.” If an overview parks them in the bocage on 6 June, the map is wrong.

## Villers-Bocage, 13 June

Tagged units only: 4th County of London Yeomanry and s.SS-Pz.Abt. 101. Play does not glue the Sherwood Rangers onto Wittmann.

## Coarser division / regiment pins

101st, 506th, US 1st ID, British 3rd, British 50th, 7th Armoured, 3rd Canadian, 12th SS, 21st Panzer. One sourced place per dated row. 12th SS has no 6 June lodgement pin.

Added D-Day / lodgement pins on both sides, still coarser commune or beach locations:

- Allied: US 4th (Utah / La Madeleine), US 29th (Vierville), 82nd (Sainte-Mère-Église), British 6th Airborne (Ranville), 2nd Rangers (Pointe du Hoc), US 2nd Infantry (Saint-Laurent, 7 June), US 90th (Sainte-Mère, 8 June), 47 RM Commando (Asnelles 6 June / Port-en-Bessin 7 June)
- Axis: 716th (Luc-sur-Mer), GR 726 (Arromanches, 6 June; Ziegelmann Ia), 352nd (Formigny), I./GR 916 (Asnelles, 6 June; Ziegelmann Ia 11.14), 709th (Montebourg), 91st Luftlande (Picauville), FJR 6 (Saint-Côme-du-Mont / Carentan / Méautis), 243rd (La Haye-du-Puits), 346th (Sallenelles), Panzer Lehr (Tilly-sur-Seulles, 11 June), 17th SS (Méautis, 13 June)

D-Day −1 airborne takeoff and battalion fights (map-only; keep `british-6th-airborne` at Ranville):

- `cdn-1-para` 5 June RAF Down Ampney (`theater: "nw-europe"`, WO 179/2950 emplane 2245/2300) then 6 June Varaville (C Company). Skip Bulford barracks as the combat pin. Skip Robehomme / Le Mesnil extra 6 June pins.
- `uk-2-oxf-bucks` 5 June RAF Tarrant Rushton (`theater: "nw-europe"`) then 6 June Bénouville (00:16 coup-de-main). Harwell/Keevil lift is the same 6 June calendar day, not a second pin.
- `uk-9-para` 6 June Merville-Franceville-Plage. No 5 June English-airfield pin until the diary names the field.
- Easy Company 5 June Upottery lives on the world stub (`theater: "nw-europe"`). Do not put it in the Normandy file.

Canadian Juno battalions (map-only; keep `canadian-3rd-division` at Courseulles). Bernières-sur-Mer is not Bernières-Bocage:

- `cdn-qor` 6 June Bernières-sur-Mer (Nan White).
- `cdn-north-shore` 6 June Saint-Aubin-sur-Mer (Nan Red).
- `cdn-regina-rifles` 6 June Courseulles (Nan Green), battalion grain on the same commune as the division.
- `cdn-rwr` 6 June Graye-sur-Mer (Mike; A and C Companies, D-Day Overlord). Ste-Croix / Banville / Creully same day not a second pin.
- `cdn-c-scot` 6 June Graye-sur-Mer (reinforced from 08:05).
- `cdn-1-hussars` 6 June Graye-sur-Mer (DD tanks). Distinct from Regina at Courseulles.
- `cdn-chaudiere` 6 June Bény-sur-Mer (C Company; Juno Beach Centre / D-Day Overlord). Bernières landing same day not a second pin.
- `cdn-fort-garry` 6 June Bény-sur-Mer (tanks with Chaudière). Distinct from QOR at Bernières.
- `cdn-nnsh` 6 June Villons-les-Buissons (northern outskirts late afternoon; village seized 7 June, same commune).

Sword / Gold extras (map-only):

- `uk-4-commando` 6 June Ouistreham. `fr-kieffer` is a separate Ouistreham pin (battalion grain).
- `uk-6-commando` 6 June Colleville-Montgomery (passed through toward Pegasus). Queen Red landing / Bénouville link-up same day not a second pin.
- `uk-1-suffolks` 6 June Colleville-Montgomery (WN19 / Hillman). British 3rd Division stays at Hermanville.
- `uk-1-south-lancs` 6 June Hermanville-sur-Mer only (WO 171/1332 Place Hermanville). Skip 8 June Bénouville and later Le Landel / Cazelle so last-reported does not park there.
- `uk-41-rm-commando` 6 June Lion-sur-Mer (Queen White / WN21 Trout).
- `uk-48-rm-commando` 6 June Langrune-sur-Mer (WN26). Saint-Aubin landing same day not a second pin.
- `uk-6-green-howards` 6 June Ver-sur-Mer (Mare Fontaine WN32). `uk-7-green-howards` same commune via D112. 1 Hants stays at Arromanches; SRY stays Gold Jig / Asnelles.

British airborne remainder (map-only; keep `british-6th-airborne` at Ranville):

- `uk-7-para` 5 June RAF Keevil (`theater: "nw-europe"`, Wikipedia RAF Keevil 5th Para Bde) then 6 June Bénouville (west-bank defence). Ox and Bucks stays at the bridge.
- `uk-12-para` 5 June Keevil then 6 June Ranville (WO 171 Place Ranville). Le Bas de Ranville is a hamlet, not pinned.
- `uk-13-para` 5 June Keevil then 6 June Ranville (village cleared 0300). Battalion grain vs 6th AB / 12 Para.
- `uk-8-para` 6 June Touffréville (WO 171/1240 Place). Troarn / Bures bridges same day not a second pin. Bois de Bavent is a wood, not pinned.

US airborne remainder (map-only; keep `us-101st-airborne` at Sainte-Marie-du-Mont and `us-82nd-airborne` at Sainte-Mère-Église; 506 PIR stays DZ C):

- `us-501-pir` 6 June Angoville-au-Plain (DZ D). No 5 June Merryfield pin: Wikipedia Merryfield names 101st Airborne, not 501 PIR.
- `us-502-pir` 5 June RAF Greenham Common (`theater: "nw-europe"`, Eisenhower / Company E 502nd about 20:30) then 6 June Saint-Martin-de-Varreville (Exit 4 / WN108).
- `us-505-pir` 6 June Sainte-Mère-Église (3/505). No 5 June Cottesmore pin: Wikipedia RAF Cottesmore does not name the regiment.
- `us-507-pir` 6 June Chef-du-Pont (Ostberg 1/507). La Fière is a lieu-dit, not pinned.
- `us-508-pir` 6 June Picauville (DZ N). US vs 91st Luftlande on the same commune is allowed.

US beach remainder (regiment grain vs parent division): `us-16-inf` Saint-Laurent with 1st ID; `us-116-inf` Vierville with 29th; `us-8-inf` La Madeleine with 4th ID; `us-5th-rangers` Vierville (distinct from 2nd Rangers at Pointe du Hoc).

German opposite: `de-736-gr` 6 June Graye-sur-Mer (II./736 at WN31). `de-716-inf` stays at Luc-sur-Mer. `de-726-gr` stays at Arromanches. `de-744-gr` 6 June Cabourg (711th, east of the Dives). `de-914-gr` 6 June Pointe du Hoc (II./914 behind the battery; Wikipedia 352nd). `de-pzgren-192` 7 June Villons-les-Buissons (opposite NNSH / Sherbrooke). Do not smear 12th SS onto 6 June (Authie is 7 June). `de-352nd` stays Formigny. `de-916-i` stays Asnelles.

Overlord OOB remainder (map-only; battalion grain on a parent commune is allowed when the diary names it):

- `uk-2-east-yorks` 6 June Saint-Aubin-d'Arquenay (WO 171/1397 Place after Daimler). Night west of Hermanville same day not a second pin. 1 S Lancs stays Hermanville.
- `uk-5-east-yorks` 6 June Ver-sur-Mer (King Red / La Rivière is a hamlet of Ver). Grain vs Green Howards.
- `uk-2-devons` 6 June Ryes (WO 171/1278 B Coy 1625) then 7 June Longues-sur-Mer battery (C Coy 1053). Asnelles bypass same day not a second pin.
- `uk-1-dorsets` 6 June Asnelles (WO 171/1284 / D-Day Overlord). Grain vs 47 RM and GR 916. 1 Hants stays Arromanches.
- `uk-45-rm-commando` 6 June Sallenelles (D-Day Overlord; reached then driven back to Le Plein). 9 Para stays Merville.
- `uk-3-commando` 6 June Amfreville, Calvados (3 Troop ~1400; Pegasus Archive). La Brèche landing same day not a second pin. Not the Manche Amfreville.
- `uk-13-18-hussars` 6 June Colleville-Montgomery (B Sqn at Daimler with 2 EY, WO 171/1397). Grain vs Suffolks / 6 Commando.
- `uk-4-7-rdg` 6 June Ver-sur-Mer with 7th Green Howards.
- `us-18-inf` 6 June Colleville-sur-Mer (Omaha Beachhead; 2nd Bn 1233). Distinct from Colleville-Montgomery.
- `us-115-inf` 6 June Saint-Laurent-sur-Mer (115th AAR Fox Green then south of the town). Grain vs 16th Inf.
- `us-12-inf` 6 June Beuzeville-au-Plain (Utah Beach to Cherbourg, left of 502 PIR).
- `us-22-inf` 6 June Saint-Germain-de-Varreville (relieved 502 PIR). Distinct from Saint-Martin-de-Varreville.
- `us-325-gir` 7 June Carquebut (HMDB D+1 Hackensack). No 6 June pin.
- `us-327-gir` 6 June Sainte-Marie-du-Mont (HMDB amphibious Utah then link-up). Grain vs 101st.
- `cdn-sherbrooke` 7 June Villons-les-Buissons (D-Day Overlord dawn seizure with NNSH). No 6 June Bernières pin.

Sword inland / Omaha follow-up (map-only):

- `uk-2-ksli` 6 June Biéville-Beuville (D-Day Overlord Biéville-sur-Orne / Soldiers of Shropshire). Lébisey wood same day is a lieu-dit, not pinned. 3rd Division stays Hermanville.
- `uk-1-norfolks` 6 June Biéville-Beuville (D-Day Overlord: Royal Norfolk took Beuville). Grain vs 2 KSLI.
- `uk-staffs-yeo` 6 June Biéville-Beuville (27th Armoured Brigade tanks with 185th Brigade).
- `de-pzgren-125` 6 June Colombelles (II./125 CP, D-Day Overlord). I./125 Vimont same day not a second pin. 21st Panzer stays Caen. 6th AB stays Ranville.
- `de-pz-22` 6 June Biéville-Beuville (II./Panzer-Regiment 22 afternoon counter-attack). Lion-sur-Mer coastal reach same day not a second pin.
- `us-175-inf` 9 June Isigny-sur-Mer (175th AAR 0430 9 June). No 7 June Vierville landing pin.
- `us-26-inf` 6 June Colleville-sur-Mer (landed ~2100 E-3; D-Day Overlord / Omaha Beachhead). Formigny later days not pinned. 16th Inf stays Saint-Laurent. de-352nd stays Formigny.

Skip until a distinct named commune is sourced: Highland Light Infantry of Canada / Stormont, Dundas and Glengarry (9th Bde stuck at Bernières then Bény assembly — smear); 1st Royal Ulster Rifles / 12th Devons airlanding LZ until the diary names Ranville vs LZ W; 2nd Royal Warwickshire (Bénouville evening smear vs Ox and Bucks / 7 Para); 12th SS as a 6 June Juno opposite; 711th Division HQ at Vauville (Calvados vs Manche ambiguous); GR 915 Kampfgruppe Meyer inland of Omaha (Saint-Paul-du-Vernay is the 1 June garrison list).

Panzer Lehr and 17th SS have no 6 June lodgement pin. FJR 6 is the regiment (`de-fjr-6`), not 6th Fallschirmjäger Division (`de-6-fj`). Villers-Bocage stays 4 CLY and s.SS-Pz.Abt. 101 only.

## Operation Overlord (Wikipedia finding aid)

Wikipedia [Operation Overlord](https://en.wikipedia.org/wiki/Operation_Overlord) is a finding aid only. Pin `date | place | lat | lng | note | source | confidence`. Do not digitize the lodgement/breakout rasters. Do not invent west-Cotentin towns.

Added commune pins:

- 6 June Arromanches: 1st Battalion, Hampshire Regiment (`uk-1-hampshires`). Extra June dates from TNA WO 171/1305 (Normandy War Guide): 9 June Bayeux, 10 June Saint-Paul-du-Vernay, 11–12 June Bernières-Bocage, 19 June Lingèvres, 20–30 June Hottot-les-Bagues (Place HOTTOT AREA). Skip 7–8 June Place RUBERSY until the commune is identified. Skip 13–18 June Place LA SENAUDIERE (lieu-dit). Sheet 7F/1 grids (749698 Bn HQ, 778684 Point 110, 813664 / 813668 / 811668 / 808604) are quoted in notes and not converted.
- 26 June Cherbourg: US 9th, 4th, and 79th Infantry. No pin for the 17 June west-coast cut-off (unnamed town in Overlord)
- 8 July Caen (Charnwood) and 18 July Caen (Goodwood): battle markers. Overlord does not name the Allied divisions those days. 21st Panzer and 12th SS stay on last-reported Caen/Authie pins
- 25 July Saint-Lô (Cobra start), 30 July Vire (Bluecoat objective, not a sourced capture), 1 August Avranches, 11 August Alençon: battle markers without a named division
- 16 August Falaise: 3rd Canadian Division. Overlord names “the Canadians”; 2nd Canadian Division is not pinned (Forêt de la Londe is a forest, not a commune)
- 24–25 August Paris: 2e DB and US 4th Infantry
- 25 August Elbeuf: US 2nd Armored
- 30 August Rouen: 3rd Canadian Division

Skipped: Epsom communes (Cheux / Baron-sur-Odon not in Overlord), 1st/9th/10th SS and 2nd Panzer (no named commune), army HQ at Le Mans, beach-arrival-only divisions from the Allied list, Das Reich at Mortain.

## Other WW2 battles (battalion grain at published communes)

Same honesty as Overlord: named commune + source, no invented coords. Theater files other than Normandy stay empty; extra ids and extra dates live in `public/data/world/units.json`. This pass is not every battalion of every battle.

- Market Garden: `uk-2-para` 17 September Arnhem road bridge (Pegasus Archive / ParaData). `uk-1st-airborne` extra 19 September Oosterbeek (Hartenstein). `us-504-pir` Salerno 14 September 1943 then Nijmegen 17 September 1944. `us-506-pir` world extra Eindhoven 17 September. `us-505-pir` world extra Groesbeek 17 September. `pl-1-sbs` 21 September Driel. `uk-irish-guards` 17 September Valkenswaard (Guards Armoured stays Nijmegen 20 September). 9th/10th SS stay Arnhem.
- Cassino: `de-1-fj` 15 March 1944 Monte Cassino (third battle; occupied the ruins after the 15 February bombing). Opposite 2nd NZ / 4th Indian on the same commune. `pl-3-carpathian` 18 May grain vs Polish II Corps on the abbey capture.
- Ardennes: `de-kg-peiper` 17 December Malmedy (Baugnez, Bévercé district) then 24 December La Gleize (US Army Ardennes ch. XVI breakout). `us-327-gir` and `us-501-pir` world extra Bastogne 19 December. `de-1-ss` still has no Bastogne pin.
- Anzio: `us-1-rangers` 30 January 1944 Cisterna di Latina (Battle of Cisterna). 3rd Infantry stays at Anzio.
- Tarawa: `us-8-marines` 20 November 1943 Betio, grain vs 2nd Marine Division.
- Iwo Jima: `us-28-marines` 23 February 1945 (Suribachi). `us-27-marines` 19 February grain vs 5th Marine Division on the landing pin (Red/Green beaches; 26th Marines was the afternoon reserve).
- Rhine / Varsity: `us-17th-airborne` extra 24 March 1945 Wesel. `british-6th-airborne` world extra Hamminkeln (Normandy file keeps Ranville). Distinct communes; infobox midpoint unused.
- Dieppe: `cdn-ssr` 19 August 1942 Hautot-sur-Mer (Pourville / Green Beach). `uk-4-commando` world extra Varengeville-sur-Mer (Orange / Hess). 2nd Canadian Division stays Dieppe town.
- Crete / Maleme: `de-7-flieger` and `nz-22-bn` 20 May 1941 Maleme (`theater: "italy"`; lat is south of the Italy bound). Do not alias 7 Flieger to `de-1-fj`. Do not smear `nz-2nd-div` onto the airfield.
- Calais 1940: `uk-30-bde` 23 May Calais. Distinct from Dunkirk.
- Ardennes extra: `us-2nd-infantry` world extra 17 December Büllingen (Rocherath/Krinkelt in the municipality). Distinct from 99th Infantry at Elsenborn. Normandy file keeps Saint-Laurent 7 June.
- Pearl Harbor grain: `uss-oklahoma` and `uss-west-virginia` 7 December on the Arizona harbour pin. Do not use Oklahoma's 1947 tow-sinking coords.
- Guadalcanal grain: `us-7th-marines` 18 September 1942 Honiara. Map-only vs Hub `us-1st-marines` (Guadalcanal-only card).
- El Alamein grain: `de-90-light` 23 October 1942 vs 21st Panzer / Ariete.
- Kohima opposite: `jp-31st-div` 5 April 1944. Distinct from Hub `jp-31st-army` (Marianas). `in-7th-div` already has Kohima 5 April.
- Sicily / Anzio: `de-hg` 11 July 1943 Gela then 30 January 1944 Cisterna opposite `us-1-rangers`. `it-livorno` 11 July Gela (counter-attack). `de-4-fj` 22 January 1944 Anzio (first combat; distinct from 1st FJ Cassino).
- Pacific islands: `us-1-raiders` 7 August 1942 Tulagi (Edson; do not smear onto Hub 2nd Marine Division). `us-7th-marines` extra Cape Gloucester 26 December 1943 and Peleliu 15 September 1944 (map-only; skip Cape Gloucester on Hub `us-1st-marines`). `us-1st-def-bn` 8 December 1941 Wake. `us-philippine-div` extra 9 April 1942 Mariveles (Bataan surrender; Corregidor 6 May stays).
- North Africa: `au-6th-div` extra 3 January 1941 Bardia. `au-9th-div` extra 4 July 1942 First Alamein (entered the northern line that day). `nz-2nd-div` extra 1 July 1942 First Alamein (XIII Corps southern sector). `fr-1-bfl` 26 May 1942 Bir Hakeim (map-only; do not extra onto Hub `fr-1e-dfl`). `us-1st-infantry` extra 23 March 1943 El Guettar and 31 July 1943 Troina.
- Italy: `uk-78th-inf` extra 2 August 1943 Centuripe and 3 October 1943 Termoli. `uk-3-commando` world extra Termoli (Devon landing; Amfreville stays 6 June). `us-36th-inf` extra 8 December 1943 San Pietro Infine (Paestum is same-date as Salerno, unused). `us-10th-mountain` extra 3 March 1945 Castel d'Aiano (Encore).
- Deep-dive (world 460): `au-18-bde` map-only 18th Australian Brigade — Jaghbub 21 March 1941, Alotau (Milne Bay) 27 August 1942, Sanananda 21 January 1943, Balikpapan 1 July 1945. Do not extra onto Hub `au-7th-div` (Kokoda-only). `us-172-inf` 5 August 1943 Munda (43rd Division Hub card is Guadalcanal-only). `us-148-inf` 8 November 1943 Cape Torokina (37th Division Hub card is Guadalcanal-only; skip 3rd MarDiv Torokina). `uk-52nd-lowland` 15 June 1940 Cherbourg (`theater: "nw-europe"`, Operation Aerial 2BEF; not Dunkirk town). `de-14-ss` 13 July 1944 Brody (Hub bagration card names Brody).
- HOLD follow-up (world 463): `uk-52nd-lowland` extra 26 March 1945 Ringenberg (from the Bislich bridgehead; 15th Scottish made the 24 March assault crossing). `uk-78th-inf` extra 22 April 1943 Heidous (38th Irish Brigade; not the Longstop hill). New Hub armies: `pl-army-prusy` 5 September 1939 Tomaszów Mazowiecki (still assembling 1 September); `pl-army-karpaty` 1 September Czorsztyn; `pl-nog-narew` 1 September Łomża.
- Continue pass (world 464): new Hub `us-5th-inf` — Caumont-l'Éventé 13 July 1944 (Utah Beach 9 July is a beach, not a commune), Angers 9 August (`theater: "nw-europe"`), Echternach 26 December, Oppenheim 22 March 1945. Extras: `uk-5th-inf` Cassibile 10 July 1943 (Acid North; skip italy-end, the division had left Italy); `us-2nd-armored` Safi 8 November 1942 (Blackstone / Harmon); `nz-2nd-div` Trieste 2 May 1945 (italy-end last day; 22 Bn stays Maleme). Skip 9th Infantry at Bizerte (hills north of the city; official entry was Corps Franc 8 May).
- Continue extras (world still 464): `uk-15th-scottish` Bislich 24 March 1945 (Torchlight; German Wikipedia village, not Wesel / 17th Airborne). `british-51st-highland` Rees 23 March 1945 (Turnscrew assault opening; street fighting continued). `uk-1st-armoured` Abbeville 27 May 1940 (Evans, south of the Somme bridgehead; reuse pack coords; not Dunkirk). `us-30th-inf` Stavelot 18 December 1944 (1/117 two-thirds NW of the Amblève; Peiper at Stavelot stays skipped).
- Diary / unit-data extras (world still 464): `us-4th-armored` Coutances 28 July 1944 (CCB Dager; AAR city under control by 1800; Hub `normandy`) then Worms 21 March 1945 (seized 0135; Hub `rhine`; distinct from 5th Inf Oppenheim 22 March). Bastogne 26 December stays. `us-28th-inf` Wiltz 16 December 1944 (CP when the Ardennes opened; HQ to Sibret 19 December; Hub `bulge`). Paris 29 August stays; the old “northern Ardennes shoulder” note was wrong (Luxembourg / Our). Skip `uk-53rd-welsh` Rhine (crossed 26 March after the Hub window). Skip 4th Armored at Oppenheim. `us-82nd-airborne` Nijmegen, `british-7th-armoured` Sidi Barrani, and `us-101st-airborne` Eindhoven/Bastogne already exist.
- All-sides diary pass (world 468): British `uk-1-worcesters` Crépon 22 June 1944 (WO 171/1396 1715 Mont Fleury then assembly Crépon; 214th Bde / 43rd Wessex; do not smear onto `british-3rd-division` Sword / Hermanville). French `fr-2e-db` extra Alençon 12 August (took the town overnight 11–12 August; skip Argentan). US `us-29th-infantry` extra Saint-Lô 18 July (Task Force Cota; Vierville stays 6 June; distinct from 3rd Armored Cobra 25 July). German `de-302-inf` Dieppe 19 August 1942 (RH 26-302 KTB; opposite 2nd Canadian). Soviet `su-64th` extra 2 February 1943 Stalingrad (Hub `stalingrad-surrender`). Japanese `jp-32nd-army` extra Shuri 27 May 1945 (HQ under the castle; withdrew to Mabuni that night; Naha stays 1 April). Skip 12th SS at Krinkelt (village in Büllingen commune, already 2nd Infantry). Skip 11th Armoured Rhine (crossed 27–28 March after the Hub window). Skip 21st Panzer Lion-sur-Mer (KG Rauch smear onto the division; Caen 6 June stays).
- North Africa campaign (Italy then Germany, world 469): Compass vs Italy — `it-10th-army` extra Beda Fomm 7 February 1941 (surrender); `british-7th-armoured` extra Beda Fomm 5 February (Combeforce cut the Via Balbia); `au-6th-div` extra Benghazi 6 February (19th Brigade entered unopposed). German phase — `de-afrika-korps` extra Tobruk 10 April 1941 (investment; 9th Australian stays 11 April); `de-15th-panzer` extra Gazala 26 May 1942; `de-90-light` extra First Alamein 1 July and Tunis 13 May 1943; `uk-8th-army` extra First Alamein 1 July, Tripoli 23 January 1943, Mareth 20 March; `za-1st-div` extra First Alamein 1 July; `british-7th-armoured` extra Tripoli 23 January; `british-51st-highland` extra Mareth 20 March (XXX Corps Pugilist; skip 50th Division, no Hub tunisia); `in-4th-inf` / `uk-1st-armoured` extra El Hamma 26 March (left hook; not Wadi Akarit). NEW Hub `de-164-inf` El Alamein 23 October 1942 and Tunis 13 May 1943. Skip Italian invasion of Egypt 13 September 1940 (before Compass window). Skip Sonnenblume Benghazi (before Hub tobruk window on Afrika Korps). Skip NZ at El Hamma (no Hub tunisia). Skip 9th Infantry at Bizerte.

Still skipped until a distinct named commune is sourced: HLI of Canada / SDG; 1 RUR / 12 Devon LZ; 2nd Warwicks Bénouville smear; Finnish army; mid-ocean naval fights; Peiper at Stavelot / Stoumont (Malmedy then La Gleize are the sourced pins). `uk-1-para` 17 September Oosterbeek (remnants later, not 17 September). `us-508-pir` Overasselt / DZ T until the regiment article names it. `uk-10-para` Ede / Ginkel Heath until the battalion article names it. 1st Marines Naha and Cape Gloucester (Hub card is Guadalcanal-only). 2nd Marine Division at Tulagi (Raiders / 1/2 Florida, not the division). 7th Inf Attu/Kwajalein; 27th Inf Makin/Saipan; 77th Inf Guam; 3rd MarDiv Torokina; 4th MarDiv Betio smear. 7th Marines Okinawa Dakeshi/Wana until a distinct commune. Winnipeg Grenadiers Stanley until distinct from C Force Hong Kong. `uk-36th-inf` (Maungdaw tunnels 27 March 1944 are not a commune; Myitkyina landing is month-only). `uk-11th-east-africa` Kalewa 3–4 December 1944 is after the Hub imphal-kohima window (8 March–18 July). `uk-81st-west-africa` Kyauktaw 26 February 1944 is before that window. `uk-82nd-west-africa` Buthidaung 15 December 1944 is after. `uk-y-division` until a named Tunisia commune. Hill 609 for `us-34th-inf` (Djebel Tahent is a hill, not a commune). `us-9th-infantry` Bizerte (hills north of the city; official entry was Corps Franc 8 May).

Schematic fronts after 6 June use named-commune vertices only (Saint-Côme-du-Mont, Bayeux, Authie, Ranville, Carentan, Point 103 / Saint-Pierre, Tilly-sur-Seulles, Caen, Saint-Lô, Avranches, Paris, Elbeuf, Rouen). 6 June stays the beach lodgement. 13 June through 18 July share Carentan–Tilly–Caen–Ranville. Confidence low. No Falaise-pocket ring: a single polyline would close the gap before 21 August.

## Campaign overview pins

One sourced named place per campaign in that theater’s `battles.json`. Pin `date | place | lat | lng | summary | source | confidence`. Not a unit pin. Do not invent unit tracks or front geometry. Expand unit by unit later.

| Campaign | Theater | Place | Notes |
| --- | --- | --- | --- |
| Poland | eastern-front | Warsaw | 1 Sep 1939 |
| Winter War | eastern-front | Helsinki | |
| Norway | nw-europe | Oslo | Theater span starts 9 Apr 1940 |
| France | nw-europe | Sedan | |
| Dunkirk | nw-europe | Dunkirk | |
| Britain | nw-europe | London | Air campaign. Confidence low |
| Compass | north-africa | Sidi Barrani | |
| Greece | italy | Athens | Greece and Crete. Theater span starts 6 Apr 1941 |
| Barbarossa | eastern-front | Brest, Belarus | |
| Leningrad | eastern-front | Saint Petersburg | Siege opening |
| Moscow | eastern-front | Moscow | |
| Pearl Harbor | pacific | Pearl Harbor | West of the default Pacific frame |
| Singapore | burma | Singapore | South of the old Burma frame |
| Midway | pacific | Midway Atoll | West of the default Pacific frame |
| Stalingrad | eastern-front | Volgograd | |
| Guadalcanal | pacific | Honiara | Published town. Lunga Point not pinned. Confidence low |
| Alamein | north-africa | El Alamein | Second Alamein |
| Torch | north-africa | Algiers | |
| Tunisia | north-africa | Tunis | |
| Kursk | eastern-front | Kursk | |
| Husky | italy | Gela | |
| Avalanche | italy | Salerno | |
| Tarawa | pacific | Betio | |
| Cassino | italy | Monte Cassino | |
| Imphal-Kohima | burma | Imphal | Kohima is not a second pin |
| Overlord | normandy | D-Day pin | Reuses `d-day` |
| Bagration | eastern-front | Minsk | |
| Market Garden | nw-europe | Arnhem | |
| Leyte | pacific | Tacloban | Leyte Gulf window |
| Bulge | nw-europe | Bastogne | |
| Iwo Jima | pacific | Iwo Jima | |
| Rhine | nw-europe | Remagen | |
| Okinawa | pacific | Naha | |
| Berlin | eastern-front | Berlin | |
| Tokyo Bay | pacific | Tokyo | Pin is 2 Sep 1945. Missouri is not a separate pin |

Skipped until a named place is sourced on its own date: Saar, River Plate, Westerplatte/Bzura, First Alamein, Malaya (Kota Bharu), Hong Kong, Coral Sea, Gazala/Tobruk, Taranto, Dieppe, Anzio, Warsaw Uprising, Vistula–Oder, Third Kharkov, Bismarck Sea.
