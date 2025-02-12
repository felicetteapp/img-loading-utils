declare module "colorthief/src/color-thief-node.js" {
  export type RGBColor = [number, number, number];

  const lib :{
    getColor: (img: string | null, quality: number) =>
      Promise<RGBColor | null>,
    getPalette: (
      img: string | null,
      colorCount: number,
      quality: number
    ) => Promise<RGBColor[] | null>,
  };
  export default lib;
}
