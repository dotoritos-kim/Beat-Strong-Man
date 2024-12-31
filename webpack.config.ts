// Generated using webpack-cli https://github.com/webpack/webpack-cli

import path from 'path';
import webpack, { Configuration } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import 'webpack-dev-server';
import { fileURLToPath } from 'url'; // 👈 추가
const isProduction = process.env.NODE_ENV == 'production';
const { ProvidePlugin } = webpack;

const stylesHandler = MiniCssExtractPlugin.loader;
const __dirname = fileURLToPath(new URL('.', import.meta.url)); // 👈 추가
const __filename = fileURLToPath(import.meta.url); // 👈 추가
const config: Configuration = {
    entry: './src/index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath: '/', // Ensure this is set correctly for your setup
    },
    devtool: 'inline-source-map',
    devServer: {
        hot: true,
        static: {
            directory: path.join(__dirname, 'public'),
            serveIndex: false,
        },
        port: 8080,
        historyApiFallback: true, // Support for single-page applications
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: 'public/index.html',
            templateParameters: {
                PUBLIC_URL: '', // 로컬 개발에서는 빈 문자열로 설정
            },
        }),
        new MiniCssExtractPlugin(),
        new ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
            'iconv-lite': 'iconv-lite',
        }),
    ],
    resolve: {
        alias: {
            process: 'process/browser',
            '@Src': path.resolve(__dirname, './src/'),
            '@Asm': path.resolve(__dirname, './src/Asm/'),
            '@Bms': path.resolve(__dirname, './src/Helpers/bms/'),
        },
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.d.ts', '...', '.json'],
        modules: ['src', 'node_modules'],
    },
    module: {
        rules: [
            {
                test: /.(sass|scss|css)$/,
                use: [stylesHandler, 'css-loader', 'postcss-loader'],
            },

            {
                test: /\.worklet\.ts$/,
                loader: 'audio-worklet-loader',
                options: {
                    inline: 'no-fallback',
                },
            },
            {
                test: /\.(js|jsx|ts|tsx)$/,
                exclude: /(node_modules|__tests__)/,
                use: {
                    // `.swcrc` can be used to configure swc
                    loader: 'swc-loader',
                },
            },
            {
                test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|glb)$/i,
                loader: 'file-loader',
            },
        ],
    },
    experiments: {
        asyncWebAssembly: true,
    },
};

export default (() => {
    if (isProduction) {
        config.mode = 'production';
    } else {
        config.mode = 'development';
    }
    return config;
})();
