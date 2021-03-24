const webpack = require('webpack');
const package = require('./package.json');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const childProcess = require('child_process');

const pluginName = 'thematic-slider';

// get version numbers and the hash of the current commit
const [major, minor, patch] = package.version.split('.');
const hash = JSON.stringify(childProcess.execSync('git rev-parse HEAD').toString().trim());

module.exports = function(variable={}, argv) {
    const config = {
        mode: argv.mode,
        devtool: argv.mode === 'development' ? 'source-map' : false,

        entry: ['./src/loader.js'],

        output: {
            path: path.join(__dirname, `../dist/${pluginName}`),
            filename: `./${pluginName}.js`
        },

        resolve: {
            extensions: ['.ts', '.js', '.css', '.scss']
        },

        module: {
            rules: [
                {
                    test: /\.s?[ac]ss$/,
                    use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
                },
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    include: [__dirname],
                    exclude: /node_modules/
                },
                {
                    test: /\.(png|svg)$/,
                    use: 'url-loader'
                }
            ]
        },

        optimization: {
            minimize: true,
            minimizer: [
              new TerserPlugin({
                extractComments: false
              })
            ]
        },

        plugins: [
            new CleanWebpackPlugin(),

            new MiniCssExtractPlugin({
                filename:  `./${pluginName}.css`
            }),

            new CopyWebpackPlugin({ patterns: [
                {
                    from: 'src/samples/*.+(html|json)',
                    to: 'samples/[name].[ext]',
                    toType: 'template',
                },
                {
                    from: '../fgpv/*.+(js|css)',
                    to: '../fgpv'
                }
            ]}),

            new webpack.BannerPlugin({
                banner: `Plugin ${pluginName}: ${major}.${minor}.${patch} - ${hash}`,
                include: /\.js$/
              })
        ],

        devServer: {
            host: '0.0.0.0',
            https: false,
            disableHostCheck: true,
            port: 6001,
            stats: { colors: true },
            compress: true,
            contentBase: [path.join(__dirname, `../dist/${pluginName}`), path.join(__dirname, '../dist')],
            watchContentBase: true
        }
    };

    return config;
};