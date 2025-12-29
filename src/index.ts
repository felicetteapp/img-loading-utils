import path from 'path';
import { readdirSync, writeFileSync } from 'fs';
import minimist from 'minimist';
import sharp from 'sharp';
import ColorThiefNode, {
  type RGBColor,
} from 'colorthief/src/color-thief-node.js';

const allowedImgsExtensions = ['.jpg', '.png', '.jpeg', '.gif', '.webp'];

export const getAllImagesFromDir = (dir: string) => {
  const files = readdirSync(dir);

  return (
    files &&
    files.filter((file) => {
      const ext = path.extname(file);
      return allowedImgsExtensions.includes(ext);
    })
  );
};

export const getColorsFromImage = async (image: string) => {
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
  htmlAttributes: Record<string, string>;
  htmlStyles: Record<string, string>;
  html: string;
}

export const generateThumbnailFromImage = async (
  image: string,
  outPath: string,
): Promise<ImgData> => {
  const originalImage = sharp(image);
  const metadata = await originalImage.metadata();

  const originalOrientation = metadata.orientation || 1;

  let width = metadata.width || 0;
  let height = metadata.height || 0;

  if (originalOrientation && originalOrientation !== 1) {
    originalImage.rotate();
    if (originalOrientation >= 5 && originalOrientation <= 8) {
      width = height;
      height = width;
    }
  }

  await originalImage
    .resize(200, 200, {
      fit: 'inside',
    })
    .toFile(outPath);

  const { colors, mainColor } = await getColorsFromImage(outPath);

  if (!colors || !mainColor) {
    throw new Error('Could not get colors from image');
  }

  const partialData: Omit<ImgData, 'htmlAttributes' | 'htmlStyles' | 'html'> = {
    fullSize: image,
    thumbnail: outPath,
    colors: colors,
    mainColor,
    width,
    height,
  };

  const htmlAttributes = generateHtmlAttributes(partialData);
  const htmlStyles = generateHtmlStyles(partialData);
  const html = generateHtml({ ...partialData, htmlAttributes, htmlStyles });

  return {
    ...partialData,
    htmlAttributes,
    htmlStyles,
    html,
  };
};

const args = minimist(process.argv.slice(2));
const prefix = args.prefix || 'il';

const withPrefix = (str: string) => `${prefix}-${str}`;

export const generateThumbnailPath = (image: string, outDir: string) => {
  return path.join(outDir, withPrefix(image));
};

export const thumbnailExists = (image: string, outDir: string) => {
  const thumbnailPath = generateThumbnailPath(image, outDir);
  try {
    const found = readdirSync(outDir).find(
      (file) => file === path.basename(thumbnailPath),
    );
    return !!found;
  } catch {
    return false;
  }
};

export const getAll = async (
  images: string[],
  outDir: string,
  inDir: string,
) => {
  const items: ImgData[] = [];
  for (const image of images) {
    const thumbnail = generateThumbnailPath(image, outDir);
    items.push(
      await generateThumbnailFromImage(path.join(inDir, image), thumbnail),
    );
  }

  return items;
};

export const generateHtmlAttributes = (
  data: Omit<ImgData, 'htmlAttributes' | 'htmlStyles' | 'html'>,
) => {
  const attrs = {
    [withPrefix('thumbnail')]: data.thumbnail,
    [withPrefix('fullsize')]: data.fullSize,
    [withPrefix('width')]: data.width,
    [withPrefix('height')]: data.height,
    [withPrefix('aspect-ratio')]: `${data.width}/${data.height}`,
    [withPrefix('main-color')]: `rgb(${data.mainColor.join(',')})`,
  };

  return attrs as ImgData['htmlAttributes'];
};

export const generateHtmlStyles = (
  data: Omit<ImgData, 'htmlAttributes' | 'htmlStyles' | 'html'>,
) => {
  const styles = {
    'max-width': '100%',
    'max-height': '100%',
    width: `${data.width}px`,
    height: `auto`,
    'background-color': `rgb(${data.mainColor.join(',')})`,
    'aspect-ratio': `${data.width}/${data.height}`,
  };

  return styles as ImgData['htmlStyles'];
};

export const generateHtml = (data: Omit<ImgData, 'html'>) => {
  const attrsString = Object.entries(data.htmlAttributes)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  const stylesString = Object.entries(data.htmlStyles)
    .map(([key, value]) => `${key}: ${value};`)
    .join(' ');

  return `<div img-loading ${attrsString} style="${stylesString}"></div>`;
};

if (require.main === module) {
  const images = getAllImagesFromDir(args.inDir);
  getAll(images, args.outDir, args.inDir).then((results) => {
    const items = results.map(generateHtml);

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
