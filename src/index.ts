import path from 'path';
import { readdirSync, writeFileSync } from 'fs';
import minimist from 'minimist';
import sharp from 'sharp';
import ColorThiefNode, {
  type RGBColor,
} from 'colorthief/src/color-thief-node.js';

const allowedImgsExtensions = ['.jpg', '.png', '.jpeg', '.gif', '.webp'];

const getAllImagesFromDir = (dir: string) => {
  const files = readdirSync(dir);

  return (
    files &&
    files.filter((file) => {
      const ext = path.extname(file);
      return allowedImgsExtensions.includes(ext);
    })
  );
};

const getColorsFromImage = async (image: string) => {
  const colors = await ColorThiefNode.getPalette(image, 5, 5);
  const mainColor = await ColorThiefNode.getColor(image, 5);
  return { mainColor, colors };
};

interface ImgData {
  fullSize: string;
  thumbnail: string;
  colors: RGBColor[];
  mainColor: RGBColor;
  width: number;
  height: number;
}

const generateThumbnailFromImage = async (image: string, outPath: string) => {
  const originalImage = sharp(image);
  const metadata = await originalImage.metadata();

  await originalImage
    .resize(200, 200, {
      fit: 'inside',
    })
    .toFile(outPath);

  const { colors, mainColor } = await getColorsFromImage(outPath);

  if (!colors || !mainColor) {
    throw new Error('Could not get colors from image');
  }

  return {
    fullSize: image,
    thumbnail: outPath,
    colors: colors,
    mainColor,
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
  };
};

const args = minimist(process.argv.slice(2));
const prefix = args.prefix || 'il';

const withPrefix = (str: string) => `${prefix}-${str}`;

export const getAll = async (
  images: string[],
  outDir: string,
  inDir: string,
) => {
  const items: ImgData[] = [];
  for (const image of images) {
    const thumbnail = path.join(outDir, withPrefix(image));
    items.push(
      await generateThumbnailFromImage(path.join(inDir, image), thumbnail),
    );
  }

  return items;
};

if (require.main === module) {
  const images = getAllImagesFromDir(args.inDir);
  getAll(images, args.outDir, args.inDir).then((results) => {
    const items = results.map(
      (result) => `
          <div
              img-loading
              ${withPrefix('thumbnail')}="${result.thumbnail}"
              ${withPrefix('fullsize')}="${result.fullSize}"
              ${withPrefix('width')}="${result.width}"
              ${withPrefix('height')}="${result.height}"
              ${withPrefix('aspect-ratio')}="${result.width}/${result.height}"
              ${withPrefix('main-color')}="rgb(${result.mainColor.join(',')})"
              style="
                max-width: 100%;
                max-height: 100%;
                width: ${result.width}px;
                height: auto;
                background-color: rgb(${result.mainColor.join(',')});
                aspect-ratio: ${result.width}/${result.height};
              "
          ></div>
          `,
    );

    const htmlFile = `<main>${items.join('\n')}</main>`;
    writeFileSync(path.join(args.outDir, 'index.html'), htmlFile);
    writeFileSync(
      path.join(args.outDir, 'data.json'),
      JSON.stringify(results, null, 2),
    );

    console.log('Done');
    console.log(`Generated ${images.length} images`);
    console.log('Generated index.html and data.json at', args.outDir);
  });
}
