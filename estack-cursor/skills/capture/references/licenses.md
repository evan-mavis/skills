# Dependencies and asset rights

The capture code follows Estack's existing MIT license. No browser binaries, FFmpeg binaries, Python wheels, node modules, or dependency source are redistributed in this skill.

| External runtime | Observed license |
| --- | --- |
| agent-browser 0.38.1 | Apache-2.0, as declared by its installed package. |
| Pillow 12.3.0 | MIT-CMU, as declared by its installed distribution. |
| NumPy 2.3.5 | BSD-3-Clause for NumPy. Binary wheels include separately licensed libraries and their own notices. |
| FFmpeg and libx264 | License depends on build configuration. The tested libx264-enabled distribution is GPL-enabled. Provision it externally with its distribution's notices. |
| Chrome for Testing | Separately distributed under Google's browser terms and bundled third-party notices. |

`assets/airgoods.png` is the requester's supplied wallpaper, included at their request for this pipeline. Its original rights remain with its holder. No third-party license or new ownership is asserted. `assets/slim-black-cursor.png` is generated from the bundled renderer's original polygon geometry. It has no borrowed operating-system cursor asset. The renderer uses that same geometry directly at each Press scale.
