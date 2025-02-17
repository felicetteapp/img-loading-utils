# img-loading-utils

## Description

This package provides utilities for generating thumbnails and extracting color information from images to use with [@felicetteapp/img-loading](https://github.com/felicetteapp/img-loading) package

## Installation

### Using GitHub Packages

To use this npm package from GitHub Packages, you need to configure your .npmrc file and install the package using the GitHub registry. Here are the steps:

- 1 Create or update your `.npmrc` file in the root of your project with the following content:

```sh
@felicetteapp:registry=https://npm.pkg.github.com
```

- 2 Authenticate with GitHub Packages by adding your GitHub token to the `.npmrc` file:

```sh
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_TOKEN
```

- 3 Install the package using the GitHub registry:

```sh
npm install @felicetteapp/img-loading-utils
```

## Usage

### CLI

You can use the package from the command line to generate thumbnails and extract color information from images in a directory.

#### Example

```sh
node dist/index.js --input-dir ./images --output-dir ./output
```

#### Options

- `--inDir`: The input directory containing the images.
- `--outDir`: The output directory where the thumbnails and data will be saved.
- `--prefix`: A prefix to add to the generated files

### API

You can also use the package programmatically.

#### Example

```js
import { getAll } from '@felicetteapp/img-loading-utils';
import path from 'path';

const inDir = './path/to/images';
const outDir = './path/to/output';
const images = ['image1.jpg', 'image2.png'];

getAll(images, outDir, inDir).then((results) => {
  console.log('Generated thumbnails and extracted color information:', results);
});
```
