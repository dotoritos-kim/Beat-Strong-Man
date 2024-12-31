import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import { Config } from 'postcss-load-config';

const config: Config = {
    plugins: [
        autoprefixer(),
        cssnano({
            preset: 'default',
        }),
    ],
};

export default config;
