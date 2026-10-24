// The Outfit the Figure wears in a Month (see CONTEXT.md). Colours are CSS colour strings.
export type Inner = 'strap' | 'tshirt' | 'longsleeve' | 'turtleneck' | 'tank' | 'blouse' | 'dress'
export type Outer = 'none' | 'jacket' | 'cardigan' | 'coat' | 'vest' | 'puffer'
export type Shoes = 'slipper' | 'slipper2' | 'runner'
export type Bag = 'none' | 'side' | 'bigside' | 'backpack' // bigside = bigger bag, thicker strap
export type Hat = 'none' | 'bucket' | 'cap' // bucket = low crown, brim sloping down all round; cap = peak in front
export type HairStyle = 'bob' | 'shortbob' | 'ponytail' | 'pigtails'

export type Outfit = {
  hair: string
  // bob = chin length, shortbob = a little shorter; ponytail (short, with side bangs) and pigtails
  // are short too — her hair is short.
  hairStyle: HairStyle
  skin: string
  inner: Inner // a dress is inner + bottom
  innerColor: string
  striped: boolean // horizontal stripes of innerColor + innerColor2
  innerColor2: string
  outer: Outer // vest = sleeveless; puffer = puffy quilted jacket
  outerColor: string
  bottomColor: string
  length: number // pants: 0 = bikini-short … 1 = full length; dress: 0 = mini … 1 = long
  width: number // 0 = slim … 1 = wide leg
  shoes: Shoes // slipper2 = two-colour slipper, runner = two-colour running shoes
  shoeColor: string
  shoeColor2: string
  bag: Bag
  bagColor: string
  scarf: boolean
  scarfColor: string
  hat: Hat
  hatColor: string
  hatDots: boolean // bucket hat only: small square dots on the crown
  hatDotColor: string
}

export const INNERS: Inner[] = ['strap', 'tshirt', 'longsleeve', 'turtleneck', 'tank', 'blouse', 'dress']
export const OUTERS: Outer[] = ['none', 'jacket', 'cardigan', 'coat', 'vest', 'puffer']
export const SHOES: Shoes[] = ['slipper', 'slipper2', 'runner']
export const BAGS: Bag[] = ['none', 'side', 'bigside', 'backpack']
export const HATS: Hat[] = ['none', 'bucket', 'cap']
export const HAIR_STYLES: HairStyle[] = ['bob', 'shortbob', 'ponytail', 'pigtails']

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
  bag: 'side',
  bagColor: '#c08552',
  scarf: false,
  scarfColor: '#e63946',
  hat: 'none',
  hatColor: '#e9d8a6',
  hatDots: false,
  hatDotColor: '#e63946',
}
