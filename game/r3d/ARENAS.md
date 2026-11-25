# 3D arenas: status

Every fight backdrop has a painted-relief 3D set (depth map, scene_painted.js). Modelled sets are real dioramas
(scene_*.js, shared pieces in kit.js) and replace the relief for their backdrop (MODELED map in battle_bg.js).
Set `window.__lsPainted = true` to force the old painted relief for comparison.

## Modelled
- road / shrine / bridge: Moonlit Bamboo Road (scene_bamboo.js)
- festival: Festival Avenue
- blight: The Blight
- marsh: Lotus Marsh
- seacave: Sea Cave
- harbor: Pirate Harbor
- nw_street: Neon Ward Street
- sunken: Sunken Shrine
- mountain_pass: Mountain Pass (sunset, snow)
- rooftops: Rooftop Terrace
- nw_express: Neon Expressway
- w_village: Willow Village
- w_graves: Willow Graves
- sakebar: Sake Bar Alley
- nw_teahouse: Neon Teahouse
- nw_roof: Neon Ward Rooftop
- e_whale: Whalebone Shore
- e_light: Lighthouse Point
- e_dojo: Cliffside Dojo
- w_mill: Watermill Stream
- nw_snack: Snack Bar
- nw_pachinko: Pachinko Parlour
- nw_casino: Star Casino
- nw_web: Spider Roof
- w_bamboo: Bamboo Grove (real-world scale; painted props rg_jizo/iris/bamclump/mossrock/shimrope/hitodama; the stage painting as far backdrop)
- shrine → fox_shrine: Fox Shrine Stairs (real-world scale; painted 2D props rg_kitsune/maple/lily/mbush/shimenawa/leaves; the stage painting as far backdrop)
- road: Sunset Road (the festival road at dusk)
- tama / zoomies: Tama's room by day / 3 a.m.
- landlord, calamity, reno
- weather(2), sun(2), rushhour(2), proctor(2), oba(2), kuzuryu(2), holdline(2), golfdad(2): boss arenas with a phase-two look (name ending in 2)

## Still painted relief
none: every stage now has a modelled set every fight location now has a modelled set (the painted relief remains as the fallback)

## Later
- Fidelity test: pick ONE modelled map and try raising its fidelity with AI image-to-3D hero props (Figma Weave
  models, once the Figma account is linked to Weave at app.weavy.ai settings). Compare against the hand-built set
  before deciding whether to roll it out.

## Painted views (2026-11-25)
- `viewMat(name, {u0,u1,v0,v1,tint})` in kit.js: a slice of a `bg_<name>` panorama on an unlit window pane.
- New panoramas: `bg_sky_neon` (Neon Ward skyline in rain), `bg_sky_school` (sunset town with cherry trees), `bg_sky_cursed` (violet storm, ruined castle), `bg_sky_suburb` (dusk rooftops; not used yet).
- Exam Hall and Canteen windows now look out on the sunset town (red / toxic tint in phase two); the Snack Bar window shows the neon skyline under the rain streaks; Neon Teahouse has the painted skyline behind its towers; Calamity has the storm horizon above the stands.

## Finishing pass (lighting, real props, decals)
- diorama.js renders into a half-float target with a depth texture: depth-only ambient occlusion (half res, bilateral blur), mip-chain bloom with a soft threshold, then the existing tilt-shift/vignette/grade. `D.setFX({bloom, thr, knee, ao, aoR, env})`, `D.envLight()` builds an image-based light from the set's own hemisphere/fog/moon/lantern colours. `?fx=0` or localStorage `ls_fx=0` turns it all off. Low quality: no AO.
- kit.js `look(name)` holds the per-set look (neon / fire / golden / wet / room / gloss); battle_bg applies it when a set opens; painted sets get a light bloom only.
- kit.js `model(D, name, x, y, z, {s|h, ry, to, tint})` places CC0 Poly Haven props from r3d/mdl/*.glb (credits in mdl/CREDITS.md). Used in harbor, proctor, festival, nw_roof, nw_web, nw_snack, holdline, catroom, reno, landlord, sakebar, nw_teahouse, oba, nw_street.
- kit.js `decal()` / `decals()` lay floor (or wall) decals: procedural scorch/crack/moss/oil/stain/paper plus ambientCG photo decals (asphalt damage, manholes, gum, leak streaks, road arrow) in r3d/tex/dcl_*. Every modelled set has a decals() call next to its scatter().

## Connected world (free roam)
- roam_mode.js now runs a chain of areas, west to east: Willow Graves · Watermill · Willow Village · Moonlit Bamboo Road · Sunset Road · Festival Avenue · Sake Bar Alley · Neon Ward Street · Teahouse · Snack Bar · Rooftop · Expressway · Pirate Harbor · Cliffside Dojo · Lighthouse Point · Whalebone Shore. Walking off an area's end fades into the next; a painted signpost names it.
- Each arena area builds its set, then kit.walkPath() finds a walkable lane through it (ground raycast from just above the feet, box checks against everything solid, wiggling around obstacles). Foes (1–2) and loot (3) are scattered along it; region ends (graves, sake bar, expressway, whalebone) have a guardian and a locked hoard. Areas remember beaten foes and opened loot for the visit.
- A roam fight in an arena area is fought on that arena (battle_bg takes the area name as its key).
- 2D painted cut-outs (r3d/img/rg_*, generated in the game's style, keyed from green): commuter train (Rush Hour), sedan/kei truck/scooter traffic (Expressway), vending machines, ramen stall, neon sign cluster, bicycle, festival yatai, goldfish stall, taiko drum, fishing boat, fish-drying rack, weeping willow, village well, signpost. kit.dress() takes 'img:<name>' items to place cut-outs like the models.
