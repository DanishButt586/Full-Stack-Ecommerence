/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fef6f9',
                    100: '#fcedf3',
                    200: '#fad9e6',
                    300: '#f6b5d0',
                    400: '#f188b4',
                    500: '#e95a95',
                    600: '#d93775',
                    700: '#ca2d5f',
                    800: '#a8254f',
                    900: '#8c2145',
                },
                accent: {
                    50: '#fef6f7',
                    100: '#fdeef0',
                    200: '#fcdde2',
                    300: '#fabfc9',
                    400: '#f693a4',
                    500: '#ed5f7a',
                    600: '#d93e5f',
                    700: '#b82c49',
                    800: '#9a2740',
                    900: '#84243a',
                },
                cream: '#fef8f5',
                dark: {
                    50: '#f8f4f5',
                    100: '#e8dce0',
                    200: '#d1b9c1',
                    300: '#b897a2',
                    400: '#9f7483',
                    500: '#865164',
                    600: '#6d2e45',
                    700: '#541b2e',
                    800: '#3b0f1e',
                    900: '#220712',
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.5s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
