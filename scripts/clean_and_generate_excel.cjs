const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Raw CSV text provided by the user
const rawCsvData = `ID,Title,Notes,Due Date,Completion Date,Priority,Is Completed,List Name,Recurrence,Creation Date,Modification Date
765A6009-5243-4D6E-8850-5CD31A933112,Aman - Job 2045,"20 Banjo Paterson Circle, Point Cook VIC 3030
Patricia Mc Cann, 0419159257
Bedroom 4 - Nails coming at the edges of carpet near entrance
Main Bathroom - Water damage signs in skirting
Paint is coming off from feeling above shower
Garage wooden door getting damage with rain waters",2025-12-20 08:00:00,,0,No,Jobs,,2025-09-02 19:46:34,2026-10-06 15:54:34
0461D47D-5AD4-4A91-B426-CEA9A4081878,Makayla - Job 2541,"7 Howmans Rd, Werribee VIC 3030
Pravinesh Chand (Tenant) - 0450106100 +64 21 800 360
- Cavity door 820x2340x35",2026-09-02 10:00:00,,0,No,Jobs,,2026-08-28 17:55:50,2026-10-06 15:54:34
D4AC688F-7DEA-46B2-ADA0-EF09EA4D6745,Ayesha - Job 2577 / Quote 2109 Sent,"36 Hugo Dr, Point Cook VIC 3030
Rajwinder Singh. (Tenant) - 0459534290
- Garage door is stucking in the middle when they open the door or close it and that time the light is also blinking.",2026-09-18 00:00:00,,0,No,Jobs,,2026-08-26 18:24:35,2026-10-06 15:54:34
EE4FC192-D99E-41A1-B0CF-00C788DF494F,Dipali - Quote 2184 Sent,"70 Ribblesdale Ave, Wyndham Vale VIC 3024
Keys with Dipali
- Oven Replacement
- Rangehood Replacement",2026-09-20 00:00:00,,0,No,Jobs,,2026-09-09 18:09:48,2026-10-06 15:54:34
1AFB8439-DC42-46DA-ACA1-F3F97A6A9F72,Makayla - Job 2558 / Quote 2151 Sent,"37 Claremont Cres, Hoppers Crossing VIC 3029
Alilia Paseka (Tenant) - 0485 751 629
- Back rumpus room: sliding door lock has fallen apart so the door is unable to be locked.
- Kitchen sliding door: the lock mechanism is still there but even when locked the door still slideds open.
- Kitchen pantry door: right side handle to pantry door is loose.
- Master bedroom blinds: as shown in the video the blinds do not stop going down unless we use a clamp on the strings or it hits the ground.",2026-09-23 00:00:00,,0,No,Jobs,,2026-09-10 16:12:50,2026-10-06 15:54:34
7EE0CEA0-23B1-4A23-AA4B-5398668411DB,Makayla - Job 2527 / Quote 1923 Sent,"18 Compton St, Truganina VIC 3029
Saai Ashok Kumar - 0451239239
- Supply and install new laundry tap
- Drain blocked in bathtub and wash basin
- Bedroom Door not closing",2026-10-12 00:00:00,,0,No,Jobs,,2026-05-22 16:44:41,2026-10-06 15:54:34
F8F82B19-9150-48B5-8526-0230AE050640,Makayla - Job 2561 / Quote 1898 Sent,"28 Silverbay Ave, Point Cook VIC 3030
Clover Jinxuan Lin (Tenant) - 0406809184
- Garage lights are not working.
- Light doesn’t work in laundry.
- Light is in back hallway doesn’t work
- Latch is not working from entrance to kitchen door",2026-10-12 00:00:00,,0,No,Jobs,,2026-08-17 14:00:54,2026-10-06 15:54:34
E8627FA1-EE3A-41D7-93A2-848393950879,Moksh - Quote 1472 Sent,"19 Tropic Cct, Point Cook VIC 3030
Seyed Hossein Emam, 0408951555
Entrance Hall: Minor wall damage behind garage door and small marks on walls.
Lounge Room: One sheer blind missing; blackout curtains present.
Kitchen/Meals: Minor wall scuffs and paint chips; one blind difficult to open, another missing cord; cracks on island near sink and above microwave cupboard.
Dining: Blackout blinds missing.
Bedroom 2: One LED light is loose and not working.
Main Bathroom: Towel rail is loose.",,,0,No,Jobs,,2025-10-08 17:25:23,2026-10-06 15:54:34
BAF12251-FFDE-48AC-A13B-52DD14AF17E0,Amare - Quote 1641 Sent,"14 Aspire St, Tarneit VIC 3029
Nidhi Chib (Tenant) - 0444 593 385
– Cabinet door under the sink has come off
",,,0,No,Jobs,,2026-01-07 18:11:59,2026-10-06 15:54:34
A80C953F-F0DC-4E38-9265-51EDF6105DDE,Amare - Quote 1700 Sent,"8 Barooga Terrace, Truganina VIC 3029
Sheena Marie Solis (Tenant) - 0461 541 045
- A window lock is broken.
- cooktop repair
- The control wand for the blind has not been installed.
855W x 2000D",,,0,No,Jobs,,2026-02-17 18:43:28,2026-10-06 15:54:34
DBDA90FE-3F4F-45FC-AFB3-511E112A9BCD,Aman - Quote 1802,"15 Misten Avenue, Altona North VIC 3025
Lutfi Saud, +61430566065
- Backyard fence needs to get fixed",,,0,No,Jobs,,2026-03-31 19:08:12,2026-10-06 15:54:34
82089172-BCD8-48B8-B479-C26D1DEE74E5,Jaslin - Quote 1860 Sent,"989 Morris Road Truganina, VIC 3029
- Floor board keep moving needs glue
- Door lock replaced",,,0,No,Jobs,,2026-04-22 22:09:55,2026-10-06 15:54:34
6A735D87-6BD3-4473-A854-E9FC9C8B91FE,Parneet - Quote 1901 Sent,"15 Atherton Way, Werribee VIC 3030
Hamza Iqbal (Tenant) - 0487147242
1.Back door lock issue – The rear door does not have a proper lock. Additionally, during windy conditions, the door swings open and slams against the wall. This is a safety concern as it leaves the property unsecured and accessible from outside.
2.Leaking shower – The shower is leaking, and it appears the pipe needs repair or replacement.
3.Flyscreen request – We had previously requested a screen for the living room door. Without it, we are unable to keep the door open as insects and flies enter the house. Kindly arrange installation of a suitable screen.",,,0,No,Jobs,,2026-04-23 21:21:09,2026-10-06 15:54:34
1330F425-9D36-466B-86D2-1EA512900562,Parneet - Quote 1876 Sent,"8 Ledmore St, Truganina VIC 3029
Sabby Sethi (Tenant) - 0404530198
- 3 lights are not functioning
- Toilet handles, door handles, and towel rail require repair
- Front roof ceiling – If this collapses and causes damage to our vehicle parked in the driveway,
- Guttering – Ant infestation was shown to the owner during their visit
- Front tree (nature strip) – It has now been over 8 weeks. I find it difficult to believe that the Australian council would take this long.
- Main door lock – The door opens randomly.",,,0,No,Jobs,,2026-04-23 21:36:03,2026-10-06 15:54:34
73626652-D752-4889-AE8A-27862FC56337,Mehreen - Quote 1863 Sent,"14 Penzance Street, Truganina VIC 3029
Gurpreet Singh (Tenant) - 0402016522
- Mold in master room
- Mold in living room",,,0,No,Jobs,,2026-04-24 15:46:00,2026-10-06 15:54:34
C164B77A-7900-4647-A699-CA9DCDC7A5CA,Aman - Quote 1883,"2 Ionian Way, Point Cook VIC 3030
Cherese Booysen, 0455 137 540
- Cracks noted on the ceilings and walls. (Overall)
- The renters advised that the garden bed timber is becoming loose, resulting in sand falling through. (Backyard)",,,0,No,Jobs,,2026-05-01 19:00:16,2026-10-06 15:54:34
CB665A12-616F-4F55-B5B6-35DB5C22E396,Aman - Quote 1888,"8 Eades Street, Laverton Vic 3028
Paul Laylo, 0412037230
- Locks
- Structural soundness
- Heating",,,0,No,Jobs,,2026-05-04 21:43:58,2026-10-06 15:54:34
32DEF1FC-24A9-4029-9E98-DE0F677EAFA6,Ayesha - Quote 1908 Sent,"29 Mirima Street, Tarneit, Vic 3029
0466437121
- Downlight replace (3 x Lounge, 2 x Rooms, 1 x Laundry)
- Backyard security screen roller assembly replacement
- Loose toilet seat needs re-installation
- Cooktop - Right front burner not igniting
- Air-con service
- 2 x Shower silicon
- auto closure for entrance security screen door
- 2 x door lock tighten
- Dry wall plaster damaged repair",,,0,No,Jobs,,2026-05-13 19:02:12,2026-10-06 15:54:34
C85632AF-D70F-4B44-8970-9D8E2E9C0F46,Prerna - Quote 1921 Sent,"50 Shillings Rd, Mambourin VIC 3024
Despina Mudaliar (Tenant) - 0404 060 980
- Kitchen tap is wobbly it's need fixing.",,,0,No,Jobs,,2026-05-19 20:50:43,2026-10-06 15:54:34
F7AD9BD8-0218-4371-84CA-90DB9CBE31B4,Ekta - Quote 1934 Sent,"10 Paruna Pl, Hoppers Crossing VIC 3029
Annaliesa Sharam (Tenant) - 0432 346 547
- Oven coil snapped
- Ducted heating is not operations and has error displayed - urgent repair
- Exhaust fan in main bathroom no longer working starting to cause paint peeling - urgent repair to avoid mould forming
- Rangehood fan not working",,,0,No,Jobs,,2026-05-29 15:04:03,2026-10-06 15:54:34
67B801B4-3E7A-47DD-A45D-D7DEBE009DC8,Prerna - Quote 1938 Sent,"17 Shamrock Way, Truganina VIC 3029
Paras Deswal (Tenant) - 0432 758 013
- Blind chain got broken",,,0,No,Jobs,,2026-06-02 15:48:53,2026-10-06 15:54:34
D7746811-9311-4BFF-A28F-EE5350B9A68A,Aman - Quote 1953 Sent,"66 Waves Dr, Point Cook VIC 3030
Emily Bradley, 0415923731
- Supply and install new 90cm canopy exhaust fan",,,0,No,Jobs,,2026-06-11 22:45:38,2026-10-06 15:54:34
B40FAE78-3474-42E1-BFD3-CF2D25D3709B,Ekta - Quote 1955 Sent,"803 Tarneit Rd, Tarneit VIC 3029
Varinderjit Singh (Tenant) - 0491 384 914
- Gas burner is not functioning properly and remains faulty despite thorough cleaning.
- Two bedroom doors are not closing properly.
- One electrical switch cover is missing.",,,0,No,Jobs,,2026-06-12 17:55:43,2026-10-06 15:54:34
45B1F2B8-9F52-4661-BC75-EB66D6BF6C4E,Ekta - Quote 1959 Sent,"7 Champion Ct, Truganina VIC 3029
Aman (Tenant) - 0448 440 847
- Ceiling in lounge area is leaking and has water spots.",,,0,No,Jobs,,2026-06-16 08:50:08,2026-10-06 15:54:34
332AB991-7DC8-4A1C-8BFE-94EB6FE34335,Ayesha - Quote 1964 Sent,"10 Caraleena Dr, Tarneit VIC 3029
Sandy - 0432299825
Usha singh (Tenant) - 0420803335
- Multiple issues please check with tenants",,,0,No,Jobs,,2026-06-18 21:18:43,2026-10-06 15:54:34
7D45E051-0F53-4480-A366-8D54A624C613,Mikaela - Quote 1967 Sent,"18 Ivory St, Cobblebank VIC 3338
Mohammad Wasif, 0468712180
1. Master Bedroom’s bathroom exhaust not working.
2. One of the washbasin’s drain inlet broken.
3. One of the Kitchen Island’s cupboard door not closing properly.",,,0,No,Jobs,,2026-06-19 18:37:17,2026-10-06 15:54:34
872CA6A1-0AFE-499B-B565-9CB150A26B21,Mikaela - Quote 1972 Sent,"38 Hume Ave, Melton South VIC 3338
Hussein Hussein, 0451330106
- Kitchen - there is also a hole in the pantry, from which rats are entering inside the kitchen.",,,0,No,Jobs,,2026-06-25 20:08:03,2026-10-06 15:54:34
916A8EDC-B2FC-4F1E-B408-A395AF419507,Mikael- - Quote,"18 Howard Place, Deer Park Vic 3023
Goran Dimovski, 0426067800
- Quote to replace roller blinds for full house",,,0,No,Jobs,,2026-06-26 19:18:27,2026-10-06 15:54:34
8C44C64E-B3A6-4A17-A40F-6ACA03BC5B9A,Nadeesha - Quote 1977 Sent,"52 Pienza Rd, Fraser Rise VIC 3336
Nadeesha  - 0449788658
- The hall light bulb is not working.
- The bathroom exhaust fan is not functioning.
- The main entrance door squeaks loudly when opening and closing",,,0,No,Jobs,,2026-06-29 19:26:52,2026-10-06 15:54:34
F2BF2F92-5443-4A7F-95AA-5F5219B934C1,Dipali - Quote 1980 Sent,"62 Grace St S, Altona Meadows VIC 3028
David Peterson, 0427943536
- Need lock on the roller shutter door
- Kitchen tap spraying water
- Towel rail is loose and coming off in bathroom
- Pantry door for kitchen has came off, 2 doors
- Leak in the kitchen cabinet",,,0,No,Jobs,,2026-06-30 20:31:57,2026-10-06 15:54:34
313A35C7-6E77-4B7C-A33F-98DF76D62D01,Ekta - Job,"67 Rockpool Rd, Truganina VIC 3029
Mohamed Janneh Keita (Tenant) - 0414 085 424
- Renter has reported that both showers are leaking from the bottom during use, causing water to flow onto the bathroom floor. 
This appears to be due to missing, damaged, or deteriorated silicone sealing along the base of the shower screens.",,,0,No,Jobs,,2026-06-30 20:48:49,2026-10-06 15:54:34
E01F7021-DEB5-4543-B2D1-BE6A2541DC37,Dipali - Job,"31 Villiers Dr, Point Cook VIC 3030
Natalie Favory (Tenant) - 0413202271
- Install hooks throughout the house on blinds",,,0,No,Jobs,,2026-07-01 19:19:17,2026-10-06 15:54:34
8D426EA6-B712-4190-86E3-65851B92AF32,Ekta - Quote 2072 Sent After 3pm,"19 Melaleuca Dr, Hoppers Crossing VIC 3029
Lisa-Marley Hape (Tenant) - 0478 767 312
- Oven glass door shattered needs replacement - Needs investigation as well how?
- Renter has reported that the kitchen sink pipe is leaking. Plumber is required.",,,0,No,Jobs,,2026-07-02 20:09:35,2026-10-06 15:54:34
7CEEE17B-3BB3-41BE-B5CD-9031991BC7D9,Parneet - Quote 1987 Sent,"11 Swanton Ave, Williams Landing VIC 3027
Thantanath Khangtatswas (Tenant) - 0403 083 138
- The pipe underneath toilet is leaking",,,0,No,Jobs,,2026-07-03 18:20:11,2026-10-06 15:54:34
1ABA2452-3B9E-451C-9EF9-3AC2FB30EC21,Kylie - Quote 1988 Sent,"798 Armstrong Road, Manor Lakes VIC 3029
Katrina Barbajo (Tenant) - 0416 956 693
- 2 x Duplicate keys for driveway
- Mailbox key
- Garage remote is also not working",,,0,No,Jobs,,2026-07-03 18:35:01,2026-10-06 15:54:34
BBE9567B-83E5-4079-9121-A8F86D9F5938,Ekta - Quote 1595 Sent,"10 Paruna Pl, Hoppers Crossing VIC 3029
Annaliesa Sharam (Tenant) - 0432 346 547
- Oven coil snapped
- Ducted heating is not operations and has error displayed - urgent repair
- Exhaust fan in main bathroom no longer working starting to cause paint peeling - urgent repair to avoid mould forming
- Rangehood fan not working",,,0,No,Jobs,,2026-07-03 18:42:33,2026-10-06 15:54:34
AA46267B-FC7C-4DBE-8C7E-758D20C1CEEE,Makayla - Quote 2057 Sent,"11 Seacoast Street, Point Cook VIC 3030
Nikita Hiroti (Tenant) - 0452608506
- Venetian blinds in bedrooms are not working . The panels are stuck and wont open. Can you advise whether this can be repaired or needs to be replaced.
1450w x 1500D
Ice / Pure
- Back sliding door lock does not work.",,,0,No,Jobs,,2026-07-06 18:58:11,2026-10-06 15:54:34
7685379A-037C-4067-850C-FDBE62B84E7A,Ekta - Quote 1992 Sent,"30 Sumac Street, Brookfield VIC 3338
Khair Unnisa Begum (Tenant) - 0414 170 420
- Heat duct in the master room is loose.",,,0,No,Jobs,,2026-07-07 19:15:49,2026-10-06 15:54:34
A5D56AB7-A203-4E37-B38F-FA917C3DEFC2,Ekta - Quote 1994 Sent,"3 Inns Pl, Hoppers Crossing VIC 3029
Meleane Lafimoasiu Taufa (Tenant) - 0412 817 292
1. Screen door at the front mesh is torn.
2. Door knobs of 2 bedrooms have came off due to window being open.
3. Laundry door - Does not lock properly from inside.
4. Backyard sliding door does not lock properly.
7. Ensuite toilet not flushing.
New Quote
5. Both Shower door hard to slide.
6. Front room shower frame is falling apart.",,,0,No,Jobs,,2026-07-07 19:30:30,2026-10-06 15:54:34
DA90B08B-773C-4CDB-9148-40D7CF72BF78,Ekta - Quote 2003 Sent,"4 Hereford Ave, Truganina VIC 3029
Maria Mackay (Tenant) - 0473 756 310
- Supply and install new clothsline ",,,0,No,Jobs,,2026-07-12 19:29:13,2026-10-06 15:54:34
F072C09E-4F0C-4B76-86D0-6C51AECECE93,Ekta - Quote 2020 Sent,"38 Hamish Drive, Tarneit VIC 3029
Rami Ahmed (Tenant) - 0416 268 643
-The oven has recently started burning food intermittently, despite being used as normal.
-The garage door is occasionally getting stuck when opening.",,,0,No,Jobs,,2026-07-13 18:09:26,2026-10-06 15:54:34
119A9159-EADB-4B9D-8566-D6ACB775E5D2,Ekta - Quote 2007 Sent,"8 Wing Cir, Tarneit VIC 3029
Tania Vatubua (Tenant) - 0422 526 934
- Fan light needs repalcement",,,0,No,Jobs,,2026-07-14 18:14:09,2026-10-06 15:54:34
1AA41DC4-069F-49C0-AFBE-71668D9F267E,Mehreen - Quote 2021,"3 Romek Way, Truganina VIC 3029
ATIYA S M EMHEMMED (Tenant) - 0406933055
- Plaster required on water damage",,,0,No,Jobs,,2026-07-17 19:27:34,2026-10-06 15:54:34
027C3142-922C-4CA9-B556-CE7DB29F34E4,Prerna - Quote 2023 Sent,"46 Hummingbird Boulevard, Tarneit VIC 3029
Sahilpreet Singh (Tenant) - 0449 904 106
- Garage light switch needs replacement 
- Bathroom lighting
- Door Master bedroom door and the garage door have issue
- Exhaust system issue the buttons does not work",,,0,No,Jobs,,2026-07-20 19:44:04,2026-10-06 15:54:34
1DDA730B-5211-4A9E-AE9C-CEC1E88C5221,Ekta - Quote 2026 Sent,"103 Verdant Rd, Truganina VIC 3029
Nassouh Kalo (Tenant) - 0416 090 897
- Garage door not operational
- Cooling system needs to be replaced
- Stovetop burners can't be turned on when oven is in use
- Kitchen sink leaking
- Ensuite RHS sink leaking underneath cupboards",,,0,No,Jobs,,2026-07-21 20:05:00,2026-10-06 15:54:34
7D3705E8-7128-48BA-A314-66BC7AA2327D,Makayla - Quote 2028 Sent,"76 Haze Dr, Point Cook VIC 3030
Meihana L Broadbridge (Tenant) - 0468551755
- The master bedroom shower screen glass is cracked and requires urgent repair.
- The front door handle only turns one way, making it increasingly difficult to open and close. The handle also does not lock properly on the timber door.
- The garage door handle is difficult to operate and requires force to open and close.
- Moisture behind shower wall",,,0,No,Jobs,,2026-07-22 20:28:35,2026-10-06 15:54:34
C469452A-3F79-401B-9984-B87C86015888,Makayla - Quote,"99 Hemsley Promenade, Point Cook VIC 3030
Anahera Wilson-Rakei (Tenant) - 0421951022
- Measurements for an upstairs windows where blinds are missing",,,0,No,Jobs,,2026-07-23 19:52:48,2026-10-06 15:54:34
3A9B8389-5EC1-4E94-AEBE-6353234D83BD,Mehreen - Quote 2201 Sent,"103 Federation Blvd, Truganina VIC 3029
Amina Mohamed. (Tenant) - 0412987464
- Tenants are requesting for repair of window screens and locks, which are broken or loose. This is a safety concern, as the back windows could be easily opened, especially given the recent increase in burglaries in the area.",,,0,No,Jobs,,2026-07-24 19:03:21,2026-10-06 15:54:34
F1CBB033-7DAD-4FB5-9073-38086DCBB5F6,Ekta - Quote 2047 Sent,"68 Odyssey Bvd, Tarneit VIC 3029
Con - 0415 307 225 
- Regrout the bathroom",,,0,No,Jobs,,2026-07-24 19:17:56,2026-10-06 15:54:34
694B1E6B-1B58-443D-A9D4-6F67B863ECAB,Ekta - Quote 2038 Sent,"69 Trevor Cres, Truganina VIC 3029
Sahil (Tenant) - 0424 422 756
1. Downlights are not working in pantry, rooms and washroom - 8 or 9
2. Roller of the back slider is not working.
3. Dishwasher is not working properly.
4. Bathroom tap is leaking
5. Kitchen gas turns off automatically while using.",,,0,No,Jobs,,2026-07-27 19:22:32,2026-10-06 15:54:34
36823A07-3644-4BB5-81A7-02BBD3DFCA02,Raghav - Quote 2041 Sent,"72 Whitsunday Dr, Hoppers Crossing VIC 3029
Sehenur Shanto, 0449099953
- Install 2x blind cord anchors / cleats to secure loosely hanging blind cords.",,,0,No,Jobs,,2026-07-28 18:52:17,2026-10-06 15:54:34
57DA9197-2111-4532-B143-DCD06932117A,Raghav - Quote 2042 Sent,"21 Tropic Circuit, Point Cook Vic 3030
Sravanthi Yarraguntla, 0499378329
- The water is coming from the back garage wooden door when rains",,,0,No,Jobs,,2026-07-28 18:53:22,2026-10-06 15:54:34
F2BBB64B-B585-4EC3-AB10-9F45EFD0A2E0,Makayla - Quote 2045 Sent,"7 Waterhaven Boulevard, Point Cook VIC 3030
Ngawai Thomason (Tenant) - +61410942415
- Gutter cleaning
- Ac unit leaking",,,0,No,Jobs,,2026-07-29 20:15:52,2026-10-06 15:54:34
C41B7CFA-11AD-45B3-A862-962A57C94ECF,Ekta - Quote 2052,"4 Corriedale Ave, Truganina VIC 3029
Mary Atilio (Tenant) - 0402 663 707
- Front main door wood is torn, please fix.
820 x 2040 x 40mm
– Ensuit door lock replacement 
– Backyard security screen wheel",,,0,No,Jobs,,2026-07-30 19:59:12,2026-10-06 15:54:34
4DFE5080-D797-4D8F-97D3-96798048D611,Ekta - Quote 2051 Sent,"13 Kambah St, Tarneit VIC 3029
Navneet Kaur (Tenant) - 0469 887 021
- Front door lock is not functioning properly
- Lock on the rear glass is also faulty",,,0,No,Jobs,,2026-07-31 21:59:27,2026-10-06 15:54:34
2374E77E-3B45-40A2-A0EE-4FE9102F0AAB,Pankti - Quote 2066 Sent,"15 Cumming Dr, Hoppers Crossing VIC 3029
Rodel Bermejo - 0488720419
Check quote for list of work",,,0,No,Jobs,,2026-07-31 22:14:08,2026-10-06 15:54:34
F4E3F6EC-3517-4B1B-9920-EF956ED66460,Dipali - Quote,"11 Point Cook Road, Altona Meadows Vic 3028
Girish - 0433 424 333
- Full house re-painting
- Lighting require in full house
- Both bathroom require new shower screen, sink and tap wares
- Carpet require changing throughout
- Heater unit is missing, need to install one
- Door needs to be installed where missing and locks and handle also requote throughout",,,0,No,Jobs,,2026-08-03 18:46:42,2026-10-06 15:54:34
B9273367-895E-4DD5-81C7-99E553762D00,Ekta - Quote 2055 Sent,"45 Drake Street, Tarneit VIC 3029
Zaygham Nawaz (Tenant) - 0406 381 677
- LHS ensuite sink is leaking underneath into cupboard when in use for the meantime renters are not using this but this will need to be fixed
- Clothesline requires replacement/repair as it was damaged due to the strong winds we had
- Towel rail to be repaired/replaced as it has come away",,,0,No,Jobs,,2026-08-03 19:02:48,2026-10-06 15:54:34
417C251A-7E1C-45BD-810D-365DD39D209D,Ekta - Quote 2056 & 2090 Sent,"18 Monaro St, Tarneit VIC 3029
Masthan Galiboyina (Tenant) - 0470 573 615
- 2056 - Backyard flood light bulb needs replacement
- 2090 - Towel rail installation",,,0,No,Jobs,,2026-08-03 19:35:36,2026-10-06 15:54:34
C0687B1A-0B0D-4D6A-900D-ABC6738C3FA7,Ekta - Quote 2062 Sent 11-3pm,"1/7 Craig Cl, Truganina VIC 3029
Aysha Fatima (Tenant) - 0406 765 487
- Bedroom 1 door is sticking and tough to open
- Bedroom 2 door handle was loose and has come away
– Laundry door sticks
- Carpet towards the start of the kitchen is in poor condition (carpet might be due for replacement - can get a quote to replace carpet throughout)
- Main bathroom tiles behind door are coming away
 
- Front door deadlock (top lock) requires replacement as per legislation it must have a lock that can be operated by a key from the outside and unlocked from the inside without a key which is not the case in this current situation
- Lounge ceiling seems to have water staining / moisture damage as there is uneven, patchy discolouration and faint grey marks which are typical signs of past or ongoing moisture exposure.
- Main bathroom and ensuite shower silicone/grout could use replacement
- the ceiling in one corner of Bedroom 2 (the handle of which came off). It also has moisture",,,0,No,Jobs,,2026-08-03 19:43:16,2026-10-06 15:54:34
CEFB49D6-8851-4168-BFF3-9F71DA22BC83,Raghav - Quote 2061,"17 Beatrix St, Point Cook VIC 3030
Bianca Hall, 0439 392 468
- Main Door - The renters advised that the main door lock is not working properly, and the key is getting stuck inside.
- Main Bathroom - The renters advised the door knob has been removed as the door was not able to be opened from the inside.",,,0,No,Jobs,,2026-08-05 17:52:42,2026-10-06 15:54:34
93F35A2F-0ABC-41A8-947C-F7F2648741A5,Mounika - Quote 2068 Sent,"207 Thames Blvd, Tarneit VIC 3029
Carol O’Neill (Tenant) - 0431 117 375
The towel rack in the ensuite is broken , not able to hang towels",,,0,No,Jobs,,2026-08-06 19:32:08,2026-10-06 15:54:34
8B4757F4-9602-43F4-871B-3D99CDAB745A,Ekta - Quote 2477 Sent,"15 Quarrion Court, Hoppers Crossing VIC 3029
Muhammad Haris Hassan (Tenant) - 0451 202 440
- Inspect leaning rear fence, investigate and advise on the likely cause of the fence leaning, provide supporting photos, and provide a separate quote for the removal and disposal of the internal/non-boundary fence shown in the attached photo.",,,0,No,Jobs,,2026-08-06 19:44:36,2026-10-06 15:54:34
07AE9D52-0BA7-4142-8AE0-69A5B2B184CF,Makayla - Quote 2080 Sent,"27 Tanner Mews, Point Cook VIC 3030
Vishal ghumman (Tenant) - 0456471982
- Light switch is not functioning. 
- Rangehood mesh has come loose.
- Bedroom Door handle is loose
- 2 x Wash basin tap is loose and wiggly.
- 3 x Entrance door lock need replacement
- 1 x Entrance set",,,0,No,Jobs,,2026-08-07 18:41:02,2026-10-06 15:54:34
75222A05-B1A0-4D86-82E9-BACBCB3D790F,Rav - Quote 2077 Sent,"23 Giri Way, Werribee VIC 3030
Chingasiyeni Matanda, 0461343909
- Roller blind chain needs to be fixed in the front lounge.
- Blind hooks for venetian blinds need to be installed and broken blind hooks need replacement on some windows.",,,0,No,Jobs,,2026-08-10 20:26:05,2026-10-06 15:54:34
750C937E-5B0E-440F-B654-B4900FC0084A,Mikaela - Quote,"21 Swinburne Court, Truganina Vic 3029
Tim Thomassen, 0434 133 272
- Entrance Hall - The renters advised that a gap is developing between the tiled floor and the door.",,,0,No,Jobs,,2026-08-13 19:25:14,2026-10-06 15:54:34
3F722B16-A1D0-44E0-933E-009C23282F60,Mikaela - Quote 2087 Sent,"3 Mosholu Wy, Point Cook VIC 3030
Muhammad Muneeb Afridi, 0452124213 
His Wife - 0415486211
- Kitchen sink tap become loose",,,0,No,Jobs,,2026-08-14 19:36:05,2026-10-06 15:54:34
60FD2810-6726-4A42-94B7-C9D57BAF54BD,Makayla - Job 2524 / Quote 2092 Sent Every morning until 10am or Saturday,"11 Camini Grv, Truganina VIC 3029
Joan Sebastian Sierra Gomez (Tenant) - 0449205103
- Repair the ensuite light switch, as the light does not stay on.",,,0,No,Jobs,,2026-08-19 16:49:15,2026-10-06 15:54:34
94A9BC97-09E1-4AA1-A5AE-C5892D7EA858,Aman - Quote 2093 Sent,"4 Midlothian Ct, Point Cook VIC 3030
Mamta Biala, 0432 209 712
- Loud noise coming from Entrance ceiling",,,0,No,Jobs,,2026-08-19 16:55:59,2026-10-06 15:54:34
596059C2-6493-4A54-A101-0D233D655EFC,Dipali - Quote 2094 Sent,"1/35 Ailsa St, S Altona Meadows VIC 3028
Ildefonso Alcides Ayres Abreu Filho - 0455861667
- Washing machine",,,0,No,Jobs,,2026-08-19 16:57:23,2026-10-06 15:54:34
777F7251-BFE9-4441-BFA1-B3544F35479D,Mehreen - Quote 2091 Sent,"15 Dundee Way, Truganina VIC 3029
- Laundry glass replacement",,,0,No,Jobs,,2026-08-19 17:09:56,2026-10-06 15:54:34
763C7B0A-6C1C-4D84-BDEE-CC68F8BE1BC9,Mikaela - Quote,"44 Warrenwood Ave, Hoppers Crossing VIC 3029
Victor Woods, 0433 036 806
- Quote for repair of wall hole damage
- Quote for repair of damaged wardobe rollers",,,0,No,Jobs,,2026-08-20 19:54:28,2026-10-06 15:54:34
42E80FAD-F172-499D-8823-CBC64B6ECBBD,Sazya - Job 2507 / Quote 2097 Sent  - TO BE CONFIRMED,"20 Napier St, Tarneit VIC 3029
Vacate house
- Back sliding door doesn't close",,,0,No,Jobs,,2026-08-21 19:31:42,2026-10-06 15:54:34
4F0EF0A6-C432-44D6-B684-5ABE86C3C2CD,Sakshai - Quote 2115 Sent,"65 Banksia Cres, Hoppers Crossing VIC 3029
Narelle Sevenich (Tenant) - 0444 553 008
- The front door and screen door need fixing asap as the wooden door is getting harder to open and close as it is getting stuck to the door frame.
- The gutters as rusted and coming away from the roof.
- The laundry door needs repair",,,0,No,Jobs,,2026-08-21 19:58:00,2026-10-06 15:54:34
F1FBC373-E3D9-4B81-B94F-5BF0F1C9E3FF,Aman - Job,"4 Midlothian Ct, Point Cook VIC 3030
Mamta Biala (Tenant) - 0432 209 742
- Loud noise coming from Entrance ceiling ($200+GST)",,,0,No,Jobs,,2026-08-21 20:09:24,2026-10-06 15:54:34
AB73D904-D039-4F62-AF91-4D71794C4586,Mikaela - Quote 2102 Sent,"3 Mosholu Wy, Point Cook VIC 3030
Muhammad Muneeb Afridi, 0415486211 0452124213
- Kitchen sink tap come off",,,0,No,Jobs,,2026-08-24 15:16:53,2026-10-06 15:54:34
A384480F-C17A-4ADB-A394-69A6472DA0A3,Ayesha - Quote 2114 Sent,"69 Rockpool Road, Truganina VIC 3029
MUHAMMAD LUQMAN JAVAID (Tenant) - 0404213260
- Check with tenants all maintenance issues and proivde qoutation",,,0,No,Jobs,,2026-08-26 18:23:35,2026-10-06 15:54:34
F5A1860D-643F-47B7-A1B4-6730F5178623,Mikaela - Quote - Sent in email,"50 South Avenue, Altona Meadows Vic 3028
Tanya Buck, 0415990521
- Both glass and secirity doors do not close or slide properly. Can not lock or secure these doors wothout using considerable force. Door handle on the glass door broken. Runners for door damaged
- Several lengths of gutter need replacing as rusted through. House and shed. Caising water damage tp hoise.
1. Front gates hinge welded to gate. Gate sitting in back yard.
2. Large gate. Hinge at bottom rusted through again welded to frame. Both gates same handyman with a welder.
3. Aircond, split system unit seems to be connected to power as relays reset with power. Remote will not work, new batteries, reset remote nut fails to start.
4. Rear door and security door. Both have runner issues. Main door and security door locks fail to operate. Bottom lip of lock broken on door frame. Could be as simple as new door runners and lock.
5. Roof gutter cleaning",,,0,No,Jobs,,2026-08-26 18:29:32,2026-10-06 15:54:34
67649DCD-94F6-492E-9CBF-74D6BF08C0E0,Makayla - Job 2591 / Quote 2111 - Sent,"38 Larson Avenue, Tarneit VIC 3029
Vishista Kanduri (Tenant) - 0412525425
- Dishwasher doesn't turn on",,,0,No,Jobs,,2026-08-27 18:53:15,2026-10-06 15:54:34
7732027A-FCB8-4C67-901E-ED77FF3F0342,Makayla - Quote 2118 Sent,"22 Hillcrest Parade, Tarneit VIC 3029
Govind Sharma (Tenant) - 0451 251 346
- The locks on the rooms, bathroom, and toilet are not working properly
- The chimney lights are not working. Can you pls provide quote ",,,0,No,Jobs,,2026-08-31 17:14:39,2026-10-06 15:54:34
93D79F65-0DBE-4144-A93A-926CD1A39607,Parneet - Quote 2120 Sent,"22 Homestead Ave, Tarneit VIC 3029
Walter Kipruto. (Tenant) - 0466520509
- Garage remote not functioning",,,0,No,Jobs,,2026-09-02 19:28:10,2026-10-06 15:54:34
5BE27D03-77A3-4D5A-B196-6C32E70BFAB9,Laura - Quote 2125 Sent,"11 Pittsford Rd, Manor Lakes VIC 3024
Elisara Elisara (Tenant) - 0435 994 430
- Broken Letterbox",,,0,No,Jobs,,2026-09-03 19:27:36,2026-10-06 15:54:34
C17E9CBC-7E8A-4162-B68D-9A17C5B25379,Aman - Quote 2126 Sent,"14 Honolulu Drive, Point Cook, Vic 3030
Anika - 0415241308- Lights not working - Front, Back, Ground floor lounge, Rangehood
- Check quote",,,0,No,Jobs,,2026-09-03 20:16:44,2026-10-06 15:54:34
C9D13298-81A3-4917-B031-2ACAC23423AA,Sneha - Quote 2030 Sent,"37 Luster Cres, Tarneit VIC 3029
Gopinadh Kolluri (Tenant) - 0434 347 688
– Main burner doesn't stay on. Most likely cooktop needs replacement
Quote for below
Switch board - circuit protection
- Safety Switch not installed at switchboard
- Cooking Circuit - WIRING AND ACCESSORIES
- Air Con Unit WIRING AND ACCESSORIES
- DISTRIBUTION BOARDS not installed
- Electric oven and Aircon circuits needs to be protected by RCBO'S",,,0,No,Jobs,,2026-09-04 19:58:31,2026-10-06 15:54:34
77575947-6DBC-48CA-B642-8423A57E7D93,Prerna - Quote 2131 Sent,"46 Hummingbird Boulevard, Tarneit VIC 3029
Sahilpreet Singh (Tenant) - 0449 904 106
- Entrance double light switch needs replacement due to non functional
- Backyard flood light not working, We will change it to normal bulb setup for longer run its good for owner on rental house
- Supply and install new basin drain as water blocker is broken in both basin
- Unblock the kitchen sink and leakage repair underneath
- Smoke alarm come off from ceiling and unsafe, needs re-installation
- Supply and install new door lock for common toilet, as the lock is completely broken
- Supply and installation of canopy rangehood - 60cm
- Remove existing moldy shower silicon from common bathroom",,,0,No,Jobs,,2026-09-04 20:12:29,2026-10-06 15:54:34
C418C212-98A5-4E5B-A161-D3D5615C438C,Sakshi - Quote 2138 Sent,"26 Herbage Dr, Tarneit VIC 3029
Jaimin Patel (Tenant) - 0450 955 010
- Supply and install new wireless door bell",,,0,No,Jobs,,2026-09-07 17:45:41,2026-10-06 15:54:34
16F32057-9360-4E25-A441-70B35AAEDA3A,Ayesha - Quote 2142 Sent,"8 Callanish Street, Truganina 3029
Lovish Lovish (Tenant) - 0426143633
- Install new toilet paper roll holder
- Garage door repair
- Rangehood light",,,0,No,Jobs,,2026-09-08 14:58:13,2026-10-06 15:54:34
5C29EBFE-DEFA-4540-9289-4D66E2FC6EBD,Ayesha - Quote,"18 Crilly St, Tarneit VIC 3029
Naveen Naveen (Tenant) - 0478356991
- Mould and leaking in bathroom and cracks on wall",,,0,No,Jobs,,2026-09-08 15:10:28,2026-10-06 15:54:34
2C741CA9-B728-4372-8BA6-834C049C2469,Rav - Quote 2143 Sent,"23 Giri Way, Werribee VIC 3030
- Main security door lock is not working
- Hinge is damaged in bedroom 4 wardrobe
- Toilet seat is loose in ensuite
- Oven handle is loose",,,0,No,Jobs,,2026-09-09 18:11:39,2026-10-06 15:54:34
A2D499E5-7611-4A14-BB66-C1FC3BD8F669,Sneha - Quote 2145 Sent,"10 Gascoyne Way, Truganina VIC 3029
Sonia Chauhan (Tenant) - 0416 175 404
- Windows flyscreen replacement",,,0,No,Jobs,,2026-09-09 18:28:43,2026-10-06 15:54:34
BCE0ABAD-A36B-40DE-8CB0-56A8AEA898EF,Sneha - Quote 2147 Sent,"3 Fleur Way, Truganina VIC 3029
Prathyusha Goud Akula (Tenant) - 0477 067 963
- Water leak in the toilet & bad smell is coming out of the area
- Light in the kitchen is not working",,,0,No,Jobs,,2026-09-09 18:43:14,2026-10-06 15:54:34
F23A8737-EBF7-4AAA-9BEB-71CCC5B95807,Mikaela - Quote 2148 Sent,"45 Pottery Ave, Point Cook VIC 3030
Marwan Alwagdany (Tenant) - 0404758842
- Hole in kitchen area - mice entering",,,0,No,Jobs,,2026-09-09 18:56:29,2026-10-06 15:54:34
2B7EBBC3-7438-4203-9CF1-A698B6FBED0F,Sakshai - Quote 2149 Sent,"19 Conondale St, Tarneit VIC 3029
Mahmoud Atatreh (Tenant) - 0411 782 498
- The oven Knob is not operating.",,,0,No,Jobs,,2026-09-10 16:06:31,2026-10-06 15:54:34
A8B641E3-DFCB-415A-B3D6-EE937BAFBEE9,Makayla - Quote 2150 Sent,"8 Farmers Way, Point Cook VIC 3030
Salman Choudhry (Tenant) - +61474726084
- Dishwasher door is not closing",,,0,No,Jobs,,2026-09-10 16:09:48,2026-10-06 15:54:34
4C939603-AC04-4B98-90FB-CA8CC977BE15,Sneha - Quote 2152 Sent,"37 Luster Cres, Tarneit VIC 3029
Gopinadh Kolluri (Tenant) - 0434 347 688
- Cooktop & Range Hood whole replacement",,,0,No,Jobs,,2026-09-10 16:27:12,2026-10-06 15:54:34
6F0FBD90-A297-4935-92DE-4D5948C508F7,Dipali - Quote 1947,"21 Martaban Cres, Point Cook VIC 3030
Yangming An, 0406856639
- Entrance - The renters advised that the door knob lock is not working properly, making the door difficult to open.
- Kitchen - The renters advised that the rangehood filter is not working.",,,0,No,Jobs,,2026-09-11 15:50:03,2026-10-06 15:54:34
B6F61E85-13B4-4CD2-A032-83F11D8262BA,Parneet - Quote 2153 Sent,"2 Sanford Close, Strathtulloh VIC 3338
Amy Bell (Tenant) - 0417578302
- Dishwasher not closing",,,0,No,Jobs,,2026-09-11 15:52:59,2026-10-06 15:54:34
FB839137-3DF2-4FEE-BEF8-90D3A95EA967,Mehreen - Quote 2156,"42 Marwood Avenue, Truganina VIC 3029
NAJIBULLAH BARAICH (Tenant) - 0474788652
- Range hood is not working
- Cooktop burners are also not working",,,0,No,Jobs,,2026-09-11 18:48:34,2026-10-06 15:54:34
3220101D-4152-4EE9-AC46-43F37BEDA2D2,Sneha - Quote 2157 Sent,"15 Jura St, Truganina VIC 3029
Adarsh Pal Singh Toor (Tenant) - 0422 180 108
- Two kitchen taps and one tap in the main bathroom are loose.
- The backyard screen door is misaligned and requires adjustment",,,0,No,Jobs,,2026-09-11 18:51:02,2026-10-06 15:54:34
741B5580-1903-4E2C-B82A-AB4700F725EC,Mikaela - Job,"20 Adelong Bvd, Cobblebank VIC 3338
Ioane Paka Teokotai Tom (Tenant) - 0450414107
- Paint a draw marks",,,0,No,Jobs,,2026-09-14 21:56:09,2026-10-06 15:54:34
173800AF-7AF0-4C5E-BCFA-FE2B5240AA07,Mehreen - Quote 2163 Sent,"369 Bethany Road, Tarneit VIC 3029
Muhammad Bilal Afsar (Tenant) - 0452526049
- Ensuite door. its lose from its hinges",,,0,No,Jobs,,2026-09-15 11:02:03,2026-10-06 15:54:34
3274DA43-9839-4392-ACBF-DE17D178CFE8,Mehreen - Quote 2165 Sent,"17 MacLaren Dr, Melton South VIC 3338
Furaha Bitisio. (Tenant) - 0470551089
- Shower headset issue water is not coming form headset",,,0,No,Jobs,,2026-09-15 20:03:51,2026-10-06 15:54:34
3D0A4451-5B1A-4791-9FD6-EA22616B42E6,Mehreen - Quote 2193 Sent,"17 Silverwood Drive, Truganina VIC 3029
Evergelister Rundora (Tenant) - 0411285077
- oven door is not opening properly and appears to be stuck at approximately a 45-degree angle",,,0,No,Jobs,,2026-09-18 14:30:58,2026-10-06 15:54:34
28E30AB4-CEFE-49DE-BF51-DECB40D563CF,Mehreen - Quote ,"69 Westmeadows Lane, Truganina VIC 3029
Karandeep Singh (Tenant) - 0429649643
- Leakage in the property",,,0,No,Jobs,,2026-09-18 20:21:41,2026-10-06 15:54:34
634E56D2-28D9-4DAC-AB30-4572079383BC,Ekta - Quote,"5/5 Thomas Carr Dr, Tarneit VIC 3029
Rishupal Chhabra (Tenant) - 0470 696 015
- Remove carpets and change to timber or hybrid floor in bedrooms.",,,0,No,Jobs,,2026-09-18 20:37:45,2026-10-06 15:54:34
7F19719B-D82E-4716-88F9-E221D04C3201,Ekta - Quote,"13 Owlet St, Tarneit VIC 3029
Tushar (Tenant) - 0499 017 098
- Plaster damaged repair in hallway wall and the indoor garage door, which has a gap at the bottom and is slightly difficult to close.",,,0,No,Jobs,,2026-09-18 20:38:29,2026-10-06 15:54:34
4F22D26E-88CC-4FE3-A1FD-F3DE8F38B356,Ekta - Quote 2173 Sent,"6 Mallina Glen, Tarneit VIC 3029
Craig Windsor (Tenant) - 0435914305 / Betty 0428717481
1. Garage door hang issue.
2. last room floors board.
3. Dishwasher clip broken.",,,0,No,Jobs,,2026-09-21 11:07:33,2026-10-06 15:54:34
574683E4-C218-456F-A292-67C84D031163,Makayla - Quote 2174 - Sent,"35 Creston St, Point Cook VIC 3030
Ankit Soni (Tenant) - 0466659970
- Common bathroom exhaust not working
- 4 x Outdoor Flood light not working
- Assessment of non working Alfresco fan ",,,0,No,Jobs,,2026-09-21 12:20:23,2026-10-06 15:54:34
B9CA6164-2A7C-4205-88CB-CC8337DCFDFB,Mehreen - Quote 2176 - Sent,"+61 426 937 643
35 Cinnamara Circuit, Tarneit, Vic 3029
- Toilet tank leakage in the bowl",,,0,No,Jobs,,2026-09-21 13:31:14,2026-10-06 15:54:34
A1D8A418-E9E1-4DB6-A3C8-37C109771362,Rav / Dipali - Quote,"20B Honolulu Dr, Point Cook VIC 3030
- Replace the damaged skirting in kitchen area and paint the affected ceiling on kitchen",,,0,No,Jobs,,2026-09-21 22:06:53,2026-10-06 15:54:34
87F586A9-4D4D-480C-A46E-5FABA74B7B2A,Mikaela - Quote / Job,"130 Bondi Parade, Point Cook VIC 3030
Raymond Brown (Tenant) - 0492922640
- Mould/dampness alfresco celling - If >300, please send quote",,,0,No,Jobs,,2026-09-21 22:08:13,2026-10-06 15:54:34
C1A6FEA1-7ACE-4FF9-AEFB-C5EE5EA18CAC,Aman - Quote,"4 Opperman Pl, Point Cook VIC 3030
Nisha Nisha, 0478435864
- Garage roller door is making an unusual noise",,,0,No,Jobs,,2026-09-22 19:28:47,2026-10-06 15:54:34
0FAA86CB-829D-4DFC-A5ED-6BB3CAEB4000,Ekta - Quote 2178,"130 Warringa Crescent, Hoppers Crossing VIC 3029
Ashlesh Waghmare (Tenant) - 0430 968 195
- Bathroom exhaust fan and lights are not working.
- Blind curtain string needs to be replaced.",,,0,No,Jobs,,2026-09-22 19:40:38,2026-10-06 15:54:34
E0352D14-2019-438B-BCF9-9CC70014F5BF,Parneet - Job 2592 / Quote 2181 Sent,23 Wood Grove Burnside Victoria 3023
- Single story house full roof gutter cleaning
- Repair a toilet flush tank water leakage in the bowl
- Supply and install new basin tap wear set. Exclude basin,,,0,No,Jobs,,2026-09-23 18:50:34,2026-10-06 15:54:34
1862B094-722A-455B-BBB7-C364D7E28344,Sakshai - Quote 2180 Sent,"7 Constellation Cct, Truganina VIC 3029
Nitish Bhardwaj (Tenant) - 0415 339 806
- 2 x Garage remote isnt working",,,0,No,Jobs,,2026-09-23 19:06:59,2026-10-06 15:54:34
303AC056-F5C7-45D2-A2AB-922C446DF1E4,Dipali - Quote 2183 Sent,"34 Lincolnheath Boulevard, Point Cook VIC 3030
Devasena Ramanathan Natarajan, 0431401044
- Oven and dishwasher ",,,0,No,Jobs,,2026-09-23 19:10:59,2026-10-06 15:54:34
9B86154E-B052-47BB-B376-EBF0F398505B,Sneha - Job 2589 / Quote 2185 Sent,"17 Chloe Street, Tarneit VIC 3029
Amar Pal Singh (Tenant) - 0406 402 412
- Inside and outside few lights are not working",,,0,No,Jobs,,2026-09-24 19:16:06,2026-10-06 15:54:34
FE1E082D-87C1-4A9E-8295-33D624FB8C96,Sakshi - Quote 2187 Sent,"12 Omar St, Wyndham Vale VIC 3024
Zain Dean (Tenant) - 0411 709 501
- Garage remote is not working even after battery change by the tenant.
- Garage remote mounted on the wall is also not working.",,,0,No,Jobs,,2026-09-28 16:27:59,2026-10-06 15:54:34
79164037-FA15-428D-A8F2-18595093CE36,Mehreen - Quote 2188 Sent,"24 Toritta Way, Truganina VIC 3029
Baljeet Singh (Tenant) - 0405158467
- Replace 3 light bulbs - master bedroom , bedroom 2 and kitchen",,,0,No,Jobs,,2026-09-29 11:20:54,2026-10-06 15:54:34
AC5DC051-DC19-49C3-9369-8BB591E20201,Sneha - Quote 2189 Sent,"20 Artichoke Walk, Truganina VIC 3029
Krishna Phanindra Sai Pasupuleti (Tenant) - 0450 568 008
- Master bedroom ensuite door – The ensuite/bathroom door is missing.
- Back sliding door key – The key is not working when trying to unlock the sliding door from outside the backyard.
- Garage remote – We received two garage remotes. One is working, but the other one is not working.",,,0,No,Jobs,,2026-09-29 11:23:47,2026-10-06 15:54:34
2FE05D4B-588C-4BAE-A234-74D79D6B39C2,Mehreen - Quote 2190,"30 Annapurna Cres, Truganina VIC 3029
Naqash Panhwar (Tenant) - 0405636722
- Multiple issues
- Flyscreen is damage",,,0,No,Jobs,,2026-09-29 19:13:07,2026-10-06 15:54:34
B5C096C2-9594-4777-B672-49BD0C12FCEA,Dipali - Quote 2192 Sent,"6 Friendship Pl, Tarneit VIC 3029
- Please provide quote for re-silicon for the shower and skirting damage and toilet holder repair",,,0,No,Jobs,,2026-09-29 19:48:01,2026-10-06 15:54:34
E27EC2C0-41E8-4637-8FE1-5C66DDB12A82,Radiya - Quote 2205 Sent,"148 Ballan Rd, Werribee VIC 3030
Daniel Ward (Tenant) - 0422 941 297
Verandah post - Is rotten at the bottom and is not attached to frame",,,0,No,Jobs,,2026-09-30 21:43:52,2026-10-06 15:54:34
1AE9B90A-E716-4498-9BAB-C69D8B0022CC,Mehreen - Quote 2194 Sent,"8 Cotter Wy, Truganina VIC 3029
Simran Kaur (Tenant) - 0476269028
- Side door hinge came off due to the winds",,,0,No,Jobs,,2026-10-01 18:31:42,2026-10-06 15:54:34
C9556D9D-C5ED-4FB6-8CB0-F2A901F716E7,Dipali - Quote 2194 Sent,"17 Longfellow Dr, Delahey VIC 3037
- Front door handle has come loose and looks likes it’s going to fall off (for our security and safety I would like this repaired asap )
- Not a secure side gate - I don’t feel very safe in this property with the gate as it’s not a proper functioning gate with a secure lock - (it doesn’t open and shut without force) anyone is able to jump it and come in (it is also too heavy to move)
- Oven in the kitchen : The fan had been making a ticking sound in the oven and now the fan isn’t working at all and the oven isn’t turning on (I haven’t been able to use the oven to cook)",,,0,No,Jobs,,2026-10-01 19:12:04,2026-10-06 15:54:34
DBF10CB9-EB8B-4B9F-822B-AC13C4EE6F6D,Mehreen - Quote 2196 Sent ,"30 Jura St, Truganina VIC 3029
Heena Heena (Tenant) - 0476641996
- Water leakage in bathroom from roof Seems like roof is full of water at the moment. need to arrange someone on urgent basis",,,0,No,Jobs,,2026-10-01 19:23:57,2026-10-06 15:54:34
574C2E00-C6A1-4E11-BC57-185DC989474D,Sneha - Job 2603 / Quote 2197 Sent,"111/38 Clark St, Williams Landing VIC 3027
Priyanka Samudayapalepu (Tenant) - 0434 777 681
- Toilet flush button: We are arranging to have the missing/damaged flush button replaced.
- One black blind required at the window to help reduce the direct sunlight.",,,0,No,Jobs,,2026-10-01 20:25:29,2026-10-06 16:01:31
214A40DF-C630-4CFD-9FDB-A51AEECDB8E9,Mehreen - Quote 2198 Sent,"369 Bethany Road, Tarneit VIC 3029
Muhammad Bilal Afsar (Tenant) - 0452526049
- Gas leakage from stove. need to arrange someone to look into this",,,0,No,Jobs,,2026-10-02 19:40:03,2026-10-06 15:54:34
41DDBADA-0BFC-49A3-B1B8-D266EF1503AB,Mehreen - Job 2599,"29 Moombil Rd, Truganina VIC 3029
Mridul Sharma (Tenant) - 0403352612
- Broken blind in the lounge. need to fix/replace it",,,0,No,Jobs,,2026-10-02 19:48:00,2026-10-06 15:54:34
D2E5CF64-21DE-4446-B91D-E76FD9EF61D4,Sneha - Job 2601 / Quote 2199 Sent,"15 Jura St, Truganina VIC 3029
Adarsh Pal Singh Toor (Tenant) - 0422 180 108
- Two kitchen taps and one tap in the main bathroom are loose.
- The backyard screen door is misaligned and requires adjustment",,,0,No,Jobs,,2026-10-02 21:09:06,2026-10-06 15:54:34
95F6E552-7CE7-4C3F-814E-554CE9C6B132,Ekta - Quote 2200 Sent,"11 Teller Street, Tarneit VIC 3029
Miriama Atonio (Tenant) - 0481 142 346
- Both master bathroom and main bathroom shower silicon to be replace.",,,0,No,Jobs,,2026-10-02 21:29:56,2026-10-06 15:54:34
171878C2-429E-4631-8469-1170B2B338A5,Ekta - Quote,"26 Equity St, Rockbank VIC 3335
Manik Mahajan (Tenant) - 0468 905 813
- Garage roller door has not been working
- Turf needs to be fixed.",,,0,No,Jobs,,2026-10-02 21:33:06,2026-10-06 15:54:34
7280C343-7FDC-4322-B3AC-917E5F1F7C32,Sakshi - Quote 2202 Sent,"31 Frontier Cct, Tarneit VIC 3029
Tushar Malik (Tenant) - +6421 486 786 
0452 428 822
– Garage door not working with switch on the wall or remote",,,0,No,Jobs,,2026-10-03 12:01:45,2026-10-06 15:54:34
808D95C8-4F19-4D24-A27B-5086396C14BB,Ayesha - Job 2602 / Quote 2203 - Sent,"12 Codrington Rd, Truganina VIC 3029
KULWINDER SINGH (Tenant) - 0478035321
- Tenants have reported a roof leak that is causing mold to form and one light is not working. We need to arrange the handyman to check the inspect the issue and arrange for repairs. Please let us know if you approve this or if you would like us to coordinate with you.",,,0,No,Jobs,,2026-10-05 23:27:19,2026-10-06 15:54:34
90BD2D34-B953-43ED-9E9A-5690505C5288,Monika - Job,"10/22-30 Wallace Ave, Point Cook VIC 3030
Mounika Reddy (Agent) - 0459 902 092
- Toilet door handle is stuck",,,0,No,Jobs,,2026-10-05 23:30:51,2026-10-06 15:54:34
1C278D79-270A-40D8-B49B-9D9C48B99932,Sakshai - Quote 2204 Sent,"5 Fete Way, Tarneit VIC 3029
Deval Patel (Tenant) - 0416 113 757
The installation of mail Box is required at the property",,,0,No,Jobs,,2026-10-05 23:31:51,2026-10-06 16:00:53
FA48EE9A-A31C-410B-8D7C-2AAD7F55023C,Mehreen - Quote,"69 Westmeadows Lane, Truganina VIC 3029
Karandeep Singh (Tenant) - 0429649643
- Leakage in the property",,,0,No,Jobs,,2026-09-21 21:59:16,2026-09-27 13:28:20
0C6B9A9B-999B-4FD7-869A-FBD38F84C0D3,Sakshai - Quote 2206 Sent,"65 Makedonia St, Tarneit VIC 3029
Vamshi Teja Rasham Setti (Tenant) - 0451 693 441
- Dish washer is not working properly. The dishwasher is not draining properly and dishes come unclean.",,,0,No,Jobs,,2026-10-06 15:56:38,2026-10-06 15:57:48`;

