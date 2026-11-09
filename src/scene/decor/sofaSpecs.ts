// The measurements of the sofa, in meters, after Pilma's Dresde. Pilma gives
// its seat height, its leg height and its overall sizes: 190 to 270 wide,
// and 298 by 170 with the chaise longue. The parts below are off the product
// photos, scaled by those. The sofa faces +z and is laid out again at the
// width and depth the sliders give it, so its parts keep their size and the
// seats share out the width. The models are in Sofas.tsx.

// Its real width and depth, straight and with the chaise, and how far the
// chaise reaches out from the back.
export const SOFA_WIDTH = 2.3
export const SOFA_CHAISE_WIDTH = 2.98
export const SOFA_DEPTH = 0.98
export const SOFA_REACH = 1.7

// Painted metal legs, 17 cm tall, tapering to the floor and leaning out a
// little at the foot. Radius at the top and the foot, and the lean.
export const SOFA_LEG_H = 0.17
export const SOFA_LEG_R: [number, number] = [0.016, 0.009]
export const SOFA_LEG_SPLAY = 0.12

// The base the seat cushions sit on, on top of the legs.
export const SOFA_BASE_H = 0.08

// The loose seat cushions, whose top is the 42 cm seat before anyone sits.
export const SOFA_SEAT_H = 0.17
// A seat is never narrower than this. Once the width holds one more at
// this width, it shares out among one seat more.
export const SOFA_SEAT_MIN = 0.8

// The thin padded arms, which run the whole depth down to the tops of the
// legs: thickness and top.
export const SOFA_ARM_W = 0.12
export const SOFA_ARM_TOP = 0.64

// The upholstered back frame the back cushions lean on: its thickness and
// its top.
export const SOFA_BACK_T = 0.12
export const SOFA_BACK_TOP = 0.66

// The loose back cushions, one over each seat, standing on the seat and
// leaning back onto the frame so their top is at 89 cm: height, thickness
// and lean.
export const SOFA_CUSHION: [number, number, number] = [0.5, 0.2, 0.14]

// The small lumbar cushion in front of each back cushion: width at most,
// height, thickness and lean.
export const SOFA_LUMBAR: [number, number, number, number] = [0.55, 0.3, 0.12, 0.16]

// The plinth sofa, after Hay's Mags: a low deep block standing on a dark
// plinth set back from its edges, with wide square arms and back, one seat
// cushion and one tall back cushion per seat. Plinth height and setback,
// arm width and top, back thickness and top, the deck under the cushions,
// and the back cushions' height, thickness and lean.
export const BLOCK_PLINTH: [number, number] = [0.05, 0.035]
export const BLOCK_ARM_W = 0.2
export const BLOCK_ARM_TOP = 0.6
export const BLOCK_BACK_T = 0.2
export const BLOCK_BACK_TOP = 0.7
export const BLOCK_DECK_TOP = 0.25
export const BLOCK_CUSHION: [number, number, number] = [0.42, 0.18, 0.08]

// The rail sofa, after Karimoku's Castor: an open teak frame on round
// tapered legs, a flat board for each arm and rails round the seat, with
// the cushions laid in it. Arm board width, thickness and top, leg radius
// at the top and the foot, the seat rails' height and top, the upholstered
// back's thickness and top, and the back cushions' height, thickness and
// lean.
export const RAIL_ARM: [number, number, number] = [0.07, 0.03, 0.6]
export const RAIL_LEG_R: [number, number] = [0.022, 0.015]
export const RAIL_SEAT_RAIL: [number, number] = [0.07, 0.3]
export const RAIL_BACK_T = 0.08
export const RAIL_BACK_TOP = 0.74
export const RAIL_CUSHION: [number, number, number] = [0.44, 0.16, 0.18]

// The cinema recliner, after home-theater seating: a row of wide plush leather
// bucket seats on a low dark base, a padded arm between every pair of seats as
// well as at the ends with a cup holder sunk in each arm top, a tall backrest
// with a separate headrest above it, and a footrest run out in front of every
// seat (always reclined). Seats are wide, so it holds fewer across a width. The
// model is in Sofas.tsx.
export const THEATER_SEAT_MIN = 0.95
// A short dark foot lifting the base off the floor, and the upholstered base
// block the seats sit on.
export const THEATER_FOOT_H = 0.06
export const THEATER_BASE_H = 0.14
// The plush seat cushion, whose top is the 42 cm seat.
export const THEATER_SEAT_H = 0.22
// The arms: wide at the ends, a little narrower between seats, both this tall.
export const THEATER_ARM_W = 0.26
export const THEATER_DIV_W = 0.18
export const THEATER_ARM_TOP = 0.62
// The cup holder sunk into the top of each arm: its radius and how deep.
export const THEATER_CUP_R = 0.045
export const THEATER_CUP_DEPTH = 0.05
// The padded back and, standing on top of it, the headrest: back thickness and
// top, then the headrest's height and thickness.
export const THEATER_BACK_T = 0.22
export const THEATER_BACK_TOP = 0.8
export const THEATER_HEAD_H = 0.24
export const THEATER_HEAD_T = 0.22
// The reclined footrest run out in front of each seat: how far it reaches and
// how thick the pad is.
export const THEATER_FOOT_LEN = 0.52
export const THEATER_FOOT_H2 = 0.16
// The LED accent strip along the front of the base.
export const THEATER_LED_H = 0.03
