// Generated using webpack-cli https://github.com/webpack/webpack-cli

import path from 'path';
import * as webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import 'webpack-dev-server';

const isProduction = process.env.NODE_ENV == 'production';

const stylesHandler = MiniCssExtractPlugin.loader;

const config: webpack.Configuration = {
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
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
            'iconv-lite': 'iconv-lite',
        }),
    ],
    resolve: {
        alias: {
            process: 'process/browser',
            path: require.resolve('path-browserify'),
            '@Src': path.resolve(__dirname, './src/'),
            '@Bms': path.resolve(__dirname, './src/Helpers/bms/'),
        },
        extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js', '.d.ts', '...', '.json'],
        modules: ['src', 'node_modules'],
        fallback: {
            buffer: require.resolve('buffer'),
        },
    },
    module: {
        rules: [
            {
                test: /.(sass|scss|css)$/,
                use: [stylesHandler, 'css-loader', 'postcss-loader'],
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
};

module.exports = () => {
    if (isProduction) {
        config.mode = 'production';
    } else {
        config.mode = 'development';
    }
    return config;
};