// Helper regex to extract Australian address and suburb
const SUBURB_PATTERNS = [
  'Point Cook',
  'Werribee',
  'Wyndham Vale',
  'Hoppers Crossing',
  'Truganina',
  'Tarneit',
  'Altona North',
  'Altona Meadows',
  'Altona',
  'Laverton',
  'Mambourin',
  'Cobblebank',
  'Melton South',
  'Melton',
  'Deer Park',
  'Fraser Rise',
  'Williams Landing',
  'Manor Lakes',
  'Brookfield',
  'Rockbank',
  'Burnside',
  'Delahey',
  'Sanctuary Lakes',
  'Seabrook',
  'Strathtulloh'
];

function determineCategory(text) {
  const t = text.toLowerCase();
  if (t.includes('tap') || t.includes('leak') || t.includes('toilet') || t.includes('drain') || t.includes('sink') || t.includes('shower') || t.includes('water') || t.includes('basin') || t.includes('pipe') || t.includes('gutter')) return 'Plumbing';
  if (t.includes('light') || t.includes('switch') || t.includes('exhaust') || t.includes('fan') || t.includes('bulb') || t.includes('power') || t.includes('electrical') || t.includes('smoke alarm') || t.includes('oven coil')) return 'Electrical';
  if (t.includes('door') || t.includes('lock') || t.includes('roller') || t.includes('sliding') || t.includes('screen') || t.includes('latch') || t.includes('window') || t.includes('blind') || t.includes('handle') || t.includes('hinge')) return 'Door & Window';
  if (t.includes('plaster') || t.includes('wall') || t.includes('hole') || t.includes('drywall') || t.includes('crack') || t.includes('skirting') || t.includes('timber') || t.includes('floor')) return 'Drywall & Masonry';
  if (t.includes('paint')) return 'Painting';
  if (t.includes('heat') || t.includes('air') || t.includes('ac') || t.includes('cool') || t.includes('ducted')) return 'HVAC';
  if (t.includes('oven') || t.includes('cooktop') || t.includes('rangehood') || t.includes('dishwasher') || t.includes('stove')) return 'General Repair';
  return 'General Repair';
}

