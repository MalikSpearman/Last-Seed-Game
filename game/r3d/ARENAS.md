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
- road: Sunset Road (the festival road at dusk)
- tama / zoomies: Tama's room by day / 3 a.m.
- landlord, calamity, reno
- weather(2), sun(2), rushhour(2), proctor(2), oba(2), kuzuryu(2), holdline(2), golfdad(2): boss arenas with a phase-two look (name ending in 2)

## Still painted relief
none: every fight location now has a modelled set (the painted relief remains as the fallback)

## Later
- Fidelity test: pick ONE modelled map and try raising its fidelity with AI image-to-3D hero props (Figma Weave
  models, once the Figma account is linked to Weave at app.weavy.ai settings). Compare against the hand-built set
  before deciding whether to roll it out.
