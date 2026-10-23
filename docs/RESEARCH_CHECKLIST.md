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
- Still skipped: Finnish army / `fi-9th-div` (no `side` enum). `de-23-panzer` / `de-27-panzer` (no Hub unit cards). `uk-52nd-lowland` (Dunkirk is the wrong fight; Cherbourg 17 Jun 1940 is outside the Hub dunkirk window). `uk-11th-east-africa` / `uk-36th-inf` / `uk-81st-west-africa` / `uk-82nd-west-africa` (Arakan / NCAC, not Imphal or Kohima). `us-37th-inf` / `us-43rd-inf` (New Georgia, not Guadalcanal — Hub cards still only list Guadalcanal). `us-5th-inf` unnamed Overlord commune. `us-7th-army` Dragoon (no Hub Dragoon battleId). `us-15th-af` (Foggia is not the Italy-end fight). `au-7th-div` / `us-avg` / `us-14th-af` / `nl-knil` empty battleIds. AA and UK county/home divisions with empty battleIds. Individual BoB squadrons. `uk-commandos` stays aliased to `uk-47-rm-commando`. Mid-ocean Denmark Strait / sinking of Bismarck / Battle of the Atlantic (no named shore). `sino-japanese-war` 7 July 1937 is before the war-window parser (`1939-09-01`). `de-7-ss` and later SS mountain/anti-partisan cards with empty battleIds. Tirpitz / HMAS Sydney. Parent HQ/service cards (`de-okw`, `de-okh`, `uk-cos`, `us-shaef`, `su-stavka`, `jp-ighq`, `su-red-army`, `su-vvs`, `jp-ija`, `jp-ijn`, `jp-ija-air`, `jp-ijn-air`, `de-heer`, `us-coast-guard`). `fj-infantry` (Hub lists Guadalcanal 7 Aug, not Bougainville). `pl-army-prusy` / `pl-army-karpaty` / `pl-nog-narew` (no named commune on 1 Sep). `uk-y-division` (Tunisia campaign-start date is too early). `de-14-ss` Brody is not the Bagration Minsk pin. `de-20-ss` / `de-26-ss` / `de-30-ss` / `de-38-ss` Hub battle places are the wrong fight. `hist-*` people in specialOps. `it-decima-mas` Hub battles are Taranto/Matapan (wrong fight). Unnamed towns. Wikipedia overlays.

Schematic fronts (named communes only): Sedan–Dinant 10 May 1940, Dunkirk–Calais 26 May 1940, Warsaw–Modlin 28 Sep 1939, Brest–Białystok 22 Jun 1941, Leningrad–Kronstadt 8 Sep 1941, Moscow–Klin 2 Oct 1941, Stalingrad Tractor Factory–city 17 Jul 1942 and 2 Feb 1943, Kursk–Prokhorovka 12 Jul 1943, Vitebsk–Minsk 22 Jun 1944, Seelow–Berlin 16 Apr 1945, El Alamein–Tel el Eisa 23 Oct 1942, Oran–Algiers 8 Nov 1942, Johor Bahru–Singapore 8 Feb 1942, Gela–Syracuse 10 Jul 1943, Eindhoven–Nijmegen–Arnhem 17 Sep 1944, Bastogne–St. Vith 19 Dec 1944. Eastern Front sectors stay simultaneous (Leningrad during Stalingrad).

## Easy Company, 506th PIR (`easy-company-506`)

Pull 506th S-3 / AAR and 101st G-3 from NARA before trusting Ambrose or the series for coordinates.

Starter pins already in the pack:

- 6 June Brécourt Manor `49.390056, -1.226111`
- 10–12 June Carentan
- 13 June Bloody Gulch

Named on the advance but **not** pinned until a diary date exists: Sainte-Marie-du-Mont, Saint-Côme-du-Mont.

Next pins: Upottery, DZ C, Hiesville, Dead Man’s Corner, then later Eindhoven and Bois Jacques in other theater files (`nw-europe`). Do not put those in the Normandy file.

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

- Allied: US 4th (Utah / La Madeleine), US 29th (Vierville), 82nd (Sainte-Mère-Église), British 6th Airborne (Ranville), 2nd Rangers (Pointe du Hoc), US 2nd Infantry (Saint-Laurent, 7 June), US 90th (Sainte-Mère, 8 June), 47 RM Commando (Port-en-Bessin, 7 June)
- Axis: 716th (Luc-sur-Mer), 352nd (Formigny), 709th (Montebourg), 91st Luftlande (Picauville), FJR 6 (Saint-Côme-du-Mont / Carentan / Méautis), 243rd (La Haye-du-Puits), 346th (Sallenelles), Panzer Lehr (Tilly-sur-Seulles, 11 June), 17th SS (Méautis, 13 June)

Panzer Lehr and 17th SS have no 6 June lodgement pin. FJR 6 is the regiment (`de-fjr-6`), not 6th Fallschirmjäger Division (`de-6-fj`). Villers-Bocage stays 4 CLY and s.SS-Pz.Abt. 101 only.

## Operation Overlord (Wikipedia finding aid)

Wikipedia [Operation Overlord](https://en.wikipedia.org/wiki/Operation_Overlord) is a finding aid only. Pin `date | place | lat | lng | note | source | confidence`. Do not digitize the lodgement/breakout rasters. Do not invent west-Cotentin towns.

Added commune pins:

- 6 June Arromanches: 1st Battalion, Hampshire Regiment (`uk-1-hampshires`)
- 26 June Cherbourg: US 9th, 4th, and 79th Infantry. No pin for the 17 June west-coast cut-off (unnamed town in Overlord)
- 8 July Caen (Charnwood) and 18 July Caen (Goodwood): battle markers. Overlord does not name the Allied divisions those days. 21st Panzer and 12th SS stay on last-reported Caen/Authie pins
- 25 July Saint-Lô (Cobra start), 30 July Vire (Bluecoat objective, not a sourced capture), 1 August Avranches, 11 August Alençon: battle markers without a named division
- 16 August Falaise: 3rd Canadian Division. Overlord names “the Canadians”; 2nd Canadian Division is not pinned (Forêt de la Londe is a forest, not a commune)
- 24–25 August Paris: 2e DB and US 4th Infantry
- 25 August Elbeuf: US 2nd Armored
- 30 August Rouen: 3rd Canadian Division

Skipped: Epsom communes (Cheux / Baron-sur-Odon not in Overlord), 1st/9th/10th SS and 2nd Panzer (no named commune), army HQ at Le Mans, beach-arrival-only divisions from the Allied list, Das Reich at Mortain.

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