function determineStatus(title) {
  const t = title.toLowerCase();
  if (t.includes('quote') && t.includes('sent')) return 'Quoted';
  if (t.includes('job')) return 'In Progress';
  if (t.includes('quote')) return 'Quote Requested';
  return 'Quote Requested';
}

function determinePriority(notes) {
  const n = notes.toLowerCase();
  if (n.includes('urgent') || n.includes('leakage') || n.includes('burst') || n.includes('gas leak')) return 'Urgent';
  if (n.includes('lock') || n.includes('unable to be locked') || n.includes('safety concern') || n.includes('water damage')) return 'High';
  return 'Medium';
}

// Parse lines
const workbook = XLSX.read(rawCsvData, { type: 'string' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const cleanedData = rawRows.map((row, idx) => {
  const title = String(row.Title || '').trim();
  const notes = String(row.Notes || '').replace(/\r/g, '\n').trim();
  const dueDate = String(row['Due Date'] || '').trim();

  // Extract Property Manager Name & Job/Quote Number from Title (e.g. "Makayla - Job 2558 / Quote 2151 Sent")
  let agentName = '';
  let workOrderNo = '';
  const titleParts = title.split('-');
  if (titleParts.length > 1) {
    agentName = titleParts[0].trim();
    workOrderNo = titleParts.slice(1).join('-').trim();
  } else {
    workOrderNo = title;
  }

  // Parse Notes lines
  const lines = notes.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let address = '';
  let suburb = 'Point Cook';
  let clientName = '';
  let clientPhone = '';
  let taskDescriptions = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line is address
    let isAddr = false;
    for (const sub of SUBURB_PATTERNS) {
      if (line.toLowerCase().includes(sub.toLowerCase()) && (line.includes('VIC') || line.includes('Vic') || line.includes('30') || line.includes('33') || line.match(/\d+/))) {
        address = line;
        suburb = sub;
        isAddr = true;
        break;
      }
    }
    if (isAddr) continue;

    // Check if line is Tenant / Phone
    // e.g. "Patricia Mc Cann, 0419159257" or "Pravinesh Chand (Tenant) - 0450106100" or "+61 426 937 643"
    const phoneMatch = line.match(/(?:\+61|0)4\d{2}[\s\d-]{6,12}/) || line.match(/04\d{8}/) || line.match(/\+?\d[\d\s-]{8,15}/);
    if (phoneMatch && !address.includes(line)) {
      clientPhone = phoneMatch[0].trim();
      let namePart = line.replace(phoneMatch[0], '').replace(/\(Tenant\)|\(Agent\)|[-:,]/g, '').trim();
      if (namePart && namePart.length > 2) {
        clientName = namePart;
      }
      continue;
    }

    if (line.toLowerCase().startsWith('keys with') || line.toLowerCase().startsWith('vacate house')) {
      taskDescriptions.push(line);
      continue;
    }

    taskDescriptions.push(line);
  }

  // If clientName is empty, fallback
  if (!clientName) {
    clientName = agentName ? `${agentName} (Client)` : 'Client';
  }

  const cleanDescription = taskDescriptions.join('\n');
  const cleanTitle = taskDescriptions.length > 0 
    ? taskDescriptions[0].replace(/^[-–•\d.]+\s*/, '').slice(0, 60)
    : `${workOrderNo || 'Handyman Service'} - ${suburb}`;

  return {
    'Job Title': cleanTitle,
    'Client Name': clientName,
    'Client Phone': clientPhone,
    'Client Email': '',
    'Street Address': address || `Property Address, ${suburb} VIC`,
    'Suburb': suburb,
    'Status': determineStatus(title),
    'Priority': determinePriority(notes),
    'Category': determineCategory(notes),
    'Description': cleanDescription || notes,
    'Real Estate Agency': 'Ray White / Barry Plant Property Management',
    'Agent Name': agentName,
    'Agent Phone': '',
    'Work Order No': workOrderNo.replace('Sent', '').trim(),
    'Tenant Name': clientName,
    'Tenant Phone': clientPhone,
    'Estimated Mins': 60
  };
});

// Output clean CSV and clean XLSX files
const cleanSheet = XLSX.utils.json_to_sheet(cleanedData);
const cleanWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(cleanWorkbook, cleanSheet, 'Cleaned_HandyMap_Jobs');

// Set nice column widths
cleanSheet['!cols'] = [
  { wch: 40 }, // Job Title
  { wch: 25 }, // Client Name
  { wch: 18 }, // Client Phone
  { wch: 20 }, // Client Email
  { wch: 40 }, // Street Address
  { wch: 20 }, // Suburb
  { wch: 18 }, // Status
  { wch: 12 }, // Priority
  { wch: 20 }, // Category
  { wch: 60 }, // Description
  { wch: 35 }, // Real Estate Agency
  { wch: 18 }, // Agent Name
  { wch: 15 }, // Agent Phone
  { wch: 25 }, // Work Order No
  { wch: 25 }, // Tenant Name
  { wch: 18 }, // Tenant Phone
  { wch: 14 }  // Estimated Mins
];

const outputPathXlsx = path.join(__dirname, '../public/Cleaned_HandyMap_Jobs.xlsx');
const outputPathCsv = path.join(__dirname, '../public/Cleaned_HandyMap_Jobs.csv');

XLSX.writeFile(cleanWorkbook, outputPathXlsx);
const csvOutput = XLSX.utils.sheet_to_csv(cleanSheet);
fs.writeFileSync(outputPathCsv, csvOutput, 'utf8');

console.log(`Successfully processed ${cleanedData.length} jobs!`);
console.log(`Saved XLSX: ${outputPathXlsx}`);
console.log(`Saved CSV: ${outputPathCsv}`);
