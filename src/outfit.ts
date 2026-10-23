// The Outfit the Figure wears in a Month (see CONTEXT.md). Colours are CSS colour strings.
export type Inner = 'strap' | 'tshirt' | 'longsleeve' | 'tank' | 'blouse' | 'dress'
export type Outer = 'none' | 'jacket' | 'cardigan' | 'coat'
export type Shoes = 'slipper' | 'slipper2' | 'runner'
export type HairStyle = 'bob' | 'shortbob'

export type Outfit = {
  hair: string
  hairStyle: HairStyle // bob = chin length, shortbob = a little shorter
  skin: string
  inner: Inner // a dress is inner + bottom
  innerColor: string
  striped: boolean // horizontal stripes of innerColor + innerColor2
  innerColor2: string
  outer: Outer
  outerColor: string
  bottomColor: string
  length: number // 0 = shorts … 1 = full length (also the dress length)
  width: number // 0 = slim … 1 = wide leg
  shoes: Shoes // slipper2 = two-colour slipper, runner = two-colour running shoes
  shoeColor: string
  shoeColor2: string
  bag: boolean
  bagColor: string
}

export const INNERS: Inner[] = ['strap', 'tshirt', 'longsleeve', 'tank', 'blouse', 'dress']
export const OUTERS: Outer[] = ['none', 'jacket', 'cardigan', 'coat']
export const SHOES: Shoes[] = ['slipper', 'slipper2', 'runner']
export const HAIR_STYLES: HairStyle[] = ['bob', 'shortbob']

export const DEFAULT_OUTFIT: Outfit = {
  hair: '#2b1d16',
  hairStyle: 'bob',
  skin: '#f1c7a5',
  inner: 'tshirt',
  innerColor: '#f4f1ea',
  striped: false,
  innerColor2: '#1d3557',
  outer: 'jacket',
  outerColor: '#3d5a80',
  bottomColor: '#22223b',
  length: 1,
  width: 0.3,
  shoes: 'runner',
  shoeColor: '#ffffff',
  shoeColor2: '#e63946',
  bag: true,
  bagColor: '#c08552',
}
