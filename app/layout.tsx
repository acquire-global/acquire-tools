'use client'

import { CssBaseline } from '@mui/material'
import { Roboto } from 'next/font/google'

const roboto = Roboto({
	subsets: ['latin'],
	display: 'swap',
	weight: ['300', '400', '500', '700'],
})

export default function RootLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<>
			<CssBaseline />
			<html lang='en' className={roboto.className}>
				<body>{children}</body>
			</html>
		</>
	)
}
