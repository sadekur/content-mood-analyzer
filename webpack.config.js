// webpack.config.js
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => ({
    mode: argv.mode || 'development',

    entry: {
        admin: path.resolve(__dirname, 'spa/admin/App.jsx'),
        public: path.resolve(__dirname, 'spa/public/shortcodes/src/App.jsx'),
        'tailwind.build': path.resolve(__dirname, 'assets/common/css/tailwind.css'),
    },

    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'build'),
        clean: true, // Clean build folder
    },

    module: {
        rules: [
            // 1. JavaScript & JSX → Use Babel
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                '@babel/preset-env',
                                {
                                    targets: {
                                        browsers: ['last 2 versions']
                                    }
                                }
                            ],
                            [
                                '@babel/preset-react',
                                {
                                    runtime: 'automatic'
                                }
                            ]
                        ]
                    }
                },
            },

            // 2. CSS → Process Tailwind + PostCSS
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader, // Extract CSS to files
                    'css-loader',                // Resolves @import and url()
                    {
                        loader: 'postcss-loader',
                        options: {
                            postcssOptions: {
                                plugins: [
                                    require('tailwindcss'),
                                    require('autoprefixer'),
                                ],
                            },
                        },
                    },
                ],
            },
        ],
    },

    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].bundle.css',  // Output CSS files with .css extension
        }),
    ],

    resolve: {
        extensions: ['.js', '.jsx'],
    },

    devtool: argv.mode === 'production' ? false : 'source-map',
});