#!/usr/bin/env bash
# Regenerates every icon in assets/ from one vector mark: a cream crescent
# cradling a gold sparkle. Needs rsvg-convert (librsvg). Re-run after editing
# the geometry below and commit the PNGs.
set -euo pipefail
cd "$(dirname "$0")/../assets"

GREEN='#16B47E'
AMBER='#F18437'
CREAM='#FFF8EC'
GOLD='#FFC93C'

# The mark in a 1000x1000 box. $1 = crescent fill, $2 = sparkle fill.
mark() {
  cat <<SVG
  <mask id="m"><rect width="1000" height="1000" fill="white"/>
    <circle cx="610" cy="410" r="250" fill="black"/></mask>
  <circle cx="480" cy="520" r="300" fill="$1" mask="url(#m)"/>
  <path d="M655 250 Q672 343 750 360 Q672 377 655 470 Q638 377 560 360 Q638 343 655 250Z" fill="$2"/>
  <circle cx="770" cy="520" r="26" fill="$2"/>
SVG
}

# $1 = background (or none), $2 = scale of the mark, $3 crescent, $4 sparkle, $5 corner radius
svg() {
  local bg=$1 scale=$2 off
  off=$(awk "BEGIN{print 500*(1-$scale)}")
  echo "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1000 1000'>"
  [ "$bg" != none ] && echo "<rect width='1000' height='1000' rx='${5:-0}' fill='$bg'/>"
  echo "<g transform='translate($off $off) scale($scale)'>$(mark "$3" "$4")</g></svg>"
}

render() { rsvg-convert -w "$2" -h "$2" -o "$1" /dev/stdin; }

svg "$GREEN" 0.78 "$CREAM" "$GOLD" | render icon.png 1024
svg "$AMBER" 0.78 "$CREAM" "$GOLD" | render icon-dev.png 1024
# Adaptive icons crop to the inner ~66%, so the mark sits smaller here.
svg none 0.56 "$CREAM" "$GOLD" | render android-icon-foreground.png 1024
svg none 0.56 '#FFFFFF' '#FFFFFF' | render android-icon-monochrome.png 1024
svg "$GREEN" 0.72 "$CREAM" "$GOLD" 220 | render splash-icon.png 512
svg "$GREEN" 0.8 "$CREAM" "$GOLD" 220 | render favicon.png 48
echo "icons written to $(pwd)"
